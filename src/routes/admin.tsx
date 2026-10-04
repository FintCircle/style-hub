import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Shield, Trash2, UserRound, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AccountGate } from "@/components/lebeho/AccountGate";
import { useViewer } from "@/hooks/use-viewer";
import {
  adminDeletePost,
  adminResolveReport,
  adminReviewReel,
  adminSetRestricted,
  getAdminOverview,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · LeBeHo" }, { name: "robots", content: "noindex" }] }),
  component: () => <AccountGate><AdminWorkspace /></AccountGate>,
});

type Panel = "review" | "reports" | "members" | "posts";

const panels: { id: Panel; label: string; icon: typeof Video }[] = [
  { id: "review", label: "Reels to review", icon: Video },
  { id: "reports", label: "Reports", icon: Shield },
  { id: "members", label: "Members", icon: UserRound },
  { id: "posts", label: "Feed posts", icon: Trash2 },
];

function formatDate(value: string) {
  return new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

function AdminWorkspace() {
  const viewer = useViewer();
  const [panel, setPanel] = useState<Panel>("review");
  const client = useQueryClient();
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => getAdminOverview(), enabled: Boolean(viewer.profile?.isAdmin) });
  const action = useMutation({
    mutationFn: (task: () => Promise<unknown>) => task(),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin-overview"] });
      void client.invalidateQueries({ queryKey: ["feed"] });
      void client.invalidateQueries({ queryKey: ["reels"] });
      toast.success("Admin action completed.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The action could not be completed."),
  });

  if (viewer.isLoadingProfile) return <p className="p-10 text-center text-muted-foreground">Checking admin access…</p>;
  if (!viewer.profile?.isAdmin) return <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4"><h1 className="font-editorial text-3xl">Admins only</h1><Button asChild variant="outline" className="rounded-full"><Link to="/">Return to Feed</Link></Button></div>;

  const data = overview.data;
  const counts: Record<Panel, number> = {
    review: data?.pendingReels.length ?? 0,
    reports: data?.reports.length ?? 0,
    members: data?.userCount ?? 0,
    posts: data?.posts.length ?? 0,
  };

  return <main className="mx-auto min-h-screen max-w-5xl px-4 pb-16 sm:px-8">
    <header className="flex items-center justify-between border-b border-border py-6">
      <div className="flex items-center gap-3"><Button asChild variant="ghost" size="icon" className="rounded-full"><Link to="/" aria-label="Back to Feed"><ArrowLeft className="size-5" /></Link></Button><div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">LeBeHo control room</p><h1 className="font-editorial text-3xl">Admin area</h1></div></div>
      <span className="hidden rounded-full bg-muted px-3 py-1 text-xs sm:block">{data?.userCount ?? "—"} members</span>
    </header>

    <nav aria-label="Admin sections" className="grid grid-cols-2 gap-2 py-6 sm:grid-cols-4">
      {panels.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setPanel(id)} className={`rounded-xl border p-4 text-left transition-colors ${panel === id ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}><Icon className="mb-5 size-4" /><strong className="block text-2xl tabular-nums">{counts[id]}</strong><span className="text-xs opacity-75">{label}</span></button>)}
    </nav>

    {overview.isLoading && <p className="py-16 text-center text-muted-foreground">Loading live database records…</p>}
    {overview.error && <p className="py-16 text-center text-destructive">{overview.error.message}</p>}
    {data && panel === "review" && <section><SectionTitle title="Reel review queue" detail="Nothing is visible publicly until you approve it." />{data.pendingReels.length === 0 ? <Empty text="No reels are waiting for review." /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.pendingReels.map((reel) => <article key={reel.id} className="overflow-hidden rounded-2xl border border-border"><video src={reel.video} controls playsInline className="aspect-[9/16] w-full bg-muted object-cover" /><div className="space-y-3 p-4"><p className="text-sm"><b>@{reel.username}</b><span className="text-muted-foreground"> · {formatDate(reel.created_at)}</span></p>{reel.caption && <p className="text-sm text-muted-foreground">{reel.caption}</p>}<div className="flex gap-2"><Button className="flex-1 rounded-full" disabled={action.isPending} onClick={() => action.mutate(() => adminReviewReel({ data: { reelId: reel.id, approve: true } }))}><Check className="size-4" /> Approve</Button><Button variant="destructive" className="flex-1 rounded-full" disabled={action.isPending} onClick={() => { if (confirm("Reject and permanently delete this reel from storage?")) action.mutate(() => adminReviewReel({ data: { reelId: reel.id, approve: false } })); }}><X className="size-4" /> Reject</Button></div></div></article>)}</div>}</section>}
    {data && panel === "reports" && <section><SectionTitle title="Open reports" detail="Choose whether to dismiss, remove content, or restrict its author." /><div className="divide-y divide-border border-y border-border">{data.reports.length === 0 ? <Empty text="No open reports." /> : data.reports.map((report) => <article key={report.id} className="space-y-3 py-5"><p className="text-sm"><b className="uppercase tracking-wider">{report.target_type}</b> reported by @{report.reporter} · {formatDate(report.created_at)}</p><p className="text-sm text-muted-foreground">{report.reason || "No reason given."}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" className="rounded-full" disabled={action.isPending} onClick={() => action.mutate(() => adminResolveReport({ data: { reportId: report.id, action: "dismiss" } }))}>Dismiss</Button>{report.target_type !== "profile" && <Button size="sm" variant="destructive" className="rounded-full" disabled={action.isPending} onClick={() => action.mutate(() => adminResolveReport({ data: { reportId: report.id, action: "remove" } }))}>Remove content</Button>}<Button size="sm" variant="secondary" className="rounded-full" disabled={action.isPending} onClick={() => action.mutate(() => adminResolveReport({ data: { reportId: report.id, action: "restrict" } }))}>Restrict author</Button></div></article>)}</div></section>}
    {data && panel === "members" && <section><SectionTitle title="Members" detail="Review join dates and control access to uploads and content creation." /><div className="divide-y divide-border border-y border-border">{data.users.map((member) => <div key={member.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate font-medium">{member.display_name} <span className="text-muted-foreground">@{member.username}</span></p><p className="text-xs text-muted-foreground">Joined {formatDate(member.created_at)}{member.restricted && <span className="ml-2 text-destructive">Restricted</span>}</p></div><Button size="sm" variant={member.restricted ? "outline" : "secondary"} className="shrink-0 rounded-full" disabled={action.isPending || member.id === viewer.profile?.id} onClick={() => action.mutate(() => adminSetRestricted({ data: { profileId: member.id, restricted: !member.restricted } }))}>{member.restricted ? "Lift restriction" : "Restrict"}</Button></div>)}</div></section>}
    {data && panel === "posts" && <section><SectionTitle title="Feed posts" detail="Delete posts from the live Feed when moderation requires it." /><div className="divide-y divide-border border-y border-border">{data.posts.length === 0 ? <Empty text="No live posts found." /> : data.posts.map((post) => <div key={post.id} className="flex items-start justify-between gap-4 py-4"><div><p className="text-xs text-muted-foreground">@{post.username} · {formatDate(post.created_at)}{post.images ? ` · ${post.images} photo${post.images === 1 ? "" : "s"}` : ""}</p><p className="mt-1 max-w-2xl text-sm">{post.body || "(photo post)"}</p></div><Button size="icon" variant="ghost" className="shrink-0 rounded-full text-destructive" aria-label="Delete post" disabled={action.isPending} onClick={() => { if (confirm("Delete this post from the Feed?")) action.mutate(() => adminDeletePost({ data: { postId: post.id } })); }}><Trash2 className="size-4" /></Button></div>)}</div></section>}
  </main>;
}

function SectionTitle({ title, detail }: { title: string; detail: string }) { return <div className="mb-5"><h2 className="font-editorial text-2xl">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>; }
function Empty({ text }: { text: string }) { return <p className="py-14 text-center text-sm text-muted-foreground">{text}</p>; }
