import { useState } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { ProfileLinks } from "@/components/lebeho/ProfileLinks";
import { ProfileActivity, ProfileStats } from "@/components/lebeho/ProfileActivity";
import { AboutContent } from "@/components/lebeho/AboutContent";
import { useViewer } from "@/hooks/use-viewer";
import { getPublicProfile } from "@/lib/lebeho.functions";
import { getProfile, posts, reels } from "@/lib/lebeho-data";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/profile/$handle")({
  loader: async ({ params }) => {
    const result = await getPublicProfile({ data: { handle: params.handle } });
    if (result.live) {
      if (!result.profile) throw notFound();
      return { ...result, profile: result.profile };
    }
    const profile = getProfile(params.handle);
    if (!profile) throw notFound();
    return {
      live: false,
      profile,
      posts: posts.filter((post) => post.handle === profile.handle),
      thoughts: posts.flatMap((post) =>
        post.thoughts
          .filter((thought) => thought.handle === profile.handle)
          .map((thought) => ({
            id: thought.id,
            text: thought.text,
            time: thought.time,
            postId: post.id,
            postAuthor: post.author,
          })),
      ),
      reels: reels.filter((reel) => reel.handle === profile.handle),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.profile.name ?? "Profile"} — LeBeHo` },
      { name: "description", content: loaderData?.profile.bio || "A LeBeHo fashion profile." },
      { property: "og:type", content: "profile" },
    ],
  }),
  component: PublicProfile,
});

function PublicProfile() {
  const { profile, posts: authoredPosts, thoughts, reels: authoredReels } = Route.useLoaderData();
  const viewer = useViewer();
  const [aboutOpen, setAboutOpen] = useState(false);
  const isMe = viewer.profile?.handle.toLowerCase() === profile.handle.toLowerCase();

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
          <div className="mt-8 flex items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={`${profile.name}'s profile`}
                  className="size-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full bg-primary font-editorial text-2xl text-primary-foreground">
                  {profile.name[0] || "?"}
                </div>
              )}
              <div>
                <h1 className="font-editorial text-3xl leading-none">{profile.name}</h1>
                <p className="mt-1.5 text-xs tracking-wide text-muted-foreground">
                  {profile.handle}
                </p>
              </div>
            </div>
            {isMe && (
              <Button asChild variant="outline" size="sm">
                <Link to="/profile">
                  <Pencil /> Edit profile
                </Link>
              </Button>
            )}
          </div>
          {profile.bio && <p className="mt-5 text-[15px] leading-relaxed">{profile.bio}</p>}
          <ProfileLinks
            website={profile.website}
            instagram={profile.socials?.instagram}
            tiktok={profile.socials?.tiktok}
            x={profile.socials?.x}
          />
          <ProfileStats stats={profile.stats} />
        </div>
        <ProfileActivity
          posts={authoredPosts}
          thoughts={thoughts}
          reels={authoredReels}
          onAbout={() => setAboutOpen(true)}
        />
      </main>
      <Sheet open={aboutOpen} onOpenChange={setAboutOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto flex max-h-[90dvh] max-w-xl flex-col gap-0 rounded-t-2xl p-0"
        >
          <SheetHeader className="shrink-0 border-b border-border px-5 pb-4 pt-6 pr-12 text-left sm:px-6">
            <SheetTitle className="text-balance font-editorial text-2xl leading-tight">
              About {profile.name}
            </SheetTitle>
            <SheetDescription className="text-pretty">{profile.bio || profile.handle}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
            {profile.about ? (
              <AboutContent text={profile.about} />
            ) : (
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                No about yet — check back soon to get to know them better.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <BottomNav />
    </div>
  );
}
