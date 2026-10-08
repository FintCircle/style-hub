import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { VoteChoice } from "@/lib/types";
import { useRequireAccount } from "@/hooks/use-viewer";
import { castVote } from "@/lib/lebeho.functions";

export function VoteBlock({
  choices,
  variant = "feed",
  postId,
  live = false,
  isVoteClosed = false,
  viewerVote,
}: {
  choices: VoteChoice[];
  variant?: "feed" | "rush" | undefined;
  postId?: string | undefined;
  live?: boolean | undefined;
  isVoteClosed?: boolean | undefined;
  viewerVote?: string | undefined;
}) {
  const [picked, setPicked] = useState<string | null>(viewerVote ?? null);
  const requireAccount = useRequireAccount();
  const queryClient = useQueryClient();
  // Live counts already include the viewer's stored vote.
  const extra = (id: string) => (picked === id && picked !== viewerVote ? 1 : 0);
  const total = choices.reduce((s, c) => s + c.votes + extra(c.id), 0);
  const rush = variant === "rush";

  async function choose(id: string) {
    if (isVoteClosed || picked || !requireAccount()) return;
    setPicked(id);
    if (live && postId) {
      try {
        await castVote({ data: { postId, choiceId: id } });
        queryClient.invalidateQueries({ queryKey: ["feed"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["hashtag"] });
        queryClient.invalidateQueries({ queryKey: ["hashtags"] });
      } catch (error) {
        setPicked(null);
        toast.error(error instanceof Error ? error.message : "Vote failed.");
      }
    }
  }

  const showResults = Boolean(picked || isVoteClosed);

  return (
    <div className="mt-4 space-y-2">
      {choices.map((c) => {
        const votes = c.votes + extra(c.id);
        const pct = total ? Math.round((votes / total) * 100) : 0;
        return (
          <button
            key={c.id}
            type="button"
            disabled={isVoteClosed}
            onClick={() => choose(c.id)}
            className={
              "relative w-full overflow-hidden rounded-full border px-5 py-3 text-left text-sm transition-colors " +
              (rush
                ? "border-rush-foreground/40 font-rush uppercase tracking-[0.12em]"
                : "border-foreground/25 hover:border-foreground/60") +
              (isVoteClosed ? " cursor-default opacity-90" : "")
            }
          >
            <span
              className={
                "absolute inset-y-0 left-0 transition-[width] duration-700 ease-out " +
                (rush ? "bg-rush-foreground/20" : "bg-foreground/8")
              }
              style={{ width: showResults ? `${pct}%` : "0%" }}
            />
            <span className="relative flex items-center justify-between gap-3">
              <span className={picked === c.id ? "font-semibold" : ""}>{c.label}</span>
              {showResults && <span className="tabular-nums opacity-70">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <div className="flex items-center justify-between pt-1 text-xs">
        <p className={rush ? "opacity-80" : "text-muted-foreground"}>
          {isVoteClosed
            ? `Final results · ${total} votes`
            : picked
              ? `${total} votes`
              : `${total} votes · tap to choose`}
        </p>
        {isVoteClosed && (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
            Voting Done
          </span>
        )}
      </div>
    </div>
  );
}
