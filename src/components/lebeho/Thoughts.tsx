import { ArrowUp, EyeOff, Flag, MessageCircle, UserRoundX } from "lucide-react";
import { useState } from "react";
import { ProfileLink } from "./ProfileLink";
import { useRequireAccount } from "@/hooks/use-viewer";
import type { Post, Reply, Thought } from "@/lib/lebeho-data";
import { me } from "@/lib/lebeho-data";

type ConversationProps = {
  thought: Thought;
  post: Post;
  onBoost: (thoughtId: string) => void;
  onReply: (thoughtId: string, reply: Reply) => void;
  boostedByMe: boolean;
  isOp: boolean;
  onHide: (thoughtId: string) => void;
  onReport: (thoughtId: string) => void;
  onBlock: (thought: Thought) => void;
};

function Conversation({
  thought,
  post,
  onBoost,
  onReply,
  boostedByMe,
  isOp,
  onHide,
  onReport,
  onBlock,
}: ConversationProps) {
  const [expanded, setExpanded] = useState(false);
  const requireAccount = useRequireAccount();
  const [draft, setDraft] = useState("");
  const replies = thought.replies ?? [];
  const canReply = thought.handle === me.handle || post.handle === me.handle;

  const sendReply = (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireAccount()) return;
    if (!draft.trim()) return;
    onReply(thought.id, {
      id: `reply-${Date.now()}`,
      author: me.name,
      handle: me.handle,
      time: "now",
      text: draft.trim(),
    });
    setDraft("");
    setExpanded(true);
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
          aria-label={`${boostedByMe ? "Remove Boost from" : "Boost"} ${thought.author}'s Thought`}
          aria-pressed={boostedByMe}
          className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-medium tabular-nums transition-colors ${boostedByMe ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
        >
          <ArrowUp aria-hidden="true" className="size-3.5" strokeWidth={2} />{" "}
          <span>{thought.boosts}</span>
        </button>
      </div>
      {isOp && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => onHide(thought.id)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <EyeOff className="size-3.5" /> Hide
          </button>
          <button
            type="button"
            onClick={() => onReport(thought.id)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Flag className="size-3.5" /> Report
          </button>
          <button
            type="button"
            onClick={() => onBlock(thought)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <UserRoundX className="size-3.5" /> Block user
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="size-3.5" />{" "}
        {expanded ? "Hide conversation" : `View conversation (${replies.length})`}
      </button>
      {expanded && (
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
          {!replies.length && <p className="text-sm text-muted-foreground">No replies yet.</p>}
        </div>
      )}
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
  const requireAccount = useRequireAccount();
  const [boostedThoughtIds, setBoostedThoughtIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const [thoughtsClosed, setThoughtsClosed] = useState(post.thoughtsClosed ?? false);
  const [notice, setNotice] = useState("");
  const isOp = post.handle === me.handle;
  const visibleThoughts = thoughts.filter((thought) => !thought.isHidden);

  const toggleBoost = (thoughtId: string) => {
    const hasBoosted = boostedThoughtIds.has(thoughtId);
    setBoostedThoughtIds((current) => {
      const next = new Set(current);
      if (hasBoosted) next.delete(thoughtId);
      else next.add(thoughtId);
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
  const addReply = (thoughtId: string, reply: Reply) =>
    setThoughts((current) =>
      current.map((thought) =>
        thought.id === thoughtId
          ? { ...thought, replies: [...(thought.replies ?? []), reply] }
          : thought,
      ),
    );
  const sendThought = (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireAccount()) return;
    if (!draft.trim() || thoughtsClosed) return;
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
  const hideThought = (thoughtId: string) => {
    setThoughts((current) =>
      current.map((thought) =>
        thought.id === thoughtId ? { ...thought, isHidden: true } : thought,
      ),
    );
    setNotice("Thought hidden from this post's public discussion.");
  };

  return (
    <section aria-labelledby="thoughts-heading" className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Public conversations
        </p>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h2 id="thoughts-heading" className="font-editorial text-3xl">
            Thoughts
          </h2>
          {isOp && (
            <button
              type="button"
              onClick={() => setThoughtsClosed((value) => !value)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {thoughtsClosed ? "Reopen Thoughts" : "Close Thoughts"}
            </button>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Start your own Thought. Only its author and the original poster can reply in that
          conversation.
        </p>
      </div>
      {notice && (
        <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      {thoughtsClosed ? (
        <p className="border-y border-border py-4 text-sm text-muted-foreground">
          The OP has closed new Thoughts. Existing conversations remain available.
        </p>
      ) : (
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
      )}
      <div className="space-y-4">
        {visibleThoughts.map((thought) => (
          <Conversation
            key={thought.id}
            thought={thought}
            post={post}
            onBoost={toggleBoost}
            onReply={addReply}
            boostedByMe={boostedThoughtIds.has(thought.id)}
            isOp={isOp}
            onHide={hideThought}
            onReport={() => setNotice("Report submitted for moderation review.")}
            onBlock={(author) =>
              setNotice(`${author.author} has been blocked from new interactions with you.`)
            }
          />
        ))}
      </div>
    </section>
  );
}
