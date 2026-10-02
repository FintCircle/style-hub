import { Link } from "@tanstack/react-router";
import { MessageSquareQuote, Timer } from "lucide-react";
import type { Post } from "@/lib/lebeho-data";
import { VoteBlock } from "./VoteBlock";
import { Countdown, useCountdown } from "./Countdown";
import { ProfileLink } from "./ProfileLink";

export function PostCard({ post }: { post: Post }) {
  const remaining = useCountdown(post.rushEndsAt);
  const live = Boolean(post.rushEndsAt) && (remaining === null || remaining > 0);

  return (
    <article className="border-b border-border px-5 py-8">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h3 className="font-editorial text-lg leading-none">
            <ProfileLink name={post.author} handle={post.handle} />
          </h3>
          <p className="mt-1 text-xs tracking-wide text-muted-foreground">
            {post.handle} · {post.time}
          </p>
        </div>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full border border-rush/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-rush">
            <Timer className="size-3" /> Rush
          </span>
        )}
      </header>

      <Link
        to="/posts/$postId"
        params={{ postId: post.id }}
        className="mt-4 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <p className="text-[17px] leading-relaxed">{post.text}</p>
        {post.images.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-sm">
            <img
              src={post.images[0]}
              alt=""
              loading="lazy"
              width={768}
              height={960}
              className="w-full object-cover"
            />
          </div>
        )}
        {post.vote && <VoteBlock choices={post.vote} />}
        {live && post.rushEndsAt && (
          <p className="mt-4 text-sm text-rush">
            Closes in <Countdown endsAt={post.rushEndsAt} className="font-semibold" />
          </p>
        )}
      </Link>

      <Link
        to="/posts/$postId"
        params={{ postId: post.id }}
        className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <MessageSquareQuote className="size-4" strokeWidth={1.5} /> {post.thoughts.length} Stylist
        thoughts
      </Link>
    </article>
  );
}
