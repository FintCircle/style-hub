import { useState } from "react";
import { MessageSquareQuote, Timer } from "lucide-react";
import type { Post } from "@/lib/lebeho-data";
import { VoteBlock } from "./VoteBlock";
import { Countdown, useCountdown } from "./Countdown";

export function PostCard({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const [thoughts, setThoughts] = useState(post.thoughts);
  const [draft, setDraft] = useState("");
  const remaining = useCountdown(post.rushEndsAt);
  // null until hydration: render the Rush badge for any post that has a window,
  // then drop it once the clock confirms the window has closed.
  const live = Boolean(post.rushEndsAt) && (remaining === null || remaining > 0);

  return (
    <article className="border-b border-border px-5 py-8">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h3 className="font-editorial text-lg leading-none">{post.author}</h3>
          <p className="mt-1 text-xs tracking-wide text-muted-foreground">
            {post.handle} · {post.time}
          </p>
        </div>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full border border-rush/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-rush">
            <Timer className="size-3" /> Rush
          </span>
        )}
      </header>

      <p className="mt-4 text-[17px] leading-relaxed">{post.text}</p>

      {post.images.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-sm">
          <img
            src={post.images[0]}
            alt=""
            loading="lazy"
            width={768}
            height={960}
            className="w-full object-cover"
          />
        </div>
      )}

      {post.vote && <VoteBlock choices={post.vote} />}

      {live && post.rushEndsAt && (
        <p className="mt-4 text-sm text-rush">
          Closes in <Countdown endsAt={post.rushEndsAt} className="font-semibold" />
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <MessageSquareQuote className="size-4" strokeWidth={1.5} />
        {thoughts.length} Stylist thoughts
      </button>

      {open && (
        <div className="mt-5 space-y-5 border-l border-border pl-4">
          {thoughts.map((t) => (
            <div key={t.id}>
              <p className="text-xs tracking-wide text-muted-foreground">
                <span className="font-editorial text-sm text-foreground">{t.author}</span>{" "}
                {t.handle} · {t.time}
              </p>
              <p className="mt-1 text-[15px] leading-relaxed">{t.text}</p>
            </div>
          ))}
          {thoughts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No thoughts yet. Be the first Stylist here.
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              setThoughts((list) => [
                ...list,
                {
                  id: `local-${Date.now()}`,
                  author: "Johnson",
                  handle: "@johnson",
                  time: "now",
                  text: draft.trim(),
                },
              ]);
              setDraft("");
            }}
            className="flex items-center gap-3 border-t border-border pt-4"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share your styling thought…"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-primary-foreground"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
