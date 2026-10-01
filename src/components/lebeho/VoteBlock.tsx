import { useState } from "react";
import type { VoteChoice } from "@/lib/lebeho-data";

export function VoteBlock({
  choices,
  variant = "feed",
}: {
  choices: VoteChoice[];
  variant?: "feed" | "rush";
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const total = choices.reduce((s, c) => s + c.votes, 0) + (picked ? 1 : 0);
  const rush = variant === "rush";

  return (
    <div className="mt-4 space-y-2">
      {choices.map((c) => {
        const votes = c.votes + (picked === c.id ? 1 : 0);
        const pct = total ? Math.round((votes / total) * 100) : 0;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setPicked((p) => p ?? c.id)}
            className={
              "relative w-full overflow-hidden rounded-full border px-5 py-3 text-left text-sm transition-colors " +
              (rush
                ? "border-rush-foreground/40 font-rush uppercase tracking-[0.12em]"
                : "border-foreground/25 hover:border-foreground/60")
            }
          >
            <span
              className={
                "absolute inset-y-0 left-0 transition-[width] duration-700 ease-out " +
                (rush ? "bg-rush-foreground/20" : "bg-foreground/8")
              }
              style={{ width: picked ? `${pct}%` : "0%" }}
            />
            <span className="relative flex items-center justify-between gap-3">
              <span className={picked === c.id ? "font-semibold" : ""}>{c.label}</span>
              {picked && <span className="tabular-nums opacity-70">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <p
        className={
          "pt-1 text-xs " + (rush ? "opacity-80" : "text-muted-foreground")
        }
      >
        {picked ? `${total} votes` : `${total} votes · tap to choose`}
      </p>
    </div>
  );
}
