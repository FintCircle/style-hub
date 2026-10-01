import { useEffect, useState } from "react";

/** True only after hydration, so time-based UI never differs between server and client HTML. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/**
 * Milliseconds left until `endsAt`, or `null` until hydration completes.
 * Returning null on the server keeps the markup stable.
 */
export function useCountdown(endsAt?: number) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(null);
      return;
    }
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
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

  if (remaining === null) {
    return <span className={"font-rush tabular-nums opacity-60 " + className}>--:--:--</span>;
  }
  if (remaining <= 0) {
    return (
      <span className={"font-rush text-sm uppercase tracking-[0.2em] opacity-70 " + className}>
        Time's up
      </span>
    );
  }
  return <span className={"font-rush tabular-nums " + className}>{formatRemaining(remaining)}</span>;
}
