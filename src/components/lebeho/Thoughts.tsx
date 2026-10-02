import { useMemo, useState } from "react";
import { ProfileLink } from "./ProfileLink";
import type { Post, Reply, Thought } from "@/lib/lebeho-data";
import { me } from "@/lib/lebeho-data";

type ConversationProps = {
  thought: Thought;
  post: Post;
  onBoost: (thoughtId: string) => void;
  boostedByMe: boolean;
};

function Conversation({ thought, post, onBoost, boostedByMe }: ConversationProps) {
  const [replies, setReplies] = useState(thought.replies ?? []);
  const [draft, setDraft] = useState("");
  const canReply = thought.handle === me.handle || post.handle === me.handle;

  const sendReply = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const reply: Reply = {
      id: `reply-${Date.now()}`,
      author: me.name,
      handle: me.handle,
      time: "now",
      text: draft.trim(),
    };
    setReplies((current) => [...current, reply]);
    setDraft("");
  };

  return (
    <article className="border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground">
            <ProfileLink
              name={thought.author}
              handle={thought.handle}
              className="font-editorial text-base text-foreground"
            />{" "}
            {thought.handle} · {thought.time}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed">{thought.text}</p>
        </div>
        <button
          type="button"
          onClick={() => onBoost(thought.id)}
          aria-pressed={boostedByMe}
          aria-label={`${boostedByMe ? "Remove Boost from" : "Boost"} ${thought.author}'s Thought`}
          className={
            "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-medium tabular-nums transition-colors " +
            (boostedByMe
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary hover:text-primary")
          }
        >
          <span aria-hidden="true" className="text-base leading-none">
            ↑
          </span>
          <span>{thought.boosts}</span>
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Boost useful advice without joining this conversation.
      </p>
      <div className="mt-4 space-y-4 border-l border-border pl-4">
        {replies.map((reply) => (
          <div key={reply.id}>
            <p className="text-xs tracking-wide text-muted-foreground">
              <ProfileLink
                name={reply.author}
                handle={reply.handle}
                className="font-editorial text-sm text-foreground"
              />{" "}
              {reply.handle} · {reply.time}
            </p>
            <p className="mt-1 text-[15px] leading-relaxed">{reply.text}</p>
          </div>
        ))}
      </div>
      {canReply && (
        <form onSubmit={sendReply} className="mt-4 flex gap-3 border-t border-border pt-4">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Reply to this Thought…"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-primary-foreground"
          >
            Reply
          </button>
        </form>
      )}
    </article>
  );
}

export function Thoughts({ post }: { post: Post }) {
  const [thoughts, setThoughts] = useState(post.thoughts);
  const [boostedThoughtIds, setBoostedThoughtIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const orderedThoughts = useMemo(
    () =>
      [...thoughts].sort(
        (first, second) =>
          second.boosts +
          (second.replies?.length ?? 0) * 8 -
          (first.boosts + (first.replies?.length ?? 0) * 8),
      ),
    [thoughts],
  );

  const toggleBoost = (thoughtId: string) => {
    const hasBoosted = boostedThoughtIds.has(thoughtId);
    setBoostedThoughtIds((current) => {
      const next = new Set(current);
      if (hasBoosted) {
        next.delete(thoughtId);
      } else {
        next.add(thoughtId);
      }
      return next;
    });
    setThoughts((current) =>
      current.map((thought) =>
        thought.id === thoughtId
          ? { ...thought, boosts: thought.boosts + (hasBoosted ? -1 : 1) }
          : thought,
      ),
    );
  };

  const sendThought = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setThoughts((current) => [
      ...current,
      {
        id: `thought-${Date.now()}`,
        author: me.name,
        handle: me.handle,
        time: "now",
        text: draft.trim(),
        boosts: 0,
        replies: [],
      },
    ]);
    setDraft("");
  };

  return (
    <section aria-labelledby="thoughts-heading" className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Public conversations
        </p>
        <h2 id="thoughts-heading" className="mt-1 font-editorial text-3xl">
          Thoughts
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Start your own Thought. Only its author and the original poster can reply in that
          conversation. Boosts highlight useful advice without opening the conversation to replies.
        </p>
      </div>
      <form onSubmit={sendThought} className="flex gap-3 border-y border-border py-4">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Share a Thought…"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-primary-foreground"
        >
          Post
        </button>
      </form>
      <div className="space-y-4">
        {orderedThoughts.map((thought) => (
          <Conversation
            key={thought.id}
            thought={thought}
            post={post}
            onBoost={toggleBoost}
            boostedByMe={boostedThoughtIds.has(thought.id)}
          />
        ))}
      </div>
    </section>
  );
}
