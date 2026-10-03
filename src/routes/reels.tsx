import { ProfileLink } from "@/components/lebeho/ProfileLink";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, Play } from "lucide-react";
import { toast } from "sonner";
import type { Reel } from "@/lib/lebeho-data";
import { useReels } from "@/hooks/use-feed";
import { useRequireAccount } from "@/hooks/use-viewer";
import { setReelLiked } from "@/lib/lebeho.functions";
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

function ReelSlide({ reel }: { reel: Reel }) {
  const [liked, setLiked] = useState(Boolean(reel.likedByViewer));
  const requireAccount = useRequireAccount();
  const baseLikes = reel.likes - (reel.likedByViewer ? 1 : 0);

  async function toggleLike() {
    if (!requireAccount()) return;
    const next = !liked;
    setLiked(next);
    if (!reel.video) return;
    try {
      await setReelLiked({ data: { reelId: reel.id, liked: next } });
    } catch (error) {
      setLiked(!next);
      toast.error(error instanceof Error ? error.message : "Like failed.");
    }
  }

  return (
    <section className="relative h-[100svh] snap-start snap-always overflow-hidden">
      {reel.video ? (
        <video
          src={reel.video}
          poster={reel.poster || undefined}
          className="absolute inset-0 size-full object-cover"
          playsInline
          loop
          muted
          autoPlay
          preload="metadata"
        />
      ) : (
        <img
          src={reel.poster}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

      {!reel.video && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 p-5 text-reels-foreground opacity-80">
          <Play className="size-7 fill-current" />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 pb-28 text-reels-foreground">
        <div className="min-w-0">
          <p className="text-xl font-semibold tracking-tight">
            <ProfileLink
              name={reel.creator}
              handle={reel.handle}
              className="underline-offset-4 hover:underline focus-visible:underline"
            />
          </p>
          <p className="text-xs uppercase tracking-[0.2em] opacity-70">
            {reel.handle} · {reel.duration}
          </p>
          <p className="mt-3 text-[15px] leading-snug">{reel.caption}</p>
        </div>

        <button
          type="button"
          onClick={toggleLike}
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
            {formatLikes(baseLikes + (liked ? 1 : 0))}
          </span>
        </button>
      </div>
    </section>
  );
}

function formatLikes(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function Reels() {
  const { reels } = useReels();
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
