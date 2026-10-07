import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { Post, Profile, ProfileThought, Reel } from "./types";

function relativeTime(iso: string) {
  const then = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`).getTime();
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function placeholders(n: number) {
  return Array.from({ length: n }, () => "?").join(", ");
}

type PostRow = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  rush_hour_ends_at: string | null;
  is_rush_hour: number;
  is_vote_closed: number;
  vote_ends_at: string | null;
  hashtag_slug: string | null;
  thoughts_closed: number;
  display_name: string;
  username: string;
  profile_image_url: string | null;
  thought_count: number;
};

/** Current viewer's D1 profile; creates it on first sign-in. */
export const getViewer = createServerFn({ method: "POST" }).handler(async () => {
  const { viewerFrom, toPublicProfile, isAdminProfile } = await import("./auth.server");
  const { getDb } = await import("./cf-env.server");
  if (!getDb(getRequest()))
    return { live: false as const, profile: null, isAdmin: false, restricted: false };
  const viewer = await viewerFrom(getRequest());
  return {
    live: true as const,
    profile: viewer ? toPublicProfile(viewer.profile) : null,
    isAdmin: viewer ? isAdminProfile(viewer.profile) : false,
    restricted: Boolean(
      Number((viewer?.profile as { is_restricted?: number } | undefined)?.is_restricted ?? 0),
    ),
  };
});

export const searchHashtags = createServerFn({ method: "POST" })
  .inputValidator((input: { query?: string }) =>
    z.object({ query: z.string().max(40).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./cf-env.server");
    const db = getDb(getRequest());
    if (!db) return { live: false as const, hashtags: [] as { slug: string; name: string }[] };
    const query = (data.query ?? "").replace(/^#/, "").trim().toLowerCase();
    const { results } = await db
      .prepare(
        `SELECT slug, name FROM hashtags
         WHERE ? = '' OR slug LIKE ? OR name LIKE ?
         ORDER BY CASE WHEN slug = ? THEN 0 ELSE 1 END, created_at DESC LIMIT 12`,
      )
      .bind(query, `${query}%`, `${query}%`, query)
      .all<{ slug: string; name: string }>();
    return { live: true as const, hashtags: results };
  });

export const getHashtagPage = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string }) =>
    z.object({ slug: z.string().regex(/^[a-z0-9]{1,40}$/) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getDb, mediaUrl } = await import("./cf-env.server");
    const { viewerFrom } = await import("./auth.server");
    const db = getDb(getRequest());
    if (!db) return { live: false as const, hashtag: null, posts: [] as Post[] };
    const hashtag = await db
      .prepare("SELECT slug, name FROM hashtags WHERE slug = ?")
      .bind(data.slug)
      .first<{ slug: string; name: string }>();
    if (!hashtag) return { live: true as const, hashtag: null, posts: [] as Post[] };
    const viewer = await viewerFrom(getRequest()).catch(() => null);
    const { results } = await db
      .prepare(
        `${POST_SELECT} WHERE p.hashtag_slug = ? AND p.deleted_at IS NULL ORDER BY p.created_at DESC LIMIT 60`,
      )
      .bind(data.slug)
      .all<PostRow>();
    return {
      live: true as const,
      hashtag,
      posts: await hydratePosts(db, results, viewer?.profile.id ?? null, mediaUrl),
    };
  });

const SAMPLE_POSTS: Post[] = [
  {
    id: "sample-post-1",
    author: "Elena Rostova",
    handle: "@elena",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    time: "2h",
    text: "Structured tailoring or effortless oversized layering for tonight's gallery opening?",
    images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800"],
    thoughts: [
      {
        id: "thought-1",
        author: "Marcus Chen",
        handle: "@marcus_stylist",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        text: "The structured silhouette creates a bolder statement against art space lighting.",
        time: "1h",
        boosts: 14,
        replies: [
          {
            id: "reply-1",
            author: "Elena Rostova",
            handle: "@elena",
            text: "That makes sense. Going with the sharp shoulders!",
            time: "45m",
          },
        ],
      },
    ],
    thoughtCount: 1,
    live: false,
  },
  {
    id: "sample-post-2",
    author: "Sophia Laurent",
    handle: "@sophia_style",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    time: "4h",
    text: "Vintage leather trench vs modern matte finish? Seeking opinions for Autumn collection.",
    images: ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800"],
    thoughts: [],
    thoughtCount: 0,
    live: false,
  },
];

/** Discovery feed. `live: false` means no database here (preview) — show samples. */
export const listFeed = createServerFn({ method: "POST" })
  .inputValidator((input: { rushOnly?: boolean; authorHandle?: string } | undefined) =>
    z
      .object({ rushOnly: z.boolean().optional(), authorHandle: z.string().max(40).optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<{ live: boolean; posts: Post[] }> => {
    const { getDb, mediaUrl } = await import("./cf-env.server");
    const { viewerFrom } = await import("./auth.server");
    const db = getDb(getRequest());
    if (!db) return { live: false, posts: SAMPLE_POSTS };
    const viewer = await viewerFrom(getRequest()).catch(() => null);

    const where = ["p.deleted_at IS NULL"];
    const binds: unknown[] = [];
    if (data.rushOnly) {
      where.push("p.is_rush_hour = 1 AND p.rush_hour_ends_at > ?");
      binds.push(new Date().toISOString());
    }
    if (data.authorHandle) {
      where.push("pr.username = ?");
      binds.push(data.authorHandle.replace(/^@/, "").toLowerCase());
    }

    // Exclude reported posts that have pending reports in content_reports
    where.push(`NOT EXISTS (SELECT 1 FROM content_reports cr WHERE cr.target_type = 'post' AND cr.target_id = p.id AND cr.status = 'pending')`);

    // In feed/discovery, exclude expired Rush Hour posts and closed or expired Vote posts.
    // Note: If viewing a profile feed (authorHandle set), closed/expired vote posts remain available in post history!
    const nowIso = new Date().toISOString();
    if (!data.authorHandle) {
      where.push(`(p.is_rush_hour = 0 OR p.rush_hour_ends_at > '${nowIso}')`);
      where.push(`(p.is_vote_closed = 0 AND (p.vote_ends_at IS NULL OR p.vote_ends_at > '${nowIso}'))`);
    }

    const { results: rows } = await db
      .prepare(
        `SELECT p.id, p.author_id, p.body, p.created_at, p.rush_hour_ends_at, p.is_rush_hour,
          p.is_vote_closed, p.vote_ends_at, p.hashtag_slug,
          p.thoughts_closed, pr.display_name, pr.username, pr.profile_image_url,
          (SELECT COUNT(*) FROM thoughts t WHERE t.post_id = p.id AND t.deleted_at IS NULL AND t.is_hidden = 0) AS thought_count
        FROM posts p JOIN profiles pr ON pr.id = p.author_id
        WHERE ${where.join(" AND ")} ORDER BY p.created_at DESC LIMIT 60`,
      )
      .bind(...binds)
      .all<PostRow>();
    if (!rows.length) return { live: true, posts: [] };
    return {
      live: true,
      posts: await hydratePosts(db, rows, viewer?.profile.id ?? null, mediaUrl),
    };
  });

type Db = NonNullable<ReturnType<typeof import("./cf-env.server").getDb>>;

/** Adds images, vote tallies and the viewer's vote to D1 post rows. */
async function hydratePosts(
  db: Db,
  rows: PostRow[],
  viewerId: string | null,
  mediaUrl: (key: string | null | undefined) => string | null,
): Promise<Post[]> {
  const ids = rows.map((r) => r.id);
  const [images, choices, myVotes] = await Promise.all([
    db
      .prepare(
        `SELECT pi.post_id, m.r2_key FROM post_images pi JOIN media m ON m.id = pi.media_id
           WHERE pi.post_id IN (${placeholders(ids.length)}) ORDER BY pi.position`,
      )
      .bind(...ids)
      .all<{ post_id: string; r2_key: string }>(),
    db
      .prepare(
        `SELECT vc.id, vc.post_id, vc.label, COUNT(v.user_id) AS votes FROM vote_choices vc
           LEFT JOIN votes v ON v.choice_id = vc.id WHERE vc.post_id IN (${placeholders(ids.length)})
           GROUP BY vc.id ORDER BY vc.position`,
      )
      .bind(...ids)
      .all<{ id: string; post_id: string; label: string; votes: number }>(),
    viewerId
      ? db
          .prepare(
            `SELECT post_id, choice_id FROM votes WHERE user_id = ? AND post_id IN (${placeholders(ids.length)})`,
          )
          .bind(viewerId, ...ids)
          .all<{ post_id: string; choice_id: string }>()
      : Promise.resolve({ results: [] as { post_id: string; choice_id: string }[] }),
  ]);

  const nowMs = Date.now();
  const posts: Post[] = rows.map((r) => {
    const vote = choices.results
      .filter((c) => c.post_id === r.id)
      .map((c) => ({ id: c.id, label: c.label, votes: Number(c.votes) }));
    const voteEndsAtMs = r.vote_ends_at ? new Date(r.vote_ends_at).getTime() : undefined;
    const isVoteExpired = voteEndsAtMs ? voteEndsAtMs <= nowMs : false;
    const isVoteClosed = Boolean(r.is_vote_closed) || isVoteExpired;

    const post: Post = {
      id: r.id,
      author: r.display_name,
      handle: `@${r.username}`,
      authorAvatar: mediaUrl(r.profile_image_url) ?? undefined,
      time: relativeTime(r.created_at),
      text: r.body,
      images: images.results.filter((i) => i.post_id === r.id).map((i) => mediaUrl(i.r2_key)!),
      thoughts: [],
      thoughtCount: Number(r.thought_count),
      thoughtsClosed: Boolean(r.thoughts_closed),
      isVoteClosed,
      voteEndsAt: voteEndsAtMs,
      isAuthor: viewerId ? r.author_id === viewerId : false,
      live: true,
    };
    if (r.hashtag_slug) post.hashtag = r.hashtag_slug;
    if (vote.length) post.vote = vote;
    const mine = myVotes.results.find((v) => v.post_id === r.id)?.choice_id;
    if (mine) post.viewerVote = mine;
    if (r.is_rush_hour && r.rush_hour_ends_at)
      post.rushEndsAt = new Date(r.rush_hour_ends_at).getTime();
    return post;
  });
  return posts;
}

const POST_SELECT = `SELECT p.id, p.author_id, p.body, p.created_at, p.rush_hour_ends_at, p.is_rush_hour,
  p.is_vote_closed, p.vote_ends_at, p.hashtag_slug,
  p.thoughts_closed, pr.display_name, pr.username, pr.profile_image_url,
  (SELECT COUNT(*) FROM thoughts t WHERE t.post_id = p.id AND t.deleted_at IS NULL AND t.is_hidden = 0) AS thought_count
FROM posts p JOIN profiles pr ON pr.id = p.author_id`;

/** One post with its visible Thoughts and their conversations, for /posts/$postId. */
export const getPostDetail = createServerFn({ method: "POST" })
  .inputValidator((input: { postId: string }) =>
    z.object({ postId: z.string().min(1).max(64) }).parse(input),
  )
  .handler(
    async ({
      data,
    }): Promise<{ live: boolean; post: Post | null; boostedThoughtIds: string[] }> => {
      const { getDb, mediaUrl } = await import("./cf-env.server");
      const { viewerFrom } = await import("./auth.server");
      const db = getDb(getRequest());
      if (!db) {
        const sample = SAMPLE_POSTS.find((p) => p.id === data.postId) ?? SAMPLE_POSTS[0] ?? null;
        return { live: false, post: sample, boostedThoughtIds: [] };
      }
      const viewer = await viewerFrom(getRequest()).catch(() => null);
      const viewerId = viewer?.profile.id ?? "";

      const row = await db
        .prepare(`${POST_SELECT} WHERE p.id = ? AND p.deleted_at IS NULL`)
        .bind(data.postId)
        .first<PostRow>();
      if (!row) return { live: true, post: null, boostedThoughtIds: [] };

      const [[post], thoughts, replies] = await Promise.all([
        hydratePosts(db, [row], viewerId || null, mediaUrl),
        db
          .prepare(
            `SELECT t.id, t.author_id, t.body, t.created_at, pr.display_name, pr.username, pr.profile_image_url,
              (SELECT COUNT(*) FROM thought_boosts b WHERE b.thought_id = t.id) AS boosts,
              (SELECT COUNT(*) FROM thought_boosts b WHERE b.thought_id = t.id AND b.user_id = ?) AS mine
            FROM thoughts t JOIN profiles pr ON pr.id = t.author_id
            WHERE t.post_id = ? AND t.deleted_at IS NULL AND t.is_hidden = 0
            ORDER BY boosts DESC, t.created_at ASC`,
          )
          .bind(viewerId, data.postId)
          .all<{
            id: string;
            author_id: string;
            body: string;
            created_at: string;
            display_name: string;
            username: string;
            profile_image_url: string | null;
            boosts: number;
            mine: number;
          }>(),
        db
          .prepare(
            `SELECT r.id, r.thought_id, r.body, r.created_at, pr.display_name, pr.username
            FROM thought_replies r JOIN thoughts t ON t.id = r.thought_id
            JOIN profiles pr ON pr.id = r.author_id
            WHERE t.post_id = ? AND r.deleted_at IS NULL ORDER BY r.created_at`,
          )
          .bind(data.postId)
          .all<{
            id: string;
            thought_id: string;
            body: string;
            created_at: string;
            display_name: string;
            username: string;
          }>(),
      ]);

      if (!post) return { live: true, post: null, boostedThoughtIds: [] };
      post.thoughts = thoughts.results.map((t) => ({
        id: t.id,
        authorId: t.author_id,
        author: t.display_name,
        handle: `@${t.username}`,
        authorAvatar: mediaUrl(t.profile_image_url) ?? undefined,
        text: t.body,
        time: relativeTime(t.created_at),
        boosts: Number(t.boosts),
        replies: replies.results
          .filter((r) => r.thought_id === t.id)
          .map((r) => ({
            id: r.id,
            author: r.display_name,
            handle: `@${r.username}`,
            text: r.body,
            time: relativeTime(r.created_at),
          })),
      }));
      return {
        live: true,
        post,
        boostedThoughtIds: thoughts.results.filter((t) => Number(t.mine)).map((t) => t.id),
      };
    },
  );

const createPostSchema = z.object({
  text: z.string().trim().max(2000),
  mediaIds: z.array(z.string().uuid()).max(10),
  hashtag: z
    .string()
    .regex(/^[a-z0-9]{1,40}$/)
    .optional(),
  hashtagName: z.string().max(40).optional(),
  vote: z.array(z.string().trim().min(1).max(80)).min(2).max(6).optional(),
  voteDays: z.number().int().min(1).max(365).optional(),
  rushMinutes: z
    .number()
    .int()
    .min(1)
    .max(24 * 60)
    .optional(),
});

export const createPost = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof createPostSchema>) => createPostSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCreator: requireViewer } = await import("./auth.server");
    const { db, profile } = await requireViewer(getRequest());
    if (!data.text && !data.mediaIds.length) throw new Error("Write something or add a photo.");

    if (data.mediaIds.length) {
      const { results } = await db
        .prepare(
          `SELECT id FROM media WHERE owner_id = ? AND kind = 'image' AND status = 'ready'
           AND id IN (${placeholders(data.mediaIds.length)})`,
        )
        .bind(profile.id, ...data.mediaIds)
        .all<{ id: string }>();
      if (results.length !== data.mediaIds.length)
        throw new Error("One of the photos could not be found.");
    }

    const postId = crypto.randomUUID();
    const rushEndsAt = data.rushMinutes
      ? new Date(Date.now() + data.rushMinutes * 60_000).toISOString()
      : null;
    const voteEndsAt = data.vote && data.voteDays
      ? new Date(Date.now() + data.voteDays * 24 * 60 * 60_000).toISOString()
      : null;

    const statements = [];
    if (data.hashtag) {
      statements.push(
        db
          .prepare("INSERT OR IGNORE INTO hashtags (slug, name, created_by) VALUES (?, ?, ?)")
          .bind(data.hashtag, data.hashtagName || data.hashtag, profile.id),
      );
    }
    statements.push(
      db
        .prepare(
          `INSERT INTO posts (id, author_id, body, is_rush_hour, rush_hour_ends_at, vote_ends_at, hashtag_slug)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(postId, profile.id, data.text, rushEndsAt ? 1 : 0, rushEndsAt, voteEndsAt, data.hashtag ?? null),
    );
    data.mediaIds.forEach((mediaId, position) =>
      statements.push(
        db
          .prepare("INSERT INTO post_images (post_id, media_id, position) VALUES (?, ?, ?)")
          .bind(postId, mediaId, position),
      ),
    );
    data.vote?.forEach((label, position) =>
      statements.push(
        db
          .prepare("INSERT INTO vote_choices (id, post_id, label, position) VALUES (?, ?, ?, ?)")
          .bind(crypto.randomUUID(), postId, label, position),
      ),
    );
    await db.batch(statements);
    return { id: postId };
  });

