import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { PostCard } from "@/components/lebeho/PostCard";
import { getHashtag, getHashtagPosts } from "@/lib/lebeho-data";

export const Route = createFileRoute("/hashtags/$hashtag")({
  loader: ({ params }) => {
    const hashtag = getHashtag(params.hashtag);
    if (!hashtag) throw notFound();
    return { hashtag, posts: getHashtagPosts(hashtag.slug) };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `#${loaderData?.hashtag.name ?? "Hashtag"} — LeBeHo` },
      {
        name: "description",
        content: `Public fashion posts in #${loaderData?.hashtag.name ?? "this discovery space"}.`,
      },
    ],
  }),
  component: HashtagPage,
});

function HashtagPage() {
  const { hashtag, posts } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-xl">
        <div className="border-b border-border px-5 pb-7 pt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to feed
          </Link>
          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Discovery home
          </p>
          <h1 className="mt-2 font-editorial text-4xl">#{hashtag.name}</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Public posts assigned to this subject. A post has one discovery home at a time.
          </p>
        </div>

        {posts.length ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <p className="px-5 py-10 text-sm text-muted-foreground">No public posts here yet.</p>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
