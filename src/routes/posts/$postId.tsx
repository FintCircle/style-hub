import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, Timer } from "lucide-react";
import { Countdown, useCountdown } from "@/components/lebeho/Countdown";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { ProfileLink } from "@/components/lebeho/ProfileLink";
import { Thoughts } from "@/components/lebeho/Thoughts";
import { VoteBlock } from "@/components/lebeho/VoteBlock";
import { PostImageGallery } from "@/components/lebeho/PostImageGallery";
import { HashtagLink } from "@/components/lebeho/HashtagLink";
import { getPostById } from "@/lib/lebeho.functions";

export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params }) => {
    const result = await getPostById({ data: { postId: params.postId } });
    if (!result.post) throw notFound();
    return result.post;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.author ?? "Post"} — LeBeHo` },
      { name: "description", content: loaderData?.text ?? "A fashion conversation on LeBeHo." },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const post = Route.useLoaderData();
  const remaining = useCountdown(post.rushEndsAt);
  const live = Boolean(post.rushEndsAt) && (remaining === null || remaining > 0);
  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-xl">
        <div className="px-5 pt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to feed
          </Link>
        </div>
        <article className="px-5 py-8">
          <header className="flex items-baseline justify-between gap-4">
            <div>
              <h1 className="font-editorial text-2xl leading-none">
                <ProfileLink name={post.author} handle={post.handle} />
              </h1>
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
          <p className="mt-5 text-[18px] leading-relaxed">{post.text}</p>
          {post.hashtag && <HashtagLink hashtag={post.hashtag} className="mt-4" />}
          <PostImageGallery images={post.images} author={post.author} />
          {post.vote && <VoteBlock choices={post.vote} />}
          {live && post.rushEndsAt && (
            <p className="mt-4 text-sm text-rush">
              Closes in <Countdown endsAt={post.rushEndsAt} className="font-semibold" />
            </p>
          )}
        </article>
        <div className="border-t border-border px-5 py-8">
          <Thoughts post={post} />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