export const castVote = createServerFn({ method: "POST" })
  .inputValidator((input: { postId: string; choiceId: string }) =>
    z.object({ postId: z.string().uuid(), choiceId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireViewer } = await import("./auth.server");
    const { db, profile } = await requireViewer(getRequest());

    const nowIso = new Date().toISOString();
    // Atomically insert vote ONLY IF the post is open, unexpired, and not deleted, and choice belongs to post
    const result = (await db
      .prepare(
        `INSERT OR IGNORE INTO votes (post_id, user_id, choice_id)
         SELECT vc.post_id, ?, vc.id
         FROM vote_choices vc
         JOIN posts p ON p.id = vc.post_id
         WHERE vc.id = ? AND vc.post_id = ?
           AND p.deleted_at IS NULL
           AND p.is_vote_closed = 0
           AND (p.vote_ends_at IS NULL OR p.vote_ends_at > ?)`,
      )
      .bind(profile.id, data.choiceId, data.postId, nowIso)
      .run()) as { meta?: { changes?: number }; changes?: number } | undefined;

    const changes = result?.meta?.changes ?? result?.changes ?? 0;
    if (!changes) {
      // Check if user already voted or if post is closed/expired
      const existingVote = await db
        .prepare("SELECT 1 FROM votes WHERE post_id = ? AND user_id = ?")
        .bind(data.postId, profile.id)
        .first();
      if (existingVote) return { ok: true };

      const post = await db
        .prepare("SELECT is_vote_closed, vote_ends_at FROM posts WHERE id = ? AND deleted_at IS NULL")
        .bind(data.postId)
        .first<{ is_vote_closed: number; vote_ends_at: string | null }>();

      if (!post) throw new Error("Post not found.");
      if (post.is_vote_closed || (post.vote_ends_at && new Date(post.vote_ends_at).getTime() <= Date.now())) {
        throw new Error("Voting is closed for this post.");
      }
      throw new Error("That choice is no longer available.");
    }

    return { ok: true };
  });

