import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, Play } from "lucide-react";
import { reels } from "@/lib/lebeho-data";
import { BottomNav } from "@/components/lebeho/BottomNav";

export const Route = createFileRoute("/reels")({
  head: () => ({
    meta: [
      { title: "Reels — LeBeHo" },
      {
        name: "description",
        content: "Vertical fashion videos up to 60 seconds. Just watch and like.",
      },
      { property: "og:title", content: "Reels — LeBeHo" },
      { property: "og:description", content: "Short fashion video, full screen, nothing else." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reels,
});

function ReelSlide({ reel }: { reel: (typeof reels)[number] }) {
  const [liked, setLiked] = useState(false);

  return (
    <section className="relative h-[100svh] snap-start snap-always overflow-hidden">
      <img
        src={reel.poster}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 p-5 text-reels-foreground opacity-80">
        <Play className="size-7 fill-current" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 pb-28 text-reels-foreground">
        <div className="min-w-0">
          <p className="text-xl font-semibold tracking-tight">{reel.creator}</p>
          <p className="text-xs uppercase tracking-[0.2em] opacity-70">
            {reel.handle} · {reel.duration}
          </p>
          <p className="mt-3 text-[15px] leading-snug">{reel.caption}</p>
        </div>

        <button
          type="button"
          onClick={() => setLiked((l) => !l)}
          className="reel-bounce flex shrink-0 flex-col items-center gap-1"
          aria-label="Like reel"
        >
          <Heart
            className={
              "size-9 " + (liked ? "fill-reels-pop text-reels-pop like-pop" : "text-reels-foreground")
            }
            strokeWidth={1.5}
          />
          <span className="text-xs tabular-nums">
            {((reel.likes + (liked ? 1 : 0)) / 1000).toFixed(1)}k
          </span>
        </button>
      </div>
    </section>
  );
}

function Reels() {
  return (
    <div className="h-[100svh] snap-y snap-mandatory overflow-y-auto overscroll-y-contain bg-reels">
      <h1 className="pointer-events-none fixed inset-x-0 top-0 z-40 p-6 text-center text-sm font-semibold uppercase tracking-[0.3em] text-reels-foreground mix-blend-difference">
        Reels
      </h1>
      {reels.map((r) => (
        <ReelSlide key={r.id} reel={r} />
      ))}
      <BottomNav tone="dark" />
    </div>
  );
}
