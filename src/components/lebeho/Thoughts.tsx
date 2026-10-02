import { useState } from "react";
import { ProfileLink } from "./ProfileLink";
import type { Post, Reply, Thought } from "@/lib/lebeho-data";
import { me } from "@/lib/lebeho-data";

function Conversation({ thought, post }: { thought: Thought; post: Post }) {
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
      <p className="text-xs tracking-wide text-muted-foreground">
        <ProfileLink
          name={thought.author}
          handle={thought.handle}
          className="font-editorial text-base text-foreground"
        />{" "}
        {thought.handle} · {thought.time}
      </p>
      <p className="mt-2 text-[15px] leading-relaxed">{thought.text}</p>
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
  const [draft, setDraft] = useState("");
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
          conversation.
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
        {thoughts.map((thought) => (
          <Conversation key={thought.id} thought={thought} post={post} />
        ))}
      </div>
    </section>
  );
}
