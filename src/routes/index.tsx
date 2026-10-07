import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useFeed } from "@/hooks/use-feed";
import { LazyPostCard } from "@/components/lebeho/LazyPostCard";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { FeedHeader } from "@/components/lebeho/FeedHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeBeHo — Fashion, discussed" },
      {
        name: "description",
        content:
          "LeBeHo is a fashion-only social platform: post looks, run votes, get Stylist thoughts, and watch fashion reels.",
      },
      { property: "og:title", content: "LeBeHo — Fashion, discussed" },
      {
        property: "og:description",
        content: "Seek opinions, share fashion thoughts, and vote on looks in a fashion-only feed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feed,
});

function Feed() {
  const { posts, live, isLoading } = useFeed();
  return (
    <div className="min-h-screen bg-background pb-24">
      <FeedHeader />

      <div className="mx-auto max-w-xl">
        <p className="px-5 pt-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Discovery
        </p>
        {posts.map((post, index) => (
          <LazyPostCard key={post.id} post={post} priority={index < 2} />
        ))}
        {live && !isLoading && posts.length === 0 && (
          <div className="px-5 py-16 text-center">
            <p className="font-editorial text-2xl">The Feed is waiting for its first look.</p>
            <Link to="/create" className="mt-4 inline-block text-sm underline underline-offset-4">
              Start the conversation
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
