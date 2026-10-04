/**
 * Server-only D1 repository for Thoughts. Route handlers must supply the Clerk
 * subject read from the verified Clerk session; never accept a profile ID from
 * a browser request as proof of ownership.
 */
export type D1Database = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T>(): Promise<T | null>;
      all<T>(): Promise<{ results: T[] }>;
      run(): Promise<unknown>;
    };
  };
};

type Profile = { id: string };
type ThoughtParticipant = {
  thought_author_id: string;
  post_author_id: string;
  post_id: string;
  thoughts_closed: number;
};

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

async function profileForClerkUser(db: D1Database, clerkUserId: string): Promise<Profile> {
  const profile = await db
    .prepare("SELECT id FROM profiles WHERE clerk_user_id = ?")
    .bind(clerkUserId)
    .first<Profile>();
  if (!profile) throw new Error("Authenticated user does not have a LeBeHo profile");
  return profile;
}

async function participantForThought(
  db: D1Database,
  thoughtId: string,
): Promise<ThoughtParticipant> {
  const participant = await db
    .prepare(
      `SELECT t.author_id AS thought_author_id, p.author_id AS post_author_id,
      p.id AS post_id, p.thoughts_closed FROM thoughts t JOIN posts p ON p.id = t.post_id
      WHERE t.id = ? AND t.deleted_at IS NULL AND p.deleted_at IS NULL`,
    )
    .bind(thoughtId)
    .first<ThoughtParticipant>();
  if (!participant) throw new Error("Thought not found");
  return participant;
}

async function assertNotBlocked(db: D1Database, actorId: string, otherId: string) {
  const block = await db
    .prepare(
      `SELECT 1 FROM user_blocks
    WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`,
    )
    .bind(actorId, otherId, otherId, actorId)
    .first();
  if (block)
    throw new Error("This interaction is unavailable because one user has blocked the other");
}

export async function createThought(
  db: D1Database,
  clerkUserId: string,
  postId: string,
  body: string,
) {
  const actor = await profileForClerkUser(db, clerkUserId);
  const post = await db
    .prepare("SELECT author_id, thoughts_closed FROM posts WHERE id = ? AND deleted_at IS NULL")
    .bind(postId)
    .first<{ author_id: string; thoughts_closed: number }>();
  if (!post) throw new Error("Post not found");
  if (post.thoughts_closed) throw new Error("Thoughts are closed for this post");
  await assertNotBlocked(db, actor.id, post.author_id);
  const thoughtId = id();
  await db
    .prepare("INSERT INTO thoughts (id, post_id, author_id, body) VALUES (?, ?, ?, ?)")
    .bind(thoughtId, postId, actor.id, body.trim())
    .run();
  return thoughtId;
}

export async function createThoughtReply(
  db: D1Database,
  clerkUserId: string,
  thoughtId: string,
  body: string,
) {
  const actor = await profileForClerkUser(db, clerkUserId);
  const participants = await participantForThought(db, thoughtId);
  if (actor.id !== participants.post_author_id && actor.id !== participants.thought_author_id)
    throw new Error("Only conversation participants may reply");
  await assertNotBlocked(
    db,
    actor.id,
    actor.id === participants.post_author_id
      ? participants.thought_author_id
      : participants.post_author_id,
  );
  const replyId = id();
  await db
    .prepare("INSERT INTO thought_replies (id, thought_id, author_id, body) VALUES (?, ?, ?, ?)")
    .bind(replyId, thoughtId, actor.id, body.trim())
    .run();
  return replyId;
}

export async function setThoughtBoosted(
  db: D1Database,
  clerkUserId: string,
  thoughtId: string,
  boosted: boolean,
) {
  const actor = await profileForClerkUser(db, clerkUserId);
  await participantForThought(db, thoughtId);
  if (boosted) {
    await db
      .prepare("INSERT OR IGNORE INTO thought_boosts (thought_id, user_id) VALUES (?, ?)")
      .bind(thoughtId, actor.id)
      .run();
  } else {
    await db
      .prepare("DELETE FROM thought_boosts WHERE thought_id = ? AND user_id = ?")
      .bind(thoughtId, actor.id)
      .run();
  }
}

