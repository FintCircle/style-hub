import { Link } from "@tanstack/react-router";
import { MessageSquareQuote, Timer } from "lucide-react";
import type { Post } from "@/lib/lebeho-data";
import { VoteBlock } from "./VoteBlock";
import { Countdown, useCountdown } from "./Countdown";
import { ProfileLink } from "./ProfileLink";
import { PostImageGallery } from "./PostImageGallery";
import { HashtagLink } from "./HashtagLink";
import { ProfileAvatar } from "./ProfileAvatar";

export function PostCard({ post }: { post: Post }) {
  const remaining = useCountdown(post.rushEndsAt);
  const live = Boolean(post.rushEndsAt) && (remaining === null || remaining > 0);

  return (
    <article className="border-b border-border px-5 py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <ProfileAvatar
            name={post.author}
            src={post.avatarUrl}
            borderColor={post.avatarBorderColor}
          />
          <div>
          <h3 className="font-editorial text-lg leading-none">
            <ProfileLink name={post.author} handle={post.handle} />
          </h3>
          <p className="mt-1 text-xs tracking-wide text-muted-foreground">
            {post.handle} · {post.time}
          </p>
          </div>
        </div>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full border border-rush/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-rush">
            <Timer className="size-3" /> Rush
          </span>
        )}
      </header>

      {post.live ? (
        post.text && <p className="mt-4 text-[17px] leading-relaxed">{post.text}</p>
      ) : (
        <Link
          to="/posts/$postId"
          params={{ postId: post.id }}
          className="mt-4 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <p className="text-[17px] leading-relaxed">{post.text}</p>
        </Link>
      )}
      {post.hashtag && <HashtagLink hashtag={post.hashtag} className="mt-3" />}

      <PostImageGallery images={post.images} author={post.author} />
      {post.vote && (
        <VoteBlock
          choices={post.vote}
          postId={post.id}
          live={Boolean(post.live)}
          viewerVote={post.viewerVote}
        />
      )}
      {live && post.rushEndsAt && (
        <p className="mt-4 text-sm text-rush">
          Closes in <Countdown endsAt={post.rushEndsAt} className="font-semibold" />
        </p>
      )}

      {post.live ? (
        <p className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <MessageSquareQuote className="size-4" strokeWidth={1.5} /> {post.thoughtCount ?? 0} Stylist
          thoughts
        </p>
      ) : (
        <Link
          to="/posts/$postId"
          params={{ postId: post.id }}
          className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <MessageSquareQuote className="size-4" strokeWidth={1.5} /> {post.thoughts.length} Stylist
          thoughts
        </Link>
      )}
    </article>
  );
}
