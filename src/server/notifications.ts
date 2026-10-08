import type { D1Database } from "./thoughts";

export async function sendNotification(
  db: D1Database,
  params: {
    recipientId: string;
    actorId: string;
    type:
      | "thought"
      | "thought_reply"
      | "boost"
      | "reel_like"
      | "poll_ended"
      | "rush_ending"
      | "content_report";
    targetType: "post" | "reel";
    targetId: string;
    thoughtId?: string;
  },
) {
  if (!params.recipientId || !params.actorId) {
    return;
  }
  // Avoid self-notification except for system alerts like poll_ended or rush_ending
  if (
    params.recipientId === params.actorId &&
    params.type !== "poll_ended" &&
    params.type !== "rush_ending"
  ) {
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