/** Lightweight post-page model: reply bodies are deliberately not included. */
export async function loadPostThoughts(db: D1Database, clerkUserId: string, postId: string) {
  const viewer = await profileForClerkUser(db, clerkUserId);
  return db
    .prepare(
      `SELECT t.id, t.body, t.created_at, t.is_hidden,
      COUNT(DISTINCT tr.id) AS reply_count,
      COUNT(DISTINCT tb.user_id) AS boost_count,
      MAX(CASE WHEN tb.user_id = ? THEN 1 ELSE 0 END) AS boosted_by_viewer
    FROM thoughts t
    LEFT JOIN thought_replies tr ON tr.thought_id = t.id AND tr.deleted_at IS NULL
    LEFT JOIN thought_boosts tb ON tb.thought_id = t.id
    WHERE t.post_id = ? AND t.deleted_at IS NULL AND t.is_hidden = 0
    GROUP BY t.id
    ORDER BY boost_count DESC, reply_count DESC, t.created_at DESC`,
    )
    .bind(viewer.id, postId)
    .all();
}

/** Called only after the viewer selects "View conversation" for a Thought. */
export async function loadThoughtConversation(
  db: D1Database,
  clerkUserId: string,
  thoughtId: string,
) {
  await profileForClerkUser(db, clerkUserId);
  return db
    .prepare(
      `SELECT id, author_id, body, created_at, updated_at
    FROM thought_replies WHERE thought_id = ? AND deleted_at IS NULL ORDER BY created_at`,
    )
    .bind(thoughtId)
    .all();
}

export async function setThoughtHidden(
  db: D1Database,
  clerkUserId: string,
  thoughtId: string,
  hidden: boolean,
) {
  const actor = await profileForClerkUser(db, clerkUserId);
  const participants = await participantForThought(db, thoughtId);
  if (actor.id !== participants.post_author_id)
    throw new Error("Only the post author may change Thought visibility");
  await db
    .prepare(
      "UPDATE thoughts SET is_hidden = ?, hidden_by = ?, hidden_at = ?, updated_at = ? WHERE id = ?",
    )
    .bind(Number(hidden), hidden ? actor.id : null, hidden ? now() : null, now(), thoughtId)
    .run();
}

export async function setThoughtsClosed(
  db: D1Database,
  clerkUserId: string,
  postId: string,
  closed: boolean,
) {
  const actor = await profileForClerkUser(db, clerkUserId);
  const post = await db
    .prepare("SELECT author_id FROM posts WHERE id = ? AND deleted_at IS NULL")
    .bind(postId)
    .first<{ author_id: string }>();
  if (!post || post.author_id !== actor.id)
    throw new Error("Only the post author may close Thoughts");
  await db
    .prepare("UPDATE posts SET thoughts_closed = ?, updated_at = ? WHERE id = ?")
    .bind(Number(closed), now(), postId)
    .run();
}

export async function reportThought(
  db: D1Database,
  clerkUserId: string,
  thoughtId: string,
  reason: string,
  details?: string,
) {
  const actor = await profileForClerkUser(db, clerkUserId);
  await participantForThought(db, thoughtId);
  const existing = await db
    .prepare(
      "SELECT 1 FROM thought_reports WHERE thought_id = ? AND reporter_id = ? AND status = 'pending'",
    )
    .bind(thoughtId, actor.id)
    .first();
  if (existing) throw new Error("You already have an active report for this Thought");
  await db
    .prepare(
      "INSERT INTO thought_reports (id, thought_id, reporter_id, reason, details) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(id(), thoughtId, actor.id, reason, details?.trim() || null)
    .run();
}

export async function setUserBlocked(
  db: D1Database,
  clerkUserId: string,
  otherProfileId: string,
  blocked: boolean,
) {
  const actor = await profileForClerkUser(db, clerkUserId);
  if (actor.id === otherProfileId) throw new Error("You cannot block yourself");
  if (blocked)
    await db
      .prepare("INSERT OR IGNORE INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)")
      .bind(actor.id, otherProfileId)
      .run();
  else
    await db
      .prepare("DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?")
      .bind(actor.id, otherProfileId)
      .run();
}