export const closeVotePost = createServerFn({ method: "POST" })
  .inputValidator((input: { postId: string }) => z.object({ postId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { requireViewer } = await import("./auth.server");
    const { db, profile } = await requireViewer(getRequest());
    const post = await db
      .prepare("SELECT author_id FROM posts WHERE id = ? AND deleted_at IS NULL")
      .bind(data.postId)
      .first<{ author_id: string }>();
    if (!post) throw new Error("Post not found.");
    if (post.author_id !== profile.id) throw new Error("Only the post author can mark voting as Done.");
    await db
      .prepare("UPDATE posts SET is_vote_closed = 1, updated_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), data.postId)
      .run();
    return { ok: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator((input: { postId: string }) => z.object({ postId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { requireViewer } = await import("./auth.server");
    const { db, profile } = await requireViewer(getRequest());
    const post = await db
      .prepare("SELECT author_id FROM posts WHERE id = ? AND deleted_at IS NULL")
      .bind(data.postId)
      .first<{ author_id: string }>();
    if (!post) throw new Error("Post not found.");
    if (post.author_id !== profile.id) throw new Error("Only the post author can delete this post.");
    const nowIso = new Date().toISOString();
    await db.batch([
      db.prepare("UPDATE posts SET deleted_at = ? WHERE id = ?").bind(nowIso, data.postId),
      db.prepare("UPDATE thoughts SET deleted_at = ? WHERE post_id = ?").bind(nowIso, data.postId),
    ]);
    return { ok: true };
  });

const profileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  bio: z.string().max(160),
  about: z.string().max(1200),
  website: z.union([z.literal(""), z.string().url().max(200)]),
  instagram: z.string().max(40),
  tiktok: z.string().max(40),
  x: z.string().max(40),
  avatarMediaId: z.string().uuid().optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof profileSchema>) => profileSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireViewer, toPublicProfile } = await import("./auth.server");
    const { db, profile } = await requireViewer(getRequest());
    let avatarKey = profile.profile_image_url;
    if (data.avatarMediaId) {
      const media = await db
        .prepare(
          "SELECT r2_key FROM media WHERE id = ? AND owner_id = ? AND kind = 'avatar' AND status = 'ready'",
        )
        .bind(data.avatarMediaId, profile.id)
        .first<{ r2_key: string }>();
      if (!media) throw new Error("Profile picture not found.");
      avatarKey = media.r2_key;
    }
    await db
      .prepare(
        `UPDATE profiles SET display_name = ?, bio = ?, about = ?, website = ?, instagram = ?, tiktok = ?,
         x_handle = ?, profile_image_url = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(
        data.name,
        data.bio,
        data.about,
        data.website || null,
        data.instagram || null,
        data.tiktok || null,
        data.x || null,
        avatarKey,
        new Date().toISOString(),
        profile.id,
      )
      .run();
    const updated = await db
      .prepare("SELECT * FROM profiles WHERE id = ?")
      .bind(profile.id)
      .first();
    return toPublicProfile(updated as never);
  });

export const createReel = createServerFn({ method: "POST" })
  .inputValidator((input: { videoMediaId: string; caption: string; durationMs: number }) =>
    z
      .object({
        videoMediaId: z.string().uuid(),
        caption: z.string().trim().max(300),
        durationMs: z.number().int().min(1).max(60_000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireCreator: requireViewer } = await import("./auth.server");
    const { db, profile } = await requireViewer(getRequest());
    const media = await db
      .prepare(
        "SELECT 1 FROM media WHERE id = ? AND owner_id = ? AND kind = 'video' AND status = 'ready'",
      )
      .bind(data.videoMediaId, profile.id)
      .first();
    if (!media) throw new Error("Reel video not found.");
    const id = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO reels (id, author_id, video_media_id, caption, duration_ms, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      )
      .bind(id, profile.id, data.videoMediaId, data.caption, data.durationMs)
      .run();
    return { id };
  });

export const listReels = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ live: boolean; reels: Reel[] }> => {
    const { getDb, mediaUrl } = await import("./cf-env.server");
    const { viewerFrom } = await import("./auth.server");
    const db = getDb(getRequest());
    if (!db) return { live: false, reels: [] };
    const viewer = await viewerFrom(getRequest()).catch(() => null);
    const { results } = await db
      .prepare(
        `${REEL_SELECT} WHERE r.deleted_at IS NULL AND r.status = 'approved' ORDER BY r.created_at DESC LIMIT 40`,
      )
      .bind(viewer?.profile.id ?? "")
      .all<ReelRow>();
    return { live: true, reels: results.map((r) => toReel(r, mediaUrl)) };
  },
);

const REEL_SELECT = `SELECT r.id, r.status, r.caption, r.duration_ms, pr.display_name, pr.username, v.r2_key AS video_key,
  pm.r2_key AS poster_key,
  (SELECT COUNT(*) FROM reel_likes l WHERE l.reel_id = r.id) AS likes,
  (SELECT COUNT(*) FROM reel_likes l WHERE l.reel_id = r.id AND l.user_id = ?) AS mine
FROM reels r JOIN profiles pr ON pr.id = r.author_id JOIN media v ON v.id = r.video_media_id
LEFT JOIN media pm ON pm.id = r.poster_media_id`;

function toReel(r: ReelRow, mediaUrl: (key: string | null | undefined) => string | null): Reel {
  const secs = Math.round(r.duration_ms / 1000);
  return {
    id: r.id,
    creator: r.display_name,
    handle: `@${r.username}`,
    caption: r.caption,
    poster: mediaUrl(r.poster_key) ?? "",
    video: mediaUrl(r.video_key)!,
    likes: Number(r.likes),
    likedByViewer: Boolean(r.mine),
    duration: `0:${String(secs).padStart(2, "0")}`,
    status: (r.status ?? "approved") as NonNullable<Reel["status"]>,
  };
}

type ReelRow = {
  id: string;
  status?: string;
  caption: string;
  duration_ms: number;
  display_name: string;
  username: string;
  video_key: string;
  poster_key: string | null;
  likes: number;
  mine: number;
};

/** A D1 profile page: details, real stats, and the person's posts, Thoughts and reels. */
export const getPublicProfile = createServerFn({ method: "POST" })
  .inputValidator((input: { handle: string }) =>
    z.object({ handle: z.string().trim().min(1).max(41) }).parse(input),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      live: boolean;
      profile: Profile | null;
      posts: Post[];
      thoughts: ProfileThought[];
      reels: Reel[];
    }> => {
      const { getDb, mediaUrl } = await import("./cf-env.server");
      const { viewerFrom, toPublicProfile } = await import("./auth.server");
      const db = getDb(getRequest());
      const empty = { profile: null, posts: [], thoughts: [], reels: [] };
      if (!db) return { live: false, ...empty };

      const username = data.handle.replace(/^@/, "").toLowerCase();
      const row = await db
        .prepare("SELECT * FROM profiles WHERE username = ?")
        .bind(username)
        .first();
      if (!row) return { live: true, ...empty };
      const pub = toPublicProfile(row as never);
      const authorId = pub.id;
      const viewer = await viewerFrom(getRequest()).catch(() => null);
      const viewerId = viewer?.profile.id ?? "";

      const [stats, postRows, thoughtRows, reelRows] = await Promise.all([
        db
          .prepare(
            `SELECT
              (SELECT COUNT(*) FROM posts WHERE author_id = ?1 AND deleted_at IS NULL) AS posts,
              (SELECT COUNT(*) FROM thoughts WHERE author_id = ?1 AND deleted_at IS NULL AND is_hidden = 0) AS thoughts,
              (SELECT COUNT(*) FROM reels WHERE author_id = ?1 AND deleted_at IS NULL AND status = 'approved') AS reels,
              (SELECT COUNT(*) FROM reel_likes l JOIN reels r ON r.id = l.reel_id
                WHERE r.author_id = ?1 AND r.deleted_at IS NULL) AS likes,
              (SELECT COUNT(*) FROM thought_boosts b JOIN thoughts t ON t.id = b.thought_id
                WHERE t.author_id = ?1 AND t.deleted_at IS NULL) AS boosts`,
          )
          .bind(authorId)
          .first<Record<"posts" | "thoughts" | "reels" | "likes" | "boosts", number>>(),
        db
          .prepare(
            `${POST_SELECT} WHERE p.author_id = ? AND p.deleted_at IS NULL ORDER BY p.created_at DESC LIMIT 40`,
          )
          .bind(authorId)
          .all<PostRow>(),
        db
          .prepare(
            `SELECT t.id, t.body, t.created_at, t.post_id, op.display_name AS op_name
            FROM thoughts t JOIN posts p ON p.id = t.post_id JOIN profiles op ON op.id = p.author_id
            WHERE t.author_id = ? AND t.deleted_at IS NULL AND t.is_hidden = 0 AND p.deleted_at IS NULL
            ORDER BY t.created_at DESC LIMIT 40`,
          )
          .bind(authorId)
          .all<{
            id: string;
            body: string;
            created_at: string;
            post_id: string;
            op_name: string;
          }>(),
        db
          .prepare(
            `${REEL_SELECT} WHERE r.deleted_at IS NULL AND r.author_id = ? AND (r.status = 'approved' OR r.author_id = ?) ORDER BY r.created_at DESC LIMIT 40`,
          )
          .bind(viewerId, authorId, viewerId)
          .all<ReelRow>(),
      ]);

      return {
        live: true,
        profile: {
          name: pub.name,
          handle: pub.handle,
          bio: pub.bio,
          about: pub.about,
          website: pub.website,
          avatar: pub.avatar,
          socials: { instagram: pub.instagram, tiktok: pub.tiktok, x: pub.x },
          stats: {
            posts: Number(stats?.posts ?? 0),
            thoughts: Number(stats?.thoughts ?? 0),
            reels: Number(stats?.reels ?? 0),
            likes: Number(stats?.likes ?? 0),
            boosts: Number(stats?.boosts ?? 0),
          },
        },
        posts: postRows.results.length
          ? await hydratePosts(db, postRows.results, viewerId || null, mediaUrl)
          : [],
        thoughts: thoughtRows.results.map((t) => ({
          id: t.id,
          text: t.body,
          time: relativeTime(t.created_at),
          postId: t.post_id,
          postAuthor: t.op_name,
        })),
        reels: reelRows.results.map((r) => toReel(r, mediaUrl)),
      };
    },
  );

export const setReelLiked = createServerFn({ method: "POST" })
  .inputValidator((input: { reelId: string; liked: boolean }) =>
    z.object({ reelId: z.string().uuid(), liked: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireViewer } = await import("./auth.server");
    const { db, profile } = await requireViewer(getRequest());
    await db
      .prepare(
        data.liked
          ? "INSERT OR IGNORE INTO reel_likes (reel_id, user_id) VALUES (?, ?)"
          : "DELETE FROM reel_likes WHERE reel_id = ? AND user_id = ?",
      )
      .bind(data.reelId, profile.id)
      .run();
    return { ok: true };
  });
