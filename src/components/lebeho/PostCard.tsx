import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, MessageSquareQuote, Timer, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Post } from "@/lib/types";
import { VoteBlock } from "./VoteBlock";
import { Countdown, useCountdown } from "./Countdown";
import { ProfileLink } from "./ProfileLink";
import { PostImageGallery } from "./PostImageGallery";
import { HashtagLink } from "./HashtagLink";
import { ReportButton } from "./ReportButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { closeVotePost, deletePost } from "@/lib/lebeho.functions";

export function PostCard({ post }: { post: Post }) {
  const remaining = useCountdown(post.rushEndsAt);
  const liveRush = Boolean(post.rushEndsAt) && (remaining === null || remaining > 0);
  const queryClient = useQueryClient();
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleCloseVote() {
    if (closing) return;
    setClosing(true);
    try {
      await closeVotePost({ data: { postId: post.id } });
      toast.success("Voting marked as Done.");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      queryClient.invalidateQueries({ queryKey: ["hashtag"] });
      queryClient.invalidateQueries({ queryKey: ["hashtags"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not close vote.");
    } finally {
      setClosing(false);
    }
  }

  async function handleDeletePost() {
    if (deleting) return;
    if (!window.confirm("Are you sure you want to delete this post? All thoughts left on it will also be deleted.")) {
      return;
    }
    setDeleting(true);
    try {
      await deletePost({ data: { postId: post.id } });
      toast.success("Post deleted.");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["hashtag"] });
      queryClient.invalidateQueries({ queryKey: ["hashtags"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete post.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="border-b border-border px-5 py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/profile/$handle" params={{ handle: post.handle }} tabIndex={-1}>
            <Avatar className="size-9 shrink-0">
              <AvatarImage
                src={post.authorAvatar}
                alt={`${post.author}'s avatar`}
                loading="lazy"
                decoding="async"
              />
              <AvatarFallback className="bg-primary font-editorial text-xs text-primary-foreground">
                {(post.author || "?")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <h3 className="font-editorial text-lg leading-none">
              <ProfileLink name={post.author} handle={post.handle} />
            </h3>
            <p className="mt-1 text-xs tracking-wide text-muted-foreground">
              <ProfileLink
                name={post.handle}
                handle={post.handle}
                className="hover:text-foreground hover:underline"
              />{" "}
              ·{" "}
              <Link
                to="/posts/$postId"
                params={{ postId: post.id }}
                className="hover:text-foreground hover:underline"
              >
                {post.time}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {liveRush && (
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
          isVoteClosed={post.isVoteClosed}
          viewerVote={post.viewerVote}
        />
      )}
      {liveRush && post.rushEndsAt && (
        <p className="mt-4 text-sm text-rush">
          Closes in <Countdown endsAt={post.rushEndsAt} className="font-semibold" />
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-4">
        <Link
          to="/posts/$postId"
          params={{ postId: post.id }}
          className="flex w-fit items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <MessageSquareQuote className="size-4" strokeWidth={1.5} />{" "}
          {post.thoughtCount ?? post.thoughts.length} Stylist thoughts
        </Link>

        {post.isAuthor && (
          <div className="flex items-center gap-2">
            {post.vote && !post.isVoteClosed && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseVote}
                disabled={closing}
                className="h-7 rounded-full text-xs"
              >
                <Check className="mr-1 size-3" />
                {closing ? "Closing…" : "Done"}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDeletePost}
              disabled={deleting}
              className="h-7 rounded-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              <span className="sr-only">Delete post</span>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
