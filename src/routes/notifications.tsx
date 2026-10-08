import { useAuth } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCheck,
  Heart,
  MessageSquare,
  Sparkles,
  MessageCircle,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { ProfileLink } from "@/components/lebeho/ProfileLink";
import {
  listNotifications,
  markNotificationAsRead,
  clearAllNotifications,
  type NotificationItem,
} from "@/lib/notifications.functions";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — LeBeHo" },
      {
        name: "description",
        content: "Stay updated with your fashion thoughts, replies, boosts, and likes.",
      },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["notifications", isSignedIn ?? false],
    queryFn: () => listNotifications(),
  });

  async function handleNotificationClick(n: NotificationItem) {
    if (!n.isRead) {
      try {
        await markNotificationAsRead({ data: { notificationId: n.id } });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      } catch (err) {
        console.error("Could not mark notification as read", err);
      }
    }

    if (n.targetType === "post") {
      void navigate({ to: "/posts/$postId", params: { postId: n.targetId } });
    } else if (n.targetType === "reel") {
      void navigate({ to: "/reels" });
    }
  }

  async function handleClearAll() {
    try {
      await clearAllNotifications();
      toast.success("All notifications marked as read.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear notifications.");
    }
  }

  const notifications = query.data?.notifications ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="font-editorial text-2xl leading-none">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="h-8 rounded-full text-xs"
            >
              <CheckCheck className="mr-1.5 size-3.5" />
              Clear all
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-xl">
        {query.isLoading ? (
          <div className="space-y-4 px-5 py-6">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-20 text-center">
            <Bell className="mx-auto size-10 text-muted-foreground/50" strokeWidth={1.5} />
            <h2 className="mt-4 font-editorial text-2xl">No notifications yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              When people left thoughts on your look or boosted your stylist thoughts, you'll see
              them here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onClick={() => void handleNotificationClick(n)}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: NotificationItem;
  onClick: () => void;
}) {
  const { actor, type, time, isRead } = notification;

  let Icon = MessageSquare;
  let text = "interacted with you";

  if (type === "thought") {
    Icon = MessageCircle;
    text = "left a Thought on your post";
  } else if (type === "thought_reply") {
    Icon = MessageSquare;
    text = "replied to a Thought";
  } else if (type === "boost") {
    Icon = Sparkles;
    text = "boosted a Thought on your post";
  } else if (type === "reel_like") {
    Icon = Heart;
    text = "liked your Reel";
  } else if (type === "poll_ended") {
    Icon = CheckCheck;
    text = "The poll on your post has ended";
  } else if (type === "rush_ending") {
    Icon = Timer;
    text = "Your Rush Hour countdown is ending soon";
  } else if (type === "content_report") {
    Icon = AlertTriangle;
    text = "reported content for review";
  }

  const cleanHandle = actor.handle.replace(/^@/, "");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 ${
        !isRead ? "bg-muted/20" : ""
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="relative shrink-0">
          <Link
            to="/profile/$handle"
            params={{ handle: cleanHandle }}
            onClick={(e) => e.stopPropagation()}
            className="block rounded-full focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`View ${actor.name}'s profile`}
          >
            <Avatar className="size-10 hover:opacity-90 transition-opacity">
              <AvatarImage src={actor.avatar} alt={actor.name} />
              <AvatarFallback className="bg-primary font-editorial text-xs text-primary-foreground">
                {(actor.name || "?")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background p-0.5 text-foreground shadow-sm">
            <Icon className="size-3 text-rush" strokeWidth={2} />
          </div>
        </div>

        <div className="min-w-0 text-sm">
          <p className="leading-snug break-words">
            <span className="font-semibold text-foreground">
              <ProfileLink name={actor.name} handle={actor.handle} />
            </span>{" "}
            <span className="text-muted-foreground">{text}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{time}</p>
        </div>
      </div>

      {!isRead && (
        <span className="mt-2 size-2 shrink-0 rounded-full bg-rush" aria-label="Unread" />
      )}
    </button>
  );
}
