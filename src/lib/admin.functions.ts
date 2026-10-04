import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

async function admin() {
  const { requireAdmin } = await import("./auth.server");
  return requireAdmin(getRequest());
}

/** Deletes R2 objects and media rows for the given media ids. */
async function purgeMedia(mediaIds: string[]) {
  const { cfEnv } = await import("./cf-env.server");
  const env = await cfEnv(getRequest());
  if (!env.DB || !env.MEDIA || !mediaIds.length) return;
  const marks = mediaIds.map(() => "?").join(", ");
  const { results } = await env.DB.prepare(`SELECT id, r2_key FROM media WHERE id IN (${marks})`)
    .bind(...mediaIds)
    .all<{ id: string; r2_key: string }>();
  for (const m of results) await env.MEDIA.delete(m.r2_key);
  await env.DB.prepare(`UPDATE media SET status = 'deleted' WHERE id IN (${marks})`).bind(...mediaIds).run();
}

export const getAdminOverview = createServerFn({ method: "POST" }).handler(async () => {
  const { db } = await admin();
  const [users, posts, pendingReels, reports] = await Promise.all([
    db
      .prepare(
        `SELECT id, username, display_name, email, created_at, is_restricted FROM profiles
         WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 500`,
      )
      .all<{ id: string; username: string; display_name: string; email: string | null; created_at: string; is_restricted: number }>(),
    db
      .prepare(
        `SELECT p.id, p.body, p.created_at, pr.username,
          (SELECT COUNT(*) FROM post_images pi WHERE pi.post_id = p.id) AS images
         FROM posts p JOIN profiles pr ON pr.id = p.author_id WHERE p.deleted_at IS NULL
         ORDER BY p.created_at DESC LIMIT 100`,
      )
      .all<{ id: string; body: string; created_at: string; username: string; images: number }>(),
    db
      .prepare(
        `SELECT r.id, r.caption, r.created_at, r.duration_ms, pr.username, m.r2_key FROM reels r
         JOIN profiles pr ON pr.id = r.author_id JOIN media m ON m.id = r.video_media_id
         WHERE r.status = 'pending' AND r.deleted_at IS NULL ORDER BY r.created_at ASC`,
      )
      .all<{ id: string; caption: string; created_at: string; duration_ms: number; username: string; r2_key: string }>(),
    db
      .prepare(
        `SELECT c.id, c.target_type, c.target_id, c.reason, c.created_at, pr.username AS reporter FROM content_reports c
         JOIN profiles pr ON pr.id = c.reporter_id WHERE c.status = 'open' ORDER BY c.created_at DESC LIMIT 200`,
      )
      .all<{ id: string; target_type: string; target_id: string; reason: string; created_at: string; reporter: string }>(),
  ]);
  const { mediaUrl } = await import("./cf-env.server");
  return {
    userCount: users.results.length,
    users: users.results.map((u) => ({ ...u, restricted: Boolean(u.is_restricted) })),
    posts: posts.results.map((p) => ({ ...p, images: Number(p.images) })),
    pendingReels: pendingReels.results.map((r) => ({ ...r, video: mediaUrl(r.r2_key)! })),
    reports: reports.results,
  };
});

