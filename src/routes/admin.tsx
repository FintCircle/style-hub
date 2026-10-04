import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, Trash2, X } from "lucide-react";
import { AccountGate } from "@/components/lebeho/AccountGate";
import { useViewer } from "@/hooks/use-viewer";
import { Button } from "@/components/ui/button";
import {
  adminDeletePost,
  adminResolveReport,
  adminReviewReel,
  adminSetRestricted,
  getAdminOverview,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — LeBeHo" },
      { name: "description", content: "LeBeHo moderation: members, posts, reel reviews and reports." },
      { property: "og:title", content: "Admin — LeBeHo" },
      { property: "og:description", content: "LeBeHo moderation area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AccountGate>
      <AdminPage />
    </AccountGate>
  ),
});

const sections = ["Reels review", "Reports", "Members", "Posts"] as const;

function date(iso: string) {
  return new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AdminPage() {
  const viewer = useViewer();
  const isAdmin = Boolean(viewer.profile?.isAdmin);
  const queryClient = useQueryClient();
  const [section, setSection] = useState<(typeof sections)[number]>("Reels review");
  const overview = useQuery({ queryKey: ["admin"], queryFn: () => getAdminOverview(), enabled: isAdmin });

  const act = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      toast.success("Done.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed."),
  });

  if (viewer.isLoadingProfile) return <p className="p-10 text-center text-muted-foreground">Checking access…</p>;
  if (!isAdmin)
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-editorial text-3xl">Admins only</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/">Back to Feed</Link>
        </Button>
      </div>
    );

  const d = overview.data;
  const counts = {
    "Reels review": d?.pendingReels.length ?? 0,
    Reports: d?.reports.length ?? 0,
    Members: d?.userCount ?? 0,
    Posts: d?.posts.length ?? 0,
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 pb-20">
      <header className="flex items-center gap-3 py-6">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/" aria-label="Back to Feed">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="font-editorial text-3xl">Admin</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {sections.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={
              "rounded-2xl border p-4 text-left transition-colors " +
              (section === s ? "border-foreground bg-foreground text-background" : "border-border")
            }
          >
            <p className="text-2xl font-semibold tabular-nums">{counts[s]}</p>
            <p className="text-xs uppercase tracking-[0.15em] opacity-70">{s === "Members" ? "Members" : s}</p>
          </button>
        ))}
      </div>

      {overview.isLoading && <p className="py-10 text-center text-muted-foreground">Loading…</p>}
      {overview.error && <p className="py-10 text-center text-destructive">{overview.error.message}</p>}

      {d && section === "Reels review" && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {d.pendingReels.length === 0 && <Empty text="No reels waiting for review." />}
          {d.pendingReels.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-2xl border border-border">
              <video src={r.video} controls playsInline className="aspect-[9/16] w-full bg-reels object-cover" />
              <div className="space-y-3 p-4">
                <p className="text-sm">
                  <span className="font-semibold">@{r.username}</span> · {date(r.created_at)}
                </p>
                {r.caption && <p className="text-sm text-muted-foreground">{r.caption}</p>}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 rounded-full"
                    disabled={act.isPending}
                    onClick={() => act.mutate(() => adminReviewReel({ data: { reelId: r.id, approve: true } }))}
                  >
                    <Check className="size-4" /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-full"
                    disabled={act.isPending}
                    onClick={() => {
                      if (confirm("Reject and permanently delete this video?"))
                        act.mutate(() => adminReviewReel({ data: { reelId: r.id, approve: false } }));
                    }}
                  >
                    <X className="size-4" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {d && section === "Reports" && (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {d.reports.length === 0 && <Empty text="No open reports." />}
          {d.reports.map((r) => (
            <li key={r.id} className="space-y-3 py-5">
              <p className="text-sm">
                <span className="uppercase tracking-[0.15em] text-rush">{r.target_type}</span> reported by @
                {r.reporter} · {date(r.created_at)}
              </p>
              <p className="text-sm text-muted-foreground">{r.reason || "No reason given."}</p>
              <p className="text-xs text-muted-foreground">ID {r.target_id}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-full" disabled={act.isPending}
                  onClick={() => act.mutate(() => adminResolveReport({ data: { reportId: r.id, action: "dismiss" } }))}>
                  Dismiss
                </Button>
                {r.target_type !== "profile" && (
                  <Button size="sm" variant="destructive" className="rounded-full" disabled={act.isPending}
                    onClick={() => act.mutate(() => adminResolveReport({ data: { reportId: r.id, action: "remove" } }))}>
                    Remove content
                  </Button>
                )}
                <Button size="sm" variant="secondary" className="rounded-full" disabled={act.isPending}
                  onClick={() => act.mutate(() => adminResolveReport({ data: { reportId: r.id, action: "restrict" } }))}>
                  Restrict author
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {d && section === "Members" && (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {d.users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {u.display_name} <span className="text-muted-foreground">@{u.username}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Joined {date(u.created_at)}
                  {u.restricted && <span className="ml-2 text-destructive">Restricted</span>}
                </p>
              </div>
              <Button size="sm" variant={u.restricted ? "outline" : "secondary"} className="shrink-0 rounded-full"
                disabled={act.isPending || u.id === viewer.profile?.id}
                onClick={() => act.mutate(() => adminSetRestricted({ data: { profileId: u.id, restricted: !u.restricted } }))}>
                {u.restricted ? "Lift restriction" : "Restrict"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {d && section === "Posts" && (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {d.posts.length === 0 && <Empty text="No posts yet." />}
          {d.posts.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  @{p.username} · {date(p.created_at)}
                  {p.images > 0 && ` · ${p.images} photo${p.images > 1 ? "s" : ""}`}
                </p>
                <p className="mt-1 line-clamp-3 text-sm">{p.body || "(photo post)"}</p>
              </div>
              <Button size="icon" variant="ghost" className="shrink-0 rounded-full text-destructive" aria-label="Delete post"
                disabled={act.isPending}
                onClick={() => {
                  if (confirm("Delete this post from the Feed?"))
                    act.mutate(() => adminDeletePost({ data: { postId: p.id } }));
                }}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="col-span-full py-10 text-center text-sm text-muted-foreground">{text}</p>;
}
