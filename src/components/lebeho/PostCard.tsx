import { Link } from "@tanstack/react-router";
import { MessageSquareQuote, Timer } from "lucide-react";
import type { Post } from "@/lib/lebeho-data";
import { VoteBlock } from "./VoteBlock";
import { Countdown, useCountdown } from "./Countdown";
import { ProfileLink } from "./ProfileLink";
import { PostImageGallery } from "./PostImageGallery";
import { HashtagLink } from "./HashtagLink";
import { ReportButton } from "./ReportButton";
import { getProfile } from "@/lib/lebeho-data";

export function PostCard({ post }: { post: Post }) {
  const remaining = useCountdown(post.rushEndsAt);
  const live = Boolean(post.rushEndsAt) && (remaining === null || remaining > 0);
  const authorProfile = getProfile(post.handle);

  return (
    <article className="border-b border-border px-5 py-8">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h3 className="font-editorial text-lg leading-none">
            <ProfileLink
              name={post.author}
              handle={post.handle}
              avatar={authorProfile?.avatar}
              size="md"
            />
          </h3>
          <p className="mt-1 text-xs tracking-wide text-muted-foreground">
            {post.handle} ·{" "}
            <Link
              to="/posts/$postId"
              params={{ postId: post.id }}
              className="hover:text-foreground hover:underline"
            >
              {post.time}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {live && (
            <span className="flex items-center gap-1.5 rounded-full border border-rush/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-rush">
              <Timer className="size-3" /> Rush
            </span>
          )}
          {post.live && <ReportButton targetType="post" targetId={post.id} />}
        </div>
      </header>

      {post.text && (
        <Link
          to="/posts/$postId"
          params={{ postId: post.id }}
          className="mt-4 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <p className="text-[17px] leading-relaxed break-words">{post.text}</p>
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

      <Link
        to="/posts/$postId"
        params={{ postId: post.id }}
        className="mt-5 flex w-fit items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <MessageSquareQuote className="size-4" strokeWidth={1.5} />{" "}
        {post.thoughtCount ?? post.thoughts.length} Stylist thoughts
      </Link>
    </article>
  );
}
