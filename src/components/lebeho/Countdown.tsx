import { useEffect, useState } from "react";

export function useCountdown(endsAt?: number) {
  const [remaining, setRemaining] = useState(() =>
    endsAt ? Math.max(0, endsAt - Date.now()) : 0,
  );

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setRemaining(Math.max(0, endsAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return remaining;
}

export function formatRemaining(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function Countdown({ endsAt, className = "" }: { endsAt: number; className?: string }) {
  const remaining = useCountdown(endsAt);
  if (remaining <= 0) {
    return (
      <span className={"font-rush text-sm uppercase tracking-[0.2em] opacity-70 " + className}>
        Time's up
      </span>
    );
  }
  return (
    <span className={"font-rush tabular-nums " + className}>{formatRemaining(remaining)}</span>
  );
}