export const adminDeletePost = createServerFn({ method: "POST" })
  .inputValidator((i: { postId: string }) => z.object({ postId: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    const { db } = await admin();
    const { results } = await db
      .prepare("SELECT media_id FROM post_images WHERE post_id = ?")
      .bind(data.postId)
      .all<{ media_id: string }>();
    await db.prepare("UPDATE posts SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), data.postId).run();
    await purgeMedia(results.map((r) => r.media_id));
    return { ok: true };
  });

export const adminReviewReel = createServerFn({ method: "POST" })
  .inputValidator((i: { reelId: string; approve: boolean }) =>
    z.object({ reelId: z.string().min(1), approve: z.boolean() }).parse(i),
  )
  .handler(async ({ data }) => {
    const { db } = await admin();
    const reel = await db
      .prepare("SELECT video_media_id, poster_media_id FROM reels WHERE id = ?")
      .bind(data.reelId)
      .first<{ video_media_id: string; poster_media_id: string | null }>();
    if (!reel) throw new Error("Reel not found.");
    if (data.approve) {
      await db.prepare("UPDATE reels SET status = 'approved' WHERE id = ?").bind(data.reelId).run();
    } else {
      await db.batch([
        db.prepare("DELETE FROM reel_likes WHERE reel_id = ?").bind(data.reelId),
        db.prepare("DELETE FROM reels WHERE id = ?").bind(data.reelId),
      ]);
      await purgeMedia([reel.video_media_id, reel.poster_media_id].filter(Boolean) as string[]);
    }
    return { ok: true };
  });

export const adminSetRestricted = createServerFn({ method: "POST" })
  .inputValidator((i: { profileId: string; restricted: boolean }) =>
    z.object({ profileId: z.string().min(1), restricted: z.boolean() }).parse(i),
  )
  .handler(async ({ data }) => {
    const { db, profile } = await admin();
    if (data.profileId === profile.id) throw new Error("You can't restrict yourself.");
    await db
      .prepare("UPDATE profiles SET is_restricted = ?, restricted_at = ? WHERE id = ?")
      .bind(data.restricted ? 1 : 0, data.restricted ? new Date().toISOString() : null, data.profileId)
      .run();
    return { ok: true };
  });

/** Report actions: dismiss, remove the reported content, or restrict its author. */
export const adminResolveReport = createServerFn({ method: "POST" })
  .inputValidator((i: { reportId: string; action: "dismiss" | "remove" | "restrict" }) =>
    z.object({ reportId: z.string().min(1), action: z.enum(["dismiss", "remove", "restrict"]) }).parse(i),
  )
  .handler(async ({ data }) => {
    const { db } = await admin();
    const report = await db
      .prepare("SELECT target_type, target_id FROM content_reports WHERE id = ?")
      .bind(data.reportId)
      .first<{ target_type: string; target_id: string }>();
    if (!report) throw new Error("Report not found.");
    const now = new Date().toISOString();
    if (data.action === "remove" || data.action === "restrict") {
      let authorId: string | null = null;
      if (report.target_type === "post") {
        const row = await db.prepare("SELECT author_id FROM posts WHERE id = ?").bind(report.target_id).first<{ author_id: string }>();
        authorId = row?.author_id ?? null;
        if (data.action === "remove") {
          const { results } = await db.prepare("SELECT media_id FROM post_images WHERE post_id = ?").bind(report.target_id).all<{ media_id: string }>();
          await db.prepare("UPDATE posts SET deleted_at = ? WHERE id = ?").bind(now, report.target_id).run();
          await purgeMedia(results.map((r) => r.media_id));
        }
      } else if (report.target_type === "reel") {
        const row = await db
          .prepare("SELECT author_id, video_media_id, poster_media_id FROM reels WHERE id = ?")
          .bind(report.target_id)
          .first<{ author_id: string; video_media_id: string; poster_media_id: string | null }>();
        authorId = row?.author_id ?? null;
        if (data.action === "remove" && row) {
          await db.batch([
            db.prepare("DELETE FROM reel_likes WHERE reel_id = ?").bind(report.target_id),
            db.prepare("DELETE FROM reels WHERE id = ?").bind(report.target_id),
          ]);
          await purgeMedia([row.video_media_id, row.poster_media_id].filter(Boolean) as string[]);
        }
      } else {
        authorId = report.target_id;
      }
      if (data.action === "restrict" && authorId)
        await db.prepare("UPDATE profiles SET is_restricted = 1, restricted_at = ? WHERE id = ?").bind(now, authorId).run();
    }
    await db
      .prepare("UPDATE content_reports SET status = ?, resolved_at = ? WHERE id = ?")
      .bind(data.action === "dismiss" ? "dismissed" : "resolved", now, data.reportId)
      .run();
    return { ok: true };
  });
