import { createFileRoute, Link } from "@tanstack/react-router";
import { posts } from "@/lib/lebeho-data";
import { PostCard } from "@/components/lebeho/PostCard";
import { BottomNav } from "@/components/lebeho/BottomNav";

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
    ],
  }),
  component: Feed,
});

function Feed() {
  const rushCount = posts.filter((p) => p.rushEndsAt && p.rushEndsAt > Date.now()).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <h1 className="font-editorial text-2xl tracking-tight">LeBeHo</h1>
          <Link
            to="/rush"
            className="flex items-center gap-2 rounded-full border border-rush/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-rush"
          >
            <span className="size-1.5 rounded-full bg-rush rush-pulse" />
            {rushCount} in Rush Hour
          </Link>
        </div>
      </header>

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
