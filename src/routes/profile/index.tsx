import { ChangeEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AccountGate } from "@/components/lebeho/AccountGate";
import { useViewer } from "@/hooks/use-viewer";
import { useTheme, themeLabel, type ThemePreference } from "@/components/lebeho/ThemeProvider";
import { uploadMedia } from "@/lib/account";
import { getPublicProfile, updateProfile } from "@/lib/lebeho.functions";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, Pencil, Plus } from "lucide-react";
import { ProfileActivity, ProfileStats } from "@/components/lebeho/ProfileActivity";
import { AboutContent, AboutEditor } from "@/components/lebeho/AboutContent";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { ProfileLinks } from "@/components/lebeho/ProfileLinks";
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
      { title: "Profile — LeBeHo" },
      {
        name: "description",
        content: "Your LeBeHo activity: posts, Stylist thoughts, and reels in one place.",
      },
      { property: "og:title", content: "Profile — LeBeHo" },
      {
        property: "og:description",
        content: "Posts, thoughts and reels from one fashion identity.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <AccountGate>
      <Profile />
    </AccountGate>
  );
}

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

const emptyProfile: ProfileDetails = {
  name: "",
  bio: "",
  website: "",
  instagram: "",
  tiktok: "",
  x: "",
  about: "",
  avatar: "",
};

function Profile() {
  const viewer = useViewer();
  const [profile, setProfile] = useState<ProfileDetails>(emptyProfile);
  const [draft, setDraft] = useState<ProfileDetails>(emptyProfile);
  const [aboutDraft, setAboutDraft] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { preference, resolvedTheme, setPreference } = useTheme();
  const queryClient = useQueryClient();
  const live = viewer.live && viewer.profile;
  const handle = viewer.profile?.handle ?? "";
  const activity = useQuery({
    queryKey: ["profile", handle],
    queryFn: () => getPublicProfile({ data: { handle } }),
    enabled: Boolean(live && handle),
  });

  useEffect(() => {
    if (!viewer.profile) return;
    const { id: _id, handle: _h, ...details } = viewer.profile;
    setProfile(details);
    setDraft(details);
    setAboutDraft(details.about);
  }, [viewer.profile]);

  async function persist(next: ProfileDetails) {
    if (!live) return next;
    const avatarMediaId = avatarFile ? (await uploadMedia(avatarFile, "avatar")).id : undefined;
    const { avatar: _a, ...fields } = next;
    const saved = await updateProfile({
      data: { ...fields, ...(avatarMediaId ? { avatarMediaId } : {}) },
    });
    setAvatarFile(null);
    queryClient.invalidateQueries({ queryKey: ["viewer"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    const { id: _id, handle: _h, ...details } = saved;
    return details;
  }

  const updateDraft = (field: keyof ProfileDetails, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => updateDraft("avatar", String(reader.result));
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const saved = await persist(draft);
      setProfile(saved);
      setDraft(saved);
      setAboutDraft(saved.about);
      setEditOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const saveAbout = async () => {
    setSaving(true);
    try {
      const saved = await persist({ ...profile, about: aboutDraft });
      setProfile(saved);
      setDraft(saved);
      setAboutOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save your about.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-xl px-5 pt-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <Avatar avatar={profile.avatar} name={profile.name} />
            <div>
              <h1 className="font-editorial text-3xl leading-none">{profile.name || "Member"}</h1>
              <p className="mt-1.5 text-xs tracking-wide text-muted-foreground">{handle}</p>
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
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? "Saving…" : "Save profile"}
                </Button>
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
        <ProfileLinks
          website={profile.website}
          instagram={profile.instagram}
          tiktok={profile.tiktok}
          x={profile.x}
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <p className="text-sm font-medium">Appearance</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {preference === "system"
                ? `Following your device · ${resolvedTheme === "dark" ? "Dark" : "Light"}`
                : `${themeLabel(preference)} mode`}
            </p>
          </div>
          <div
            className="flex rounded-lg border border-border p-1"
            role="group"
            aria-label="Choose appearance"
          >
            {(["system", "light", "dark"] as ThemePreference[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={preference === option}
                onClick={() => setPreference(option)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${preference === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
              >
                {themeLabel(option)}
              </button>
            ))}
          </div>
        </div>

        <ProfileStats stats={activity.data?.profile?.stats} />
      </div>

      <ProfileActivity
        loading={Boolean(live) && activity.isLoading}
        posts={activity.data?.posts ?? []}
        thoughts={activity.data?.thoughts ?? []}
        reels={activity.data?.reels ?? []}
        onAbout={() => {
          setAboutDraft(profile.about);
          setAboutOpen(true);
        }}
      />

      <Sheet open={aboutOpen} onOpenChange={setAboutOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto flex max-h-[90dvh] max-w-xl flex-col gap-0 rounded-t-2xl p-0"
        >
          <SheetHeader className="shrink-0 border-b border-border px-5 pb-4 pt-6 pr-12 text-left sm:px-6">
            <SheetTitle className="text-balance font-editorial text-2xl leading-tight">
              About {profile.name || "Member"}
            </SheetTitle>
            <SheetDescription className="text-pretty">
              Your story, your point of view, and what you are about.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            <AboutEditor value={aboutDraft} onChange={setAboutDraft} maxLength={1200} />
            {aboutDraft.trim() ? (
              <section aria-label="Preview" className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
                <AboutContent text={aboutDraft} />
              </section>
            ) : (
              !profile.about && (
                <p className="text-sm text-muted-foreground">
                  No about yet — add a few words to help your people get to know you.
                </p>
              )
            )}
          </div>
          <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
            <SheetClose asChild>
              <Button variant="ghost">Cancel</Button>
            </SheetClose>
            <Button onClick={saveAbout} disabled={saving}>
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
