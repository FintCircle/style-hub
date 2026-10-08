import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

function relativeTime(iso: string) {
  const then = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`).getTime();
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export type NotificationItem = {
  id: string;
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
  isRead: boolean;
  time: string;
  actor: {
    name: string;
    handle: string;
    avatar?: string;
  };
};

export const listNotifications = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ live: boolean; notifications: NotificationItem[]; unreadCount: number }> => {
    const { getDb, mediaUrl } = await import("./cf-env.server");
    const { viewerFrom } = await import("./auth.server");
    const db = getDb(getRequest());
    if (!db) return { live: false, notifications: [], unreadCount: 0 };

    const viewer = await viewerFrom(getRequest()).catch(() => null);
    if (!viewer) return { live: true, notifications: [], unreadCount: 0 };

    const { results } = await db
      .prepare(
        `SELECT n.id, n.type, n.target_type, n.target_id, n.thought_id, n.is_read, n.created_at,
                pr.display_name, pr.username, pr.profile_image_url
         FROM notifications n
         JOIN profiles pr ON pr.id = n.actor_id
         WHERE n.recipient_id = ?
         ORDER BY n.created_at DESC
         LIMIT 50`,
      )
      .bind(viewer.profile.id)
      .all<{
        id: string;
        type:
          | "thought"
          | "thought_reply"
          | "boost"
          | "reel_like"
          | "poll_ended"
          | "rush_ending"
          | "content_report";
        target_type: "post" | "reel";
        target_id: string;
        thought_id: string | null;
        is_read: number;
        created_at: string;
        display_name: string;
        username: string;
        profile_image_url: string | null;
      }>();

    const notifications: NotificationItem[] = results.map((n) => ({
      id: n.id,
      type: n.type,
      targetType: n.target_type,
      targetId: n.target_id,
      thoughtId: n.thought_id ?? undefined,
      isRead: Boolean(n.is_read),
      time: relativeTime(n.created_at),
      actor: {
        name: n.display_name,
        handle: `@${n.username}`,
        avatar: mediaUrl(n.profile_image_url) ?? undefined,
      },
    }));

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      live: true,
      notifications,
      unreadCount,
    };
  },
);

export const getUnreadNotificationCount = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ unreadCount: number }> => {
    const { getDb } = await import("./cf-env.server");
    const { viewerFrom } = await import("./auth.server");
    const db = getDb(getRequest());
    if (!db) return { unreadCount: 0 };

    const viewer = await viewerFrom(getRequest()).catch(() => null);
    if (!viewer) return { unreadCount: 0 };

    const res = await db
      .prepare("SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0")
      .bind(viewer.profile.id)
      .first<{ count: number }>();

    return { unreadCount: Number(res?.count ?? 0) };
  },
);

export const markNotificationAsRead = createServerFn({ method: "POST" })
  .inputValidator((input: { notificationId: string }) =>
    z.object({ notificationId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireViewer } = await import("./auth.server");
    const { db, profile } = await requireViewer(getRequest());

    await db
      .prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?")
      .bind(data.notificationId, profile.id)
      .run();

    return { ok: true };
  });

export const clearAllNotifications = createServerFn({ method: "POST" }).handler(async () => {
  const { requireViewer } = await import("./auth.server");
  const { db, profile } = await requireViewer(getRequest());

  await db
    .prepare("UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND is_read = 0")
    .bind(profile.id)
    .run();

  return { ok: true };
});
