import { Link } from "@tanstack/react-router";
import { Home, Timer, Clapperboard, Plus, User } from "lucide-react";

const items = [
  { to: "/", label: "Feed", Icon: Home },
  { to: "/rush", label: "Rush", Icon: Timer },
  { to: "/create", label: "Create", Icon: Plus },
  { to: "/reels", label: "Reels", Icon: Clapperboard },
  { to: "/profile", label: "You", Icon: User },
] as const;

export function BottomNav({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <nav
      className={
        "fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-xl " +
        (dark
          ? "border-white/10 bg-reels/85 text-reels-foreground"
          : "border-border bg-background/90 text-foreground")
      }
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-[0.18em] opacity-50 transition-opacity"
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "!opacity-100" }}
            >
              <Icon className="size-[22px]" strokeWidth={1.5} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
