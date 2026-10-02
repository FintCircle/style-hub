import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { PostCard } from "@/components/lebeho/PostCard";
import { getProfile, posts } from "@/lib/lebeho-data";

export const Route = createFileRoute("/profile/$handle")({
  loader: ({ params }) => {
    const profile = getProfile(params.handle);
    if (!profile) throw notFound();
    return profile;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Profile"} — LeBeHo` },
      { name: "description", content: loaderData?.bio ?? "A LeBeHo fashion profile." },
    ],
  }),
  component: PublicProfile,
});

function PublicProfile() {
  const profile = Route.useLoaderData();
  const authoredPosts = posts.filter((post) => post.handle === profile.handle);
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
          <div className="mt-8 flex items-center gap-5">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary font-editorial text-2xl text-primary-foreground">
              {profile.name[0]}
            </div>
            <div>
              <h1 className="font-editorial text-3xl leading-none">{profile.name}</h1>
              <p className="mt-1.5 text-xs tracking-wide text-muted-foreground">{profile.handle}</p>
            </div>
          </div>
          <p className="mt-5 text-[15px] leading-relaxed">{profile.bio}</p>
        </div>
        <div className="mt-8 border-t border-border">
          <p className="px-5 pt-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Posts
          </p>
          {authoredPosts.length ? (
            authoredPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="px-5 py-8 text-sm text-muted-foreground">No posts yet.</p>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
