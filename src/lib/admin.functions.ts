import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const uuidish = z.string().min(1).max(64);

async function admin() {
  const { requireAdmin } = await import("./auth.server");
  return requireAdmin(getRequest());
}

export type AdminUser = {
  id: string;
  name: string;
  handle: string;
  email: string | null;
  joined: string;
  restricted: boolean;
  posts: number;
};
export type AdminPost = { id: string; text: string; handle: string; created: string; images: string[] };
export type AdminReel = {
  id: string;
  caption: string;
  handle: string;
  created: string;
  video: string | null;
  durationMs: number;
};
export type AdminReport = {
  id: string;
  source: "content" | "thought";
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  reporter: string;
  created: string;
  preview: string;
  targetAuthorId: string | null;
};

/** Everything the admin area shows, in one round trip. */
export const getAdminOverview = createServerFn({ method: "POST" }).handler(async () => {
  const { db } = await admin();
  const { mediaUrl } = await import("./cf-env.server");
  const [count, users, posts, images, reels, contentReports, thoughtReports] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM profiles WHERE deleted_at IS NULL").first<{ n: number }>(),
    db
      .prepare(
        `SELECT pr.id, pr.display_name, pr.username, pr.email, pr.created_at, pr.is_restricted,
          (SELECT COUNT(*) FROM posts p WHERE p.author_id = pr.id AND p.deleted_at IS NULL) AS posts
         FROM profiles pr WHERE pr.deleted_at IS NULL ORDER BY pr.created_at DESC LIMIT 500`,
      )
      .all<{
        id: string;
        display_name: string;
        username: string;
        email: string | null;
        created_at: string;
        is_restricted: number;
        posts: number;
      }>(),
    db
      .prepare(
        `SELECT p.id, p.body, p.created_at, pr.username FROM posts p JOIN profiles pr ON pr.id = p.author_id
         WHERE p.deleted_at IS NULL ORDER BY p.created_at DESC LIMIT 200`,
      )
      .all<{ id: string; body: string; created_at: string; username: string }>(),
    db
      .prepare(
        `SELECT pi.post_id, m.r2_key FROM post_images pi JOIN media m ON m.id = pi.media_id
         JOIN posts p ON p.id = pi.post_id WHERE p.deleted_at IS NULL ORDER BY pi.position`,
      )
      .all<{ post_id: string; r2_key: string }>(),
    db
      .prepare(
        `SELECT r.id, r.caption, r.created_at, r.duration_ms, pr.username, v.r2_key
         FROM reels r JOIN profiles pr ON pr.id = r.author_id LEFT JOIN media v ON v.id = r.video_media_id
         WHERE r.status = 'pending' AND r.deleted_at IS NULL ORDER BY r.created_at ASC`,
      )
      .all<{ id: string; caption: string; created_at: string; duration_ms: number; username: string; r2_key: string | null }>(),
    db
      .prepare(
        `SELECT c.id, c.target_type, c.target_id, c.reason, c.details, c.created_at, pr.username AS reporter,
          COALESCE(p.body, r.caption, tp.display_name, '') AS preview,
          COALESCE(p.author_id, r.author_id, tp.id) AS target_author
         FROM content_reports c JOIN profiles pr ON pr.id = c.reporter_id
         LEFT JOIN posts p ON c.target_type = 'post' AND p.id = c.target_id
         LEFT JOIN reels r ON c.target_type = 'reel' AND r.id = c.target_id
         LEFT JOIN profiles tp ON c.target_type = 'profile' AND tp.id = c.target_id
         WHERE c.status = 'pending' ORDER BY c.created_at DESC`,
      )
      .all<Record<string, string | null>>(),
    db
      .prepare(
        `SELECT tr.id, tr.thought_id, tr.reason, tr.details, tr.created_at, pr.username AS reporter,
          t.body AS preview, t.author_id AS target_author
         FROM thought_reports tr JOIN profiles pr ON pr.id = tr.reporter_id JOIN thoughts t ON t.id = tr.thought_id
         WHERE tr.status = 'pending' ORDER BY tr.created_at DESC`,
      )
      .all<Record<string, string | null>>(),
  ]);

  const reports: AdminReport[] = [
    ...contentReports.results.map((r) => ({
      id: r["id"]!,
      source: "content" as const,
      targetType: r["target_type"]!,
      targetId: r["target_id"]!,
      reason: r["reason"]!,
      details: r["details"] ?? null,
      reporter: `@${r["reporter"]}`,
      created: r["created_at"]!,
      preview: r["preview"] ?? "",
      targetAuthorId: r["target_author"] ?? null,
    })),
    ...thoughtReports.results.map((r) => ({
      id: r["id"]!,
      source: "thought" as const,
      targetType: "thought",
      targetId: r["thought_id"]!,
      reason: r["reason"]!,
      details: r["details"] ?? null,
      reporter: `@${r["reporter"]}`,
      created: r["created_at"]!,
      preview: r["preview"] ?? "",
      targetAuthorId: r["target_author"] ?? null,
    })),
  ];

  return {
    userCount: Number(count?.n ?? 0),
    users: users.results.map<AdminUser>((u) => ({
      id: u.id,
      name: u.display_name,
      handle: `@${u.username}`,
      email: u.email,
      joined: u.created_at,
      restricted: Boolean(Number(u.is_restricted)),
      posts: Number(u.posts),
    })),
    posts: posts.results.map<AdminPost>((p) => ({
      id: p.id,
      text: p.body,
      handle: `@${p.username}`,
      created: p.created_at,
      images: images.results.filter((i) => i.post_id === p.id).map((i) => mediaUrl(i.r2_key)!),
    })),
    pendingReels: reels.results.map<AdminReel>((r) => ({
      id: r.id,
      caption: r.caption,
      handle: `@${r.username}`,
      created: r.created_at,
      video: mediaUrl(r.r2_key),
      durationMs: r.duration_ms,
    })),
    reports,
  };
});

