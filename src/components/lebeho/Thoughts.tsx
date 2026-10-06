import { ArrowUp, EyeOff, Flag, MessageCircle, MoreHorizontal, UserRoundX } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileLink } from "./ProfileLink";
import { useRequireAccount } from "@/hooks/use-viewer";
import type { Post, Reply, Thought } from "@/lib/types";
import {
  addThought,
  addThoughtReply,
  blockUser,
  boostThought,
  closeThoughts,
  flagThought,
  hideThought as hideThoughtFn,
} from "@/lib/thoughts.functions";

const isComposing = (event: React.KeyboardEvent) =>
  event.nativeEvent.isComposing || event.keyCode === 229;

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

function OpBadge() {
  return (
    <span
      aria-label="Original poster"
      className="ml-1 inline-flex items-center rounded-sm bg-primary px-1.5 py-px align-middle text-[10px] font-medium uppercase tracking-[0.15em] text-primary-foreground"
    >
      OP
    </span>
  );
}

type ConversationProps = {
  thought: Thought;
  opHandle: string;
  opName: string;
  viewerHandle: string | undefined;
  canReply: boolean;
  onBoost: (thoughtId: string) => void;
  onReply: (thoughtId: string, text: string) => Promise<boolean>;
  boostedByMe: boolean;
  isOp: boolean;
  onHide: (thoughtId: string) => void;
  onReport: (thoughtId: string) => void;
  onBlock: (thought: Thought) => void;
};

function Conversation({
  thought,
  opHandle,
  opName,
  viewerHandle,
  canReply,
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
  const [sending, setSending] = useState(false);
  const replies = thought.replies ?? [];

  const sendReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireAccount()) return;
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await onReply(thought.id, draft.trim());
    setSending(false);
    if (!ok) return;
    setDraft("");
    setExpanded(true);
  };

  return (
    <article className="border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs tracking-wide text-muted-foreground">
            <ProfileLink
              name={thought.author}
              handle={thought.handle}
              className="font-editorial text-base text-foreground"
            />
            {thought.handle === opHandle && <OpBadge />} {thought.handle} · {thought.time}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed break-words">{thought.text}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onBoost(thought.id)}
            aria-label={`${boostedByMe ? "Remove Boost from" : "Boost"} ${thought.author}'s Thought`}
            aria-pressed={boostedByMe}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-medium tabular-nums transition-colors ${boostedByMe ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
          >
            <ArrowUp aria-hidden="true" className="size-3.5" strokeWidth={2} />{" "}
            <span>{thought.boosts}</span>
          </button>
          {isOp && thought.handle !== opHandle && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Moderation options for ${thought.author}'s Thought`}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreHorizontal aria-hidden="true" className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => onHide(thought.id)}>
                  <EyeOff aria-hidden="true" className="size-4" /> Hide Thought
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onReport(thought.id)}>
                  <Flag aria-hidden="true" className="size-4" /> Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => onBlock(thought)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserRoundX aria-hidden="true" className="size-4" /> Block {thought.author}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
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
        <ol className="mt-4 space-y-4 border-l border-border pl-4">
          {replies.map((reply) => (
            <li key={reply.id} className="flex gap-2">
              <span aria-hidden="true" className="pt-0.5 text-sm text-muted-foreground">
                ↳
              </span>
              <div className="min-w-0">
                <p className="text-xs tracking-wide text-muted-foreground">
                  <ProfileLink
                    name={reply.author}
                    handle={reply.handle}
                    className="font-editorial text-sm text-foreground"
                  />
                  {reply.handle === opHandle && <OpBadge />} {reply.handle} · {reply.time}
                </p>
                <p className="mt-1 text-[15px] leading-relaxed break-words">{reply.text}</p>
              </div>
            </li>
          ))}
          {!replies.length && <li className="text-sm text-muted-foreground">No replies yet.</li>}
        </ol>
      )}
      {!canReply && thought.handle !== opHandle && (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Only {thought.author} and {opName} (OP) can reply here.
          {viewerHandle ? " Share your own Thought to start a conversation with the OP." : ""}
        </p>
      )}
      {canReply && (
        <form onSubmit={sendReply} className="mt-4 flex gap-3 border-t border-border pt-4">
          <label htmlFor={`reply-${thought.id}`} className="sr-only">
            Reply to {viewerHandle === opHandle ? thought.author : opName}
          </label>
          <input
            id={`reply-${thought.id}`}
            value={draft}
            maxLength={1000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && isComposing(event)) event.preventDefault();
            }}
            placeholder={`Reply to ${viewerHandle === opHandle ? thought.author : opName}…`}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
          >
            {sending ? "Sending" : "Reply"}
          </button>
        </form>
      )}
    </article>
  );
}

type ThoughtsProps = {
  post: Post;
  live?: boolean;
  viewerHandle?: string;
  boostedThoughtIds?: string[];
  /** Refetches the post after a live action succeeds. */
  onChanged?: () => Promise<unknown>;
};

