import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AccountGate } from "@/components/lebeho/AccountGate";
import {
  adminDeletePost,
  getAdminOverview,
  resolveReport,
  reviewReel,
  setUserRestricted,
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

const tabs = ["Reels", "Reports", "Posts", "Members"] as const;
const day = (iso: string) => new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`).toLocaleDateString();

function AdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Reels");
  const q = useQuery({ queryKey: ["admin"], queryFn: () => getAdminOverview(), retry: false });

  async function run(action: () => Promise<unknown>, done: string) {
    try {
      await action();
      toast.success(done);
      qc.invalidateQueries();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (q.isLoading) return <p className="p-8 text-sm text-muted-foreground">Loading admin…</p>;
  if (q.error || !q.data)
    return (
      <div className="p-8">
        <p className="text-sm">{(q.error as Error | null)?.message ?? "Unavailable."}</p>
        <Link to="/" className="mt-4 inline-block text-sm underline">Back to Feed</Link>
      </div>
    );
  const d = q.data;
  const btn = "rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.15em] hover:bg-muted";

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-5 pb-24 pt-6">
      <Link to="/" className="text-xs text-muted-foreground">← Feed</Link>
      <h1 className="mt-2 font-editorial text-3xl">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">{d.userCount} members</p>
      <div className="mt-6 flex gap-5 border-b border-border">
        {tabs.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={"pb-2 text-[11px] uppercase tracking-[0.2em] " + (tab === t ? "border-b border-foreground" : "text-muted-foreground")}>
            {t}
            {t === "Reels" && d.pendingReels.length ? ` (${d.pendingReels.length})` : ""}
            {t === "Reports" && d.reports.length ? ` (${d.reports.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "Reels" && (
        <ul className="mt-6 space-y-8">
          {!d.pendingReels.length && <p className="text-sm text-muted-foreground">No reels waiting for review.</p>}
          {d.pendingReels.map((r) => (
            <li key={r.id} className="border-b border-border pb-6">
              <p className="text-xs text-muted-foreground">{r.handle} · {day(r.created)}</p>
              {r.video && <video src={r.video} controls playsInline className="mt-3 aspect-[9/16] w-48 rounded-xl bg-muted object-cover" />}
              {r.caption && <p className="mt-2 text-sm">{r.caption}</p>}
              <div className="mt-3 flex gap-2">
                <button type="button" className={btn} onClick={() => run(() => reviewReel({ data: { reelId: r.id, approve: true } }), "Reel approved")}>Approve</button>
                <button type="button" className={btn + " text-destructive"} onClick={() => confirm("Reject and permanently delete this video?") && run(() => reviewReel({ data: { reelId: r.id, approve: false } }), "Reel rejected and deleted")}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "Reports" && (
        <ul className="mt-6 space-y-6">
          {!d.reports.length && <p className="text-sm text-muted-foreground">No open reports.</p>}
          {d.reports.map((r) => (
            <li key={r.id} className="border-b border-border pb-5">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{r.targetType} · {r.reason} · by {r.reporter} · {day(r.created)}</p>
              <p className="mt-2 text-sm">{r.preview || "(no preview)"}</p>
              {r.details && <p className="mt-1 text-xs text-muted-foreground">{r.details}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={btn} onClick={() => run(() => resolveReport({ data: { reportId: r.id, source: r.source, action: "dismiss" } }), "Dismissed")}>Dismiss</button>
                {r.targetType !== "profile" && (
                  <button type="button" className={btn} onClick={() => run(() => resolveReport({ data: { reportId: r.id, source: r.source, action: "remove" } }), "Content removed")}>Remove content</button>
                )}
                <button type="button" className={btn} onClick={() => run(() => resolveReport({ data: { reportId: r.id, source: r.source, action: "restrict" } }), "Author restricted")}>Restrict author</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "Posts" && (
        <ul className="mt-6 space-y-5">
          {d.posts.map((p) => (
            <li key={p.id} className="flex gap-3 border-b border-border pb-4">
              {p.images[0] && <img src={p.images[0]} alt="" className="size-16 rounded object-cover" />}
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{p.handle} · {day(p.created)}</p>
                <p className="mt-1 line-clamp-3 text-sm">{p.text}</p>
              </div>
              <button type="button" className={btn + " h-fit text-destructive"} onClick={() => confirm("Delete this post from the Feed?") && run(() => adminDeletePost({ data: { postId: p.id } }), "Post deleted")}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      {tab === "Members" && (
        <ul className="mt-6 divide-y divide-border">
          {d.users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm">{u.name} <span className="text-muted-foreground">{u.handle}</span></p>
                <p className="text-xs text-muted-foreground">Joined {day(u.joined)} · {u.posts} posts{u.restricted ? " · Restricted" : ""}</p>
              </div>
              <button type="button" className={btn} onClick={() => run(() => setUserRestricted({ data: { profileId: u.id, restricted: !u.restricted } }), u.restricted ? "Restriction lifted" : "Member restricted")}>
                {u.restricted ? "Unrestrict" : "Restrict"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