/** Approve makes a reel public; reject deletes its files from R2 and removes it. */
export const reviewReel = createServerFn({ method: "POST" })
  .inputValidator((input: { reelId: string; approve: boolean }) =>
    z.object({ reelId: uuidish, approve: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { db } = await admin();
    const now = new Date().toISOString();
    if (data.approve) {
      await db
        .prepare("UPDATE reels SET status = 'approved', reviewed_at = ? WHERE id = ? AND deleted_at IS NULL")
        .bind(now, data.reelId)
        .run();
      return { ok: true };
    }
    await removeReel(db, data.reelId, now);
    return { ok: true };
  });

type Db = Awaited<ReturnType<typeof admin>>["db"];

async function removeReel(db: Db, reelId: string, now: string) {
  const { getCfEnv } = await import("./cf-env.server");
  const media = getCfEnv(getRequest()).MEDIA;
  if (!media) throw new Error("Server is missing the MEDIA binding.");
  const { results } = await db
    .prepare(
      `SELECT m.id, m.r2_key FROM media m JOIN reels r ON m.id IN (r.video_media_id, r.poster_media_id)
       WHERE r.id = ?`,
    )
    .bind(reelId)
    .all<{ id: string; r2_key: string }>();
  for (const m of results) await media.delete(m.r2_key);
  const statements = [
    db
      .prepare("UPDATE reels SET status = 'rejected', reviewed_at = ?, deleted_at = ? WHERE id = ?")
      .bind(now, now, reelId),
    db.prepare("DELETE FROM reel_likes WHERE reel_id = ?").bind(reelId),
    ...results.map((m) => db.prepare("UPDATE media SET status = 'deleted' WHERE id = ?").bind(m.id)),
  ];
  await db.batch(statements);
}

export const setUserRestricted = createServerFn({ method: "POST" })
  .inputValidator((input: { profileId: string; restricted: boolean }) =>
    z.object({ profileId: uuidish, restricted: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { db, profile } = await admin();
    if (data.profileId === profile.id) throw new Error("You can't restrict your own account.");
    await db
      .prepare("UPDATE profiles SET is_restricted = ?, restricted_at = ? WHERE id = ?")
      .bind(data.restricted ? 1 : 0, data.restricted ? new Date().toISOString() : null, data.profileId)
      .run();
    return { ok: true };
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .inputValidator((input: { postId: string }) => z.object({ postId: uuidish }).parse(input))
  .handler(async ({ data }) => {
    const { db } = await admin();
    await db
      .prepare("UPDATE posts SET deleted_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), data.postId)
      .run();
    return { ok: true };
  });

/** Report actions: dismiss, remove the reported content, or restrict its author. */
export const resolveReport = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { reportId: string; source: "content" | "thought"; action: "dismiss" | "remove" | "restrict" }) =>
      z
        .object({
          reportId: uuidish,
          source: z.enum(["content", "thought"]),
          action: z.enum(["dismiss", "remove", "restrict"]),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const { db, profile } = await admin();
    const now = new Date().toISOString();
    const table = data.source === "content" ? "content_reports" : "thought_reports";
    const report = await db
      .prepare(
        data.source === "content"
          ? "SELECT target_type, target_id FROM content_reports WHERE id = ?"
          : "SELECT 'thought' AS target_type, thought_id AS target_id FROM thought_reports WHERE id = ?",
      )
      .bind(data.reportId)
      .first<{ target_type: string; target_id: string }>();
    if (!report) throw new Error("Report not found.");

    if (data.action === "remove") {
      if (report.target_type === "post")
        await db.prepare("UPDATE posts SET deleted_at = ? WHERE id = ?").bind(now, report.target_id).run();
      else if (report.target_type === "reel") await removeReel(db, report.target_id, now);
      else if (report.target_type === "thought")
        await db.prepare("UPDATE thoughts SET deleted_at = ? WHERE id = ?").bind(now, report.target_id).run();
    }
    if (data.action === "restrict") {
      const author = await db
        .prepare(
          report.target_type === "post"
            ? "SELECT author_id AS id FROM posts WHERE id = ?"
            : report.target_type === "reel"
              ? "SELECT author_id AS id FROM reels WHERE id = ?"
              : report.target_type === "thought"
                ? "SELECT author_id AS id FROM thoughts WHERE id = ?"
                : "SELECT id FROM profiles WHERE id = ?",
        )
        .bind(report.target_id)
        .first<{ id: string }>();
      if (author && author.id !== profile.id)
        await db.prepare("UPDATE profiles SET is_restricted = 1, restricted_at = ? WHERE id = ?").bind(now, author.id).run();
    }
    const status = data.action === "dismiss" ? "dismissed" : data.source === "content" ? "actioned" : "actioned";
    await db.prepare(`UPDATE ${table} SET status = ?, reviewed_at = ? WHERE id = ?`).bind(status, now, data.reportId).run();
    return { ok: true };
  });

/** Any signed-in member can report a post, reel or profile to LeBeHo. */
export const reportContent = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { targetType: "post" | "reel" | "profile"; targetId: string; reason: string; details?: string }) =>
      z
        .object({
          targetType: z.enum(["post", "reel", "profile"]),
          targetId: uuidish,
          reason: z.string().trim().min(1).max(80),
          details: z.string().trim().max(500).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireViewer } = await import("./auth.server");
    const { db, profile } = await requireViewer(getRequest());
    const existing = await db
      .prepare(
        "SELECT 1 FROM content_reports WHERE reporter_id = ? AND target_type = ? AND target_id = ? AND status = 'pending'",
      )
      .bind(profile.id, data.targetType, data.targetId)
      .first();
    if (existing) return { ok: true };
    await db
      .prepare(
        "INSERT INTO content_reports (id, reporter_id, target_type, target_id, reason, details) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(crypto.randomUUID(), profile.id, data.targetType, data.targetId, data.reason, data.details || null)
      .run();
    return { ok: true };
  });
