import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Timer } from "lucide-react";
import { Countdown, useCountdown } from "@/components/lebeho/Countdown";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { ProfileLink } from "@/components/lebeho/ProfileLink";
import { Thoughts } from "@/components/lebeho/Thoughts";
import { VoteBlock } from "@/components/lebeho/VoteBlock";
import { PostImageGallery } from "@/components/lebeho/PostImageGallery";
import { HashtagLink } from "@/components/lebeho/HashtagLink";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useViewer } from "@/hooks/use-viewer";
import type { Post } from "@/lib/types";
import { getPostDetail } from "@/lib/lebeho.functions";

export const Route = createFileRoute("/posts/$postId")({
  head: () => ({
    meta: [
      { title: "Post — LeBeHo" },
      {
        name: "description",
        content: "A fashion conversation on LeBeHo.",
      },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-xl">
        <BackLink />
        <LivePost />
      </main>
      <BottomNav />
    </div>
  );
}

function BackLink() {
  const router = useRouter();
  return (
    <div className="px-5 pt-8">
      <Link
        to="/"
        onClick={(event) => {
          if (window.history.length > 1) {
            event.preventDefault();
            router.history.back();
          }
        }}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>
    </div>
  );
}

function LivePost() {
  const { postId } = Route.useParams();
  const { isLoaded, isSignedIn } = useAuth();
  const { profile } = useViewer();
  const query = useQuery({
    queryKey: ["post", postId, isSignedIn ?? false],
    queryFn: () => getPostDetail({ data: { postId } }),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4 px-5 py-8" aria-busy="true" aria-label="Loading post">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="aspect-square w-full" />
      </div>
    );
  }

  const post = query.data?.post;
  if (!post) {
    return (
      <div className="px-5 py-16 text-center">
        <h1 className="font-editorial text-3xl">Post unavailable</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {query.isError
            ? "We couldn't load this post. Please try again."
            : "This post may have been removed, or the link is incorrect."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-primary-foreground"
        >
          Go to feed
        </Link>
      </div>
    );
  }

  return (
    <PostView post={post}>
      <Thoughts
        post={post}
        live
        viewerHandle={profile?.handle ?? ""}
        boostedThoughtIds={query.data?.boostedThoughtIds ?? []}
        onChanged={() => query.refetch()}
      />
    </PostView>
  );
}

function PostView({ post, children }: { post: Post; children: React.ReactNode }) {
  const remaining = useCountdown(post.rushEndsAt);
  const live = Boolean(post.rushEndsAt) && (remaining === null || remaining > 0);
  return (
    <>
      <article className="px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/profile/$handle" params={{ handle: post.handle }} tabIndex={-1}>
              <Avatar className="size-10 shrink-0">
                <AvatarImage
                  src={post.authorAvatar}
                  alt={`${post.author}'s avatar`}
                  loading="lazy"
                  decoding="async"
                />
                <AvatarFallback className="bg-primary font-editorial text-sm text-primary-foreground">
                  {(post.author || "?")[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <h1 className="font-editorial text-2xl leading-none">
                <ProfileLink name={post.author} handle={post.handle} />
              </h1>
              <p className="mt-1 text-xs tracking-wide text-muted-foreground">
                <ProfileLink
                  name={post.handle}
                  handle={post.handle}
                  className="hover:text-foreground hover:underline"
                />{" "}
                · {post.time}
              </p>
            </div>
          </div>
          {live && (
            <span className="flex items-center gap-1.5 rounded-full border border-rush/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-rush">
              <Timer className="size-3" /> Rush
            </span>
          )}
        </header>
        {post.text && <p className="mt-5 text-[18px] leading-relaxed break-words">{post.text}</p>}
        {post.hashtag && <HashtagLink hashtag={post.hashtag} className="mt-4" />}
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
      </article>
      <div className="border-t border-border px-5 py-8">{children}</div>
    </>
  );
}
