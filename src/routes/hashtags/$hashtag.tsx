import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { LazyPostCard } from "@/components/lebeho/LazyPostCard";
import { getHashtagPage } from "@/lib/lebeho.functions";

export const Route = createFileRoute("/hashtags/$hashtag")({
  loader: ({ params }) => {
    return {
      slug: params.hashtag,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Explore #${loaderData?.slug ?? "fashion"} Fashion Posts | LeBeHo`,
      },
      {
        name: "description",
        content: `Explore honest outfit advice, style conversations, and fashion inspiration tagged #${loaderData?.slug ?? "fashion"} on LeBeHo.`,
      },
      {
        property: "og:title",
        content: `Explore #${loaderData?.slug ?? "fashion"} Fashion Posts | LeBeHo`,
      },
      {
        property: "og:description",
        content: `Find fashion conversations and style inspiration from the LeBeHo community under #${loaderData?.slug ?? "fashion"}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HashtagPage,
});

function HashtagPage() {
  const { slug } = Route.useLoaderData();
  const query = useQuery({
    queryKey: ["hashtag", slug],
    queryFn: () => getHashtagPage({ data: { slug } }),
    enabled: Boolean(slug),
  });
  const hashtag = query.data?.hashtag;
  const posts = query.data?.posts ?? [];
  const hashtagName = hashtag?.name ?? slug;

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
          <h1 className="mt-2 font-editorial text-4xl">#{hashtagName}</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Public posts assigned to this subject. A post has one discovery home at a time.
          </p>
        </div>

        {query.isLoading ? (
          <p className="px-5 py-10 text-sm text-muted-foreground">Loading posts…</p>
        ) : posts.length ? (
          posts.map((post, index) => (
            <LazyPostCard key={post.id} post={post} priority={index < 2} />
          ))
        ) : (
          <p className="px-5 py-10 text-sm text-muted-foreground">No public posts here yet.</p>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
