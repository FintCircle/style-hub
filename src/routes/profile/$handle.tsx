import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { PostCard } from "@/components/lebeho/PostCard";
import { getProfileByHandle } from "@/lib/lebeho.functions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/profile/$handle")({
  loader: async ({ params }) => {
    const result = await getProfileByHandle({ data: { handle: params.handle } });
    if (!result.profile) throw notFound();
    return result;
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
  const { profile, posts: authoredPosts } = Route.useLoaderData();
  const socialLinks = [
    ["Instagram", profile.socials?.instagram],
    ["TikTok", profile.socials?.tiktok],
    ["X", profile.socials?.x],
  ].filter(([, handle]) => handle);
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
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={`${profile.name}'s profile`}
                className="size-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-primary font-editorial text-2xl text-primary-foreground">
                {profile.name[0]}
              </div>
            )}
            <div>
              <h1 className="font-editorial text-3xl leading-none">{profile.name}</h1>
              <p className="mt-1.5 text-xs tracking-wide text-muted-foreground">{profile.handle}</p>
            </div>
          </div>
          <p className="mt-5 text-[15px] leading-relaxed">{profile.bio}</p>
          {(profile.website || socialLinks.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm underline underline-offset-4">
              {profile.website && (
                <a
                  className="inline-flex items-center gap-1"
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-3.5" />
                  Website
                </a>
              )}
              {socialLinks.map(([network, handle]) => (
                <span key={network}>
                  {network}: {handle}
                </span>
              ))}
            </div>
          )}
          {profile.stats && (
            <dl className="mt-6 grid grid-cols-5 gap-2 border-y border-border py-4 text-center">
              {Object.entries(profile.stats).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    {key}
                  </dt>
                  <dd className="font-editorial text-lg">{value.toLocaleString()}</dd>
                </div>
              ))}
            </dl>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button className="mt-6" variant="outline">
                About {profile.name}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="mx-auto max-w-xl rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="font-editorial text-2xl">About {profile.name}</SheetTitle>
                <SheetDescription>{profile.bio}</SheetDescription>
              </SheetHeader>
              <p className="py-6 text-[15px] leading-relaxed">
                {profile.about || "No about yet — check back soon to get to know them better."}
              </p>
            </SheetContent>
          </Sheet>
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
