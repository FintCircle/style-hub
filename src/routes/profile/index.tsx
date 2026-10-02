import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { posts, reels, me } from "@/lib/lebeho-data";
import { PostCard } from "@/components/lebeho/PostCard";
import { BottomNav } from "@/components/lebeho/BottomNav";

export const Route = createFileRoute("/profile/")({
  head: () => ({
    meta: [
      { title: `${me.name} — LeBeHo profile` },
      {
        name: "description",
        content: "Your LeBeHo activity: posts, Stylist thoughts, and reels in one place.",
      },
      { property: "og:title", content: `${me.name} — LeBeHo profile` },
      {
        property: "og:description",
        content: "Posts, thoughts and reels from one fashion identity.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

const tabs = ["Posts", "Thoughts", "Reels"] as const;

function Profile() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Posts");
  const mine = posts.slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-xl px-5 pt-10">
        <div className="flex items-center gap-5">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary font-editorial text-2xl text-primary-foreground">
            {me.name[0]}
          </div>
          <div>
            <h1 className="font-editorial text-3xl leading-none">{me.name}</h1>
            <p className="mt-1.5 text-xs tracking-wide text-muted-foreground">{me.handle}</p>
          </div>
        </div>

        <p className="mt-5 text-[15px] leading-relaxed">{me.bio}</p>

        <dl className="mt-6 flex gap-8 border-y border-border py-4 text-center">
          {Object.entries(me.stats).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k}</dt>
              <dd className="font-editorial text-xl">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex gap-6">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "pb-2 text-[11px] uppercase tracking-[0.22em] transition-colors " +
                (tab === t ? "border-b border-foreground text-foreground" : "text-muted-foreground")
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-xl">
        {tab === "Posts" && mine.map((p) => <PostCard key={p.id} post={p} />)}

        {tab === "Thoughts" && (
          <div className="space-y-6 px-5 py-8">
            {posts
              .flatMap((p) => p.thoughts.map((t) => ({ t, p })))
              .slice(0, 3)
              .map(({ t, p }) => (
                <div key={t.id} className="border-b border-border pb-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    On {p.author}'s post
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed">{t.text}</p>
                </div>
              ))}
          </div>
        )}

        {tab === "Reels" && (
          <div className="grid grid-cols-3 gap-1 px-1 py-8">
            {reels.map((r) => (
              <img
                key={r.id}
                src={r.poster}
                alt={r.caption}
                loading="lazy"
                className="aspect-[9/16] w-full object-cover"
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
