import { ChangeEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, ExternalLink, Pencil, Plus } from "lucide-react";
import { posts, reels, me } from "@/lib/lebeho-data";
import { PostCard } from "@/components/lebeho/PostCard";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/profile/")({
  head: () => ({
    meta: [
      { title: `${me.name} — LeBeHo profile` },
      {
        name: "description",
        content: "Your LeBeHo activity: posts, Stylist thoughts, and reels in one place.",
      },
      { property: "og:title", content: `${me.name} — LeBeHo profile` },
      {
        property: "og:description",
        content: "Posts, thoughts and reels from one fashion identity.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

const tabs = ["Posts", "Thoughts", "Reels", "About"] as const;
type ProfileDetails = {
  name: string;
  bio: string;
  website: string;
  instagram: string;
  tiktok: string;
  x: string;
  about: string;
  avatar: string;
};

const initialProfile: ProfileDetails = {
  name: me.name,
  bio: me.bio,
  website: me.website,
  instagram: me.socials.instagram,
  tiktok: me.socials.tiktok,
  x: me.socials.x,
  about: me.about,
  avatar: me.avatar,
  website: "",
  instagram: "",
  tiktok: "",
  x: "",
  about: "",
  avatar: "",
};

function Profile() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Posts");
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [aboutDraft, setAboutDraft] = useState(initialProfile.about);
  const [editOpen, setEditOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const mine = posts.slice(0, 2);

  const updateDraft = (field: keyof ProfileDetails, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateDraft("avatar", String(reader.result));
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    setProfile(draft);
    setAboutDraft(draft.about);
    setEditOpen(false);
  };

  const saveAbout = () => {
    setProfile((current) => ({ ...current, about: aboutDraft }));
    setDraft((current) => ({ ...current, about: aboutDraft }));
    setAboutOpen(false);
  };

  const socialLinks = [
    ["Instagram", profile.instagram],
    ["TikTok", profile.tiktok],
    ["X", profile.x],
  ].filter(([, value]) => value);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-xl px-5 pt-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <Avatar avatar={profile.avatar} name={profile.name} />
            <div>
              <h1 className="font-editorial text-3xl leading-none">{profile.name}</h1>
              <p className="mt-1.5 text-xs tracking-wide text-muted-foreground">{me.handle}</p>
            </div>
          </div>
          <Sheet open={editOpen} onOpenChange={setEditOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setDraft(profile)}>
                <Pencil /> Edit profile
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="mx-auto max-h-[92dvh] max-w-xl overflow-y-auto rounded-t-2xl"
            >
              <SheetHeader>
                <SheetTitle className="font-editorial text-2xl">Edit profile</SheetTitle>
                <SheetDescription>Make your fashion identity yours.</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 py-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar avatar={draft.avatar} name={draft.name} />
                    <label className="absolute -bottom-1 -right-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-sm">
                      <Camera className="size-3.5" />
                      <span className="sr-only">Upload profile picture</span>
                      <input
                        accept="image/*"
                        className="sr-only"
                        type="file"
                        onChange={chooseAvatar}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a profile picture to make your page recognizably yours.
                  </p>
                </div>
                <ProfileField label="Name">
                  <Input value={draft.name} onChange={(e) => updateDraft("name", e.target.value)} />
                </ProfileField>
                <ProfileField label="Bio">
                  <Textarea
                    value={draft.bio}
                    maxLength={160}
                    onChange={(e) => updateDraft("bio", e.target.value)}
                  />
                </ProfileField>
                <ProfileField label="Website">
                  <Input
                    placeholder="https://your-site.com"
                    type="url"
                    value={draft.website}
                    onChange={(e) => updateDraft("website", e.target.value)}
                  />
                </ProfileField>
                <div className="border-t border-border pt-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Social handles
                  </p>
                  <div className="mt-3 space-y-3">
                    <Input
                      aria-label="Instagram handle"
                      placeholder="Instagram handle"
                      value={draft.instagram}
                      onChange={(e) => updateDraft("instagram", e.target.value)}
                    />
                    <Input
                      aria-label="TikTok handle"
                      placeholder="TikTok handle"
                      value={draft.tiktok}
                      onChange={(e) => updateDraft("tiktok", e.target.value)}
                    />
                    <Input
                      aria-label="X handle"
                      placeholder="X handle"
                      value={draft.x}
                      onChange={(e) => updateDraft("x", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </SheetClose>
                <Button onClick={saveProfile}>Save profile</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {profile.bio ? (
          <p className="mt-5 text-[15px] leading-relaxed">{profile.bio}</p>
        ) : (
          <p className="mt-5 text-[15px] text-muted-foreground">
            Tell people a little about your style.
          </p>
        )}
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
                {profile.website}
              </a>
            )}
            {socialLinks.map(([network, handle]) => (
              <span key={network}>
                {network}: {handle}
              </span>
            ))}
          </div>
        )}

        <dl className="mt-6 grid grid-cols-5 gap-2 border-y border-border py-4 text-center">
          {Object.entries(me.stats).map(([key, value]) => (
            <div key={key}>
              <dt className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                {key}
              </dt>
              <dd className="font-editorial text-lg">{value.toLocaleString()}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex gap-5">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                if (item === "About") {
                  setAboutDraft(profile.about);
                  setAboutOpen(true);
                } else setTab(item);
              }}
              className={
                "pb-2 text-[11px] uppercase tracking-[0.22em] transition-colors " +
                (tab === item
                  ? "border-b border-foreground text-foreground"
                  : "text-muted-foreground")
              }
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-xl">
        {tab === "Posts" && mine.map((post) => <PostCard key={post.id} post={post} />)}
        {tab === "Thoughts" && (
          <div className="space-y-6 px-5 py-8">
            {posts
              .flatMap((post) => post.thoughts.map((thought) => ({ thought, post })))
              .slice(0, 3)
              .map(({ thought, post }) => (
                <div key={thought.id} className="border-b border-border pb-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    On {post.author}'s post
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed">{thought.text}</p>
                </div>
              ))}
          </div>
        )}
        {tab === "Reels" && (
          <div className="grid grid-cols-3 gap-1 px-1 py-8">
            {reels.map((reel) => (
              <img
                key={reel.id}
                src={reel.poster}
                alt={reel.caption}
                loading="lazy"
                className="aspect-[9/16] w-full object-cover"
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={aboutOpen} onOpenChange={setAboutOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-xl rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-editorial text-2xl">About {profile.name}</SheetTitle>
            <SheetDescription>
              Your story, your point of view, and what you are about.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <Textarea
              aria-label="About"
              className="min-h-48"
              maxLength={1200}
              placeholder="Share your story, your style, and what people should know about you..."
              value={aboutDraft}
              onChange={(e) => setAboutDraft(e.target.value)}
            />
            {!profile.about && !aboutDraft && (
              <p className="mt-3 text-sm text-muted-foreground">
                No about yet — add a few words to help your people get to know you.
              </p>
            )}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="ghost">Cancel</Button>
            </SheetClose>
            <Button onClick={saveAbout}>
              {profile.about ? (
                "Save about"
              ) : (
                <>
                  <Plus /> Add about
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <BottomNav />
    </div>
  );
}

function Avatar({ avatar, name }: { avatar: string; name: string }) {
  return avatar ? (
    <img src={avatar} alt={`${name}'s profile`} className="size-20 rounded-full object-cover" />
  ) : (
    <div className="flex size-20 items-center justify-center rounded-full bg-primary font-editorial text-2xl text-primary-foreground">
      {name[0] || "?"}
    </div>
  );
}

function ProfileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
