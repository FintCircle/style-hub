import { ProfileLink } from "@/components/lebeho/ProfileLink";
import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, Play, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import type { Reel } from "@/lib/types";
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

function ReelSlide({
  reel,
  active,
  registerSection,
}: {
  reel: Reel;
  active: boolean;
  registerSection: (element: HTMLElement | null, id: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(Boolean(reel.likedByViewer));
  const [muted, setMuted] = useState(true);
  const requireAccount = useRequireAccount();
  const baseLikes = reel.likes - (reel.likedByViewer ? 1 : 0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.muted = muted;
      void video.play().catch(() => undefined);
      return;
    }
    video.pause();
    video.muted = true;
    video.currentTime = 0;
  }, [active]);

  useEffect(() => {
    if (videoRef.current && active) videoRef.current.muted = muted;
  }, [active, muted]);

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
    <section
      ref={(element) => registerSection(element, reel.id)}
      data-reel-id={reel.id}
      className="relative h-[calc(100svh-76px)] snap-start snap-always overflow-hidden"
    >
      {reel.video ? (
        <video
          ref={videoRef}
          src={reel.video}
          poster={reel.poster || undefined}
          className="absolute inset-0 size-full object-cover"
          playsInline
          loop
          muted={muted}
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

      {reel.video && (
        <button
          type="button"
          onClick={() => setMuted((value) => !value)}
          aria-label={muted ? "Turn reel sound on" : "Mute reel"}
          className="absolute right-5 top-5 z-10 flex size-11 items-center justify-center rounded-full border border-white/40 bg-black/30 text-reels-foreground backdrop-blur-sm transition-colors hover:bg-black/50"
        >
          {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        </button>
      )}

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
  const [activeId, setActiveId] = useState<string | null>(reels[0]?.id ?? null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sections = useRef(new Map<string, HTMLElement>());
  const registerSection = (element: HTMLElement | null, id: string) => {
    if (element) sections.current.set(id, element);
    else sections.current.delete(id);
  };

  useEffect(() => {
    setActiveId(reels[0]?.id ?? null);
  }, [reels]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.getAttribute("data-reel-id"));
      },
      { root: containerRef.current, threshold: [0.6, 0.8, 0.95], rootMargin: "0px" },
    );
    sections.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [reels]);

  return (
    <div
      ref={containerRef}
      className="h-[calc(100svh-76px)] snap-y snap-mandatory overflow-y-auto overscroll-y-contain bg-reels"
    >
      <h1 className="pointer-events-none fixed inset-x-0 top-0 z-40 p-6 text-center text-sm font-semibold uppercase tracking-[0.3em] text-reels-foreground mix-blend-difference">
        Reels
      </h1>
      {reels.map((r) => (
        <ReelSlide
          key={r.id}
          reel={r}
          active={activeId === r.id}
          registerSection={registerSection}
        />
      ))}
      <BottomNav tone="dark" />
    </div>
  );
}
