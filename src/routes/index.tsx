import { createFileRoute } from "@tanstack/react-router";
import { posts } from "@/lib/lebeho-data";
import { PostCard } from "@/components/lebeho/PostCard";
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
  return (
    <div className="min-h-screen bg-background pb-24">
      <FeedHeader />

      <div className="mx-auto max-w-xl">
        <p className="px-5 pt-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Discovery
        </p>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
