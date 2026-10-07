import type { D1Database } from "./thoughts";

export async function sendNotification(
  db: D1Database,
  params: {
    recipientId: string;
    actorId: string;
    type: "thought" | "thought_reply" | "boost" | "reel_like";
    targetType: "post" | "reel";
    targetId: string;
    thoughtId?: string;
  },
) {
  if (!params.recipientId || !params.actorId || params.recipientId === params.actorId) {
    return;
  }
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO notifications (id, recipient_id, actor_id, type, target_type, target_id, thought_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      params.recipientId,
      params.actorId,
      params.type,
      params.targetType,
      params.targetId,
      params.thoughtId ?? null,
    )
    .run();
}
