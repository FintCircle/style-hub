import { ProfileLink } from "@/components/lebeho/ProfileLink";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useFeed } from "@/hooks/use-feed";
import { VoteBlock } from "@/components/lebeho/VoteBlock";
import { Countdown, useCountdown } from "@/components/lebeho/Countdown";
import { BottomNav } from "@/components/lebeho/BottomNav";
import type { Post } from "@/lib/types";

export const Route = createFileRoute("/rush")({
  head: () => ({
    meta: [
      { title: "Rush Hour — LeBeHo" },
      {
        name: "description",
        content:
          "Live fashion questions on a countdown. Help someone decide before the clock runs out.",
      },
      { property: "og:title", content: "Rush Hour — LeBeHo" },
      {
        property: "og:description",
        content: "Time-limited fashion advice. Vote fast, they're leaving in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RushHour,
});

function RushCard({ post }: { post: Post }) {
  const remaining = useCountdown(post.rushEndsAt);
  const over = remaining !== null && remaining <= 0;

  return (
    <article className="rounded-2xl border border-rush-foreground/25 bg-black/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <Countdown
          endsAt={post.rushEndsAt!}
          className="text-4xl font-bold leading-none tracking-tight"
        />
        <ProfileLink
          name={post.handle}
          handle={post.handle}
          className="font-rush text-[10px] uppercase tracking-[0.2em] opacity-80 underline-offset-4 hover:underline hover:opacity-100"
        />
      </div>

      <p className="mt-4 font-rush text-sm uppercase tracking-[0.22em]">Help me pick ↓</p>

      {post.images.length > 0 && (
        <img
          src={post.images[0]}
          alt=""
          loading="lazy"
          width={768}
          height={960}
          className="mt-4 w-full rounded-xl object-cover"
        />
      )}

      {post.vote && !over && (
        <VoteBlock
          choices={post.vote}
          variant="rush"
          postId={post.id}
          live={Boolean(post.live)}
          viewerVote={post.viewerVote}
        />
      )}

      <p className="mt-4 text-[15px] leading-relaxed">{post.text}</p>

      {over && (
        <p className="mt-3 font-rush text-xs uppercase tracking-[0.2em] opacity-70">
          Window closed — they've left
        </p>
      )}
    </article>
  );
}

function RushHour() {
  const { posts: rushPosts } = useFeed({ rushOnly: true });

  return (
    <div className="rush-surface min-h-screen pb-24">
      <header className="px-5 pt-8">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between">
            <h1 className="font-rush text-4xl font-bold uppercase leading-none tracking-tight">
              Rush
              <br />
              Hour
            </h1>
            <Link
              to="/"
              className="font-rush text-[10px] uppercase tracking-[0.2em] opacity-80 underline underline-offset-4"
            >
              Back to Feed
            </Link>
          </div>
          <p className="mt-3 font-rush text-xs uppercase tracking-[0.22em] opacity-85">
            <span className="mr-2 inline-block size-2 rounded-full bg-rush-foreground rush-pulse align-middle" />
            {rushPosts.length} people need you right now
          </p>
        </div>
      </header>

      <div className="mx-auto mt-8 grid max-w-xl gap-5 px-5">
        {rushPosts.map((p) => (
          <RushCard key={p.id} post={p} />
        ))}
      </div>

      <BottomNav tone="dark" />
    </div>
  );
}
