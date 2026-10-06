import { useState } from "react";
import { Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PostCard } from "@/components/lebeho/PostCard";
import type { Post, Profile, ProfileThought, Reel } from "@/lib/types";

const tabs = ["Posts", "Thoughts", "Reels", "About"] as const;

export function ProfileStats({ stats }: { stats?: Profile["stats"] }) {
  if (!stats) return null;
  return (
    <dl className="mt-6 grid grid-cols-5 gap-2 border-y border-border py-4 text-center">
      {Object.entries(stats).map(([key, value]) => (
        <div key={key}>
          <dt className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{key}</dt>
          <dd className="font-editorial text-lg">{value.toLocaleString()}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProfileActivity({
  posts,
  thoughts,
  reels,
  onAbout,
  loading,
}: {
  posts: Post[];
  thoughts: ProfileThought[];
  reels: Reel[];
  onAbout: () => void;
  loading?: boolean;
}) {
  const [tab, setTab] = useState<Exclude<(typeof tabs)[number], "About">>("Posts");

  return (
    <>
      <div className="mx-auto max-w-xl px-5">
        <div className="mt-6 flex gap-5" role="tablist" aria-label="Profile activity">
          {tabs.map((item) => {
            const active = tab === item;
            return (
              <button
                key={item}
                type="button"
                role={item === "About" ? undefined : "tab"}
                aria-selected={item === "About" ? undefined : active}
                onClick={() => (item === "About" ? onAbout() : setTab(item))}
                className={
                  "pb-2 text-[11px] uppercase tracking-[0.22em] transition-colors " +
                  (active ? "border-b border-foreground text-foreground" : "text-muted-foreground")
                }
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-xl">
        {loading ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {tab === "Posts" &&
              (posts.length ? (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <Empty>No posts yet.</Empty>
              ))}
            {tab === "Thoughts" &&
              (thoughts.length ? (
                <ul className="space-y-6 px-5 py-8">
                  {thoughts.map((thought) => (
                    <li key={thought.id} className="border-b border-border pb-5">
                      <Link
                        to="/posts/$postId"
                        params={{ postId: thought.postId }}
                        className="group block"
                      >
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          On {thought.postAuthor}&apos;s post · {thought.time}
                        </p>
                        <p className="mt-2 text-[15px] leading-relaxed group-hover:text-primary">
                          {thought.text}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No Thoughts yet.</Empty>
              ))}
            {tab === "Reels" &&
              (reels.length ? (
                <div className="grid grid-cols-3 gap-1 px-1 py-8">
                  {reels.map((reel) => (
                    <div key={reel.id} className="relative">
                      {reel.status === "pending" && (
                        <span className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">
                          <Clock className="size-3" /> Pending
                        </span>
                      )}
                      {reel.poster ? (
                        <img
                          key={reel.id}
                          src={reel.poster}
                          alt={reel.caption || `Reel by ${reel.creator}`}
                          loading="lazy"
                          className="aspect-[9/16] w-full object-cover"
                        />
                      ) : (
                        <video
                          key={reel.id}
                          src={reel.video}
                          muted
                          playsInline
                          preload="metadata"
                          aria-label={reel.caption || `Reel by ${reel.creator}`}
                          className="aspect-[9/16] w-full bg-muted object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>No reels yet.</Empty>
              ))}
          </>
        )}
      </div>
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-sm text-muted-foreground">{children}</p>;
}