export function Thoughts({
  post,
  live = false,
  viewerHandle,
  boostedThoughtIds: liveBoostedIds = [],
  onChanged,
}: ThoughtsProps) {
  const [localThoughts, setLocalThoughts] = useState(post.thoughts);
  const [localBoostedIds, setLocalBoostedIds] = useState<Set<string>>(new Set());
  const [localClosed, setLocalClosed] = useState(post.thoughtsClosed ?? false);
  const requireAccount = useRequireAccount();
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState("");

  const thoughts = live ? post.thoughts : localThoughts;
  const boostedIds = live ? new Set(liveBoostedIds) : localBoostedIds;
  const thoughtsClosed = live ? (post.thoughtsClosed ?? false) : localClosed;
  const myHandle = viewerHandle;
  const isOp = Boolean(myHandle) && post.handle === myHandle;
  const visibleThoughts = thoughts.filter((thought) => !thought.isHidden);

  /** Runs a server action, refreshes the post, and surfaces failures as a notice. */
  const runLive = async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action();
      await onChanged?.();
      if (success) setNotice(success);
      return true;
    } catch (error) {
      setNotice(errorMessage(error));
      return false;
    }
  };

  const toggleBoost = (thoughtId: string) => {
    if (!requireAccount()) return;
    const hasBoosted = boostedIds.has(thoughtId);
    if (live) {
      void runLive(() => boostThought({ data: { thoughtId, boosted: !hasBoosted } }));
      return;
    }
    setLocalBoostedIds((current) => {
      const next = new Set(current);
      if (hasBoosted) next.delete(thoughtId);
      else next.add(thoughtId);
      return next;
    });
    setLocalThoughts((current) =>
      current.map((thought) =>
        thought.id === thoughtId
          ? { ...thought, boosts: thought.boosts + (hasBoosted ? -1 : 1) }
          : thought,
      ),
    );
  };

  const addReply = async (thoughtId: string, text: string) => {
    if (live) return runLive(() => addThoughtReply({ data: { thoughtId, text } }));
    const reply: Reply = {
      id: `reply-${Date.now()}`,
      author: myHandle ?? "Member",
      handle: myHandle ?? "@member",
      time: "now",
      text,
    };
    setLocalThoughts((current) =>
      current.map((thought) =>
        thought.id === thoughtId
          ? { ...thought, replies: [...(thought.replies ?? []), reply] }
          : thought,
      ),
    );
    return true;
  };

  const sendThought = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireAccount()) return;
    const text = draft.trim();
    if (!text || thoughtsClosed || posting) return;
    if (live) {
      setPosting(true);
      const ok = await runLive(() => addThought({ data: { postId: post.id, text } }));
      setPosting(false);
      if (ok) setDraft("");
      return;
    }
    setLocalThoughts((current) => [
      ...current,
      {
        id: `thought-${Date.now()}`,
        author: myHandle ?? "Member",
        handle: myHandle ?? "@member",
        time: "now",
        text,
        boosts: 0,
        replies: [],
      },
    ]);
    setDraft("");
  };

  const hideThought = (thoughtId: string) => {
    const message = "Thought hidden from this post's public discussion.";
    if (live) {
      void runLive(() => hideThoughtFn({ data: { thoughtId } }), message);
      return;
    }
    setLocalThoughts((current) =>
      current.map((thought) =>
        thought.id === thoughtId ? { ...thought, isHidden: true } : thought,
      ),
    );
    setNotice(message);
  };

  const toggleClosed = () => {
    if (live) {
      void runLive(() => closeThoughts({ data: { postId: post.id, closed: !thoughtsClosed } }));
      return;
    }
    setLocalClosed((value) => !value);
  };

  const reportThought = (thoughtId: string) => {
    const message = "Report submitted for moderation review.";
    if (live) void runLive(() => flagThought({ data: { thoughtId } }), message);
    else setNotice(message);
  };

  const blockAuthor = (thought: Thought) => {
    const message = `${thought.author} has been blocked from new interactions with you.`;
    if (live) void runLive(() => blockUser({ data: { thoughtId: thought.id } }), message);
    else setNotice(message);
  };

  return (
    <section aria-labelledby="thoughts-heading" className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Public conversations
        </p>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h2 id="thoughts-heading" className="font-editorial text-3xl">
            Thoughts{" "}
            <span className="text-lg text-muted-foreground tabular-nums">
              {visibleThoughts.length}
            </span>
          </h2>
          {isOp && (
            <button
              type="button"
              onClick={toggleClosed}
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
          <label htmlFor="new-thought" className="sr-only">
            Share a Thought
          </label>
          <input
            id="new-thought"
            value={draft}
            maxLength={1000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && isComposing(event)) event.preventDefault();
            }}
            placeholder="Share a Thought…"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={posting || !draft.trim()}
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
          >
            {posting ? "Posting" : "Post"}
          </button>
        </form>
      )}
      <div className="space-y-4">
        {visibleThoughts.map((thought) => (
          <Conversation
            key={thought.id}
            thought={thought}
            opHandle={post.handle}
            opName={post.author}
            viewerHandle={myHandle}
            canReply={Boolean(myHandle) && (thought.handle === myHandle || isOp)}
            onBoost={toggleBoost}
            onReply={addReply}
            boostedByMe={boostedIds.has(thought.id)}
            isOp={isOp}
            onHide={hideThought}
            onReport={reportThought}
            onBlock={blockAuthor}
          />
        ))}
        {!visibleThoughts.length && (
          <p className="text-sm text-muted-foreground">
            No Thoughts yet. Be the first to share one.
          </p>
        )}
      </div>
    </section>
  );
}
