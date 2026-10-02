import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileVideo, ImagePlus, Timer, Plus, Upload, X } from "lucide-react";
import { BottomNav } from "@/components/lebeho/BottomNav";
import { hashtags, normalizeHashtag } from "@/lib/lebeho-data";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create — LeBeHo" },
      {
        name: "description",
        content: "Post a look, start a fashion conversation, add a vote, or go Rush Hour.",
      },
      { property: "og:title", content: "Create — LeBeHo" },
      {
        property: "og:description",
        content: "Text, photos, votes and Rush Hour countdowns — or a 60-second reel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Create,
});

const durations = [15, 30, 60, 120];
const maxPhotoCount = 10;

type MediaPreview = {
  id: string;
  file: File;
  url: string;
};

function Create() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"post" | "reel">("post");
  const [text, setText] = useState("");
  const [withVote, setWithVote] = useState(false);
  const [choices, setChoices] = useState(["", ""]);
  const [rush, setRush] = useState(false);
  const [minutes, setMinutes] = useState(30);
  const [hashtagInput, setHashtagInput] = useState("");
  const [selectedHashtag, setSelectedHashtag] = useState<string | undefined>();
  const [photos, setPhotos] = useState<MediaPreview[]>([]);
  const [reel, setReel] = useState<MediaPreview | undefined>();
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [done, setDone] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const reelInputRef = useRef<HTMLInputElement>(null);
  const selectedMediaRef = useRef<{ photos: MediaPreview[]; reel?: MediaPreview }>({ photos: [] });
  const normalizedHashtag = normalizeHashtag(hashtagInput);
  const matchingHashtags = normalizedHashtag
    ? hashtags.filter((hashtag) => hashtag.slug.startsWith(normalizedHashtag))
    : [];
  const canCreateHashtag =
    Boolean(normalizedHashtag) && !hashtags.some((hashtag) => hashtag.slug === normalizedHashtag);

  function selectHashtag(slug: string) {
    setSelectedHashtag(slug);
    setHashtagInput("");
  }

  useEffect(() => {
    selectedMediaRef.current = { photos, reel };
  }, [photos, reel]);

  useEffect(() => {
    return () => {
      selectedMediaRef.current.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
      if (selectedMediaRef.current.reel) URL.revokeObjectURL(selectedMediaRef.current.reel.url);
    };
  }, []);

  function addPhotos(files: FileList | null) {
    if (!files) return;

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    const availableSlots = maxPhotoCount - photos.length;
    const selectedFiles = imageFiles.slice(0, availableSlots);

    if (selectedFiles.length !== files.length || imageFiles.length !== files.length) {
      setUploadError(`Choose image files only, up to ${maxPhotoCount} photos.`);
    } else {
      setUploadError(undefined);
    }

    setPhotos((current) => [
      ...current,
      ...selectedFiles.map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
  }

  function removePhoto(photo: MediaPreview) {
    URL.revokeObjectURL(photo.url);
    setPhotos((current) => current.filter(({ id }) => id !== photo.id));
    setUploadError(undefined);
  }

  function chooseReel(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setUploadError("Choose a video file for your reel.");
      return;
    }

    setReel((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return {
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      };
    });
    setUploadError(undefined);
  }

  function removeReel() {
    setReel((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return undefined;
    });
    if (reelInputRef.current) reelInputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <h1 className="font-editorial text-2xl">Create</h1>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          aria-label="Close"
          className="text-muted-foreground"
        >
          <X className="size-5" strokeWidth={1.5} />
        </button>
      </header>

      <div className="mx-auto max-w-xl px-5 py-7">
        <div className="flex gap-2">
          {(["post", "reel"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={
                "rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors " +
                (mode === m
                  ? "border-foreground bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground")
              }
            >
              {m === "post" ? "Feed post" : "Reel"}
            </button>
          ))}
        </div>

        {mode === "post" ? (
          <div className="mt-7">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="What are you wearing, thinking, or asking about?"
              className="w-full resize-none border-b border-border bg-transparent pb-4 font-editorial text-xl leading-relaxed outline-none placeholder:font-body placeholder:text-base placeholder:text-muted-foreground"
            />

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                addPhotos(event.target.files);
                event.target.value = "";
              }}
            />
            {photos.length > 0 && (
              <div
                className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3"
                aria-label="Selected photos"
              >
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-secondary"
                  >
                    <img src={photo.url} alt={photo.file.name} className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo)}
                      aria-label={`Remove ${photo.file.name}`}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < maxPhotoCount && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-border py-8 text-sm text-muted-foreground"
              >
                <ImagePlus className="size-5" strokeWidth={1.5} />
                {photos.length ? `Add photos (${photos.length}/${maxPhotoCount})` : "Add photos"}
              </button>
            )}

            <section className="mt-7 border-t border-border pt-5" aria-labelledby="hashtag-label">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <h2 id="hashtag-label" className="text-sm">
                    Discovery hashtag
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Optional. Choose one subject home for this public post.
                  </p>
                </div>
                {selectedHashtag && (
                  <button
                    type="button"
                    onClick={() => setSelectedHashtag(undefined)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    #
                    {hashtags.find((hashtag) => hashtag.slug === selectedHashtag)?.name ??
                      selectedHashtag}{" "}
                    ×
                  </button>
                )}
              </div>
              {!selectedHashtag && (
                <div className="mt-4">
                  <label className="sr-only" htmlFor="hashtag">
                    Search or create a hashtag
                  </label>
                  <input
                    id="hashtag"
                    value={hashtagInput}
                    onChange={(event) => setHashtagInput(event.target.value)}
                    placeholder="Search or create a subject"
                    className="w-full rounded-full border border-border bg-transparent px-5 py-3 text-sm outline-none focus:border-foreground"
                  />
                  {normalizedHashtag && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card">
                      {matchingHashtags.map((hashtag) => (
                        <button
                          key={hashtag.slug}
                          type="button"
                          onClick={() => selectHashtag(hashtag.slug)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-secondary"
                        >
                          <span>#{hashtag.name}</span>
                          <span className="text-xs text-muted-foreground">Use existing</span>
                        </button>
                      ))}
                      {canCreateHashtag && (
                        <button
                          type="button"
                          onClick={() => selectHashtag(normalizedHashtag)}
                          className="flex w-full items-center justify-between border-t border-border px-4 py-3 text-left text-sm hover:bg-secondary"
                        >
                          <span>Create #{hashtagInput.trim().replace(/^#/, "")}</span>
                          <span className="text-xs text-muted-foreground">New discovery home</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            <label className="mt-7 flex items-center justify-between border-t border-border pt-5 text-sm">
              Add a vote
              <input
                type="checkbox"
                checked={withVote}
                onChange={(e) => setWithVote(e.target.checked)}
                className="size-4 accent-[var(--foreground)]"
              />
            </label>

            {withVote && (
              <div className="mt-4 space-y-2">
                {choices.map((c, i) => (
                  <input
                    key={i}
                    value={c}
                    onChange={(e) =>
                      setChoices((list) => list.map((v, j) => (j === i ? e.target.value : v)))
                    }
                    placeholder={`Choice ${String.fromCharCode(65 + i)}`}
                    className="w-full rounded-full border border-border bg-transparent px-5 py-3 text-sm outline-none focus:border-foreground"
                  />
                ))}
                {choices.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setChoices((l) => [...l, ""])}
                    className="flex items-center gap-1.5 pt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    <Plus className="size-3.5" /> Add choice
                  </button>
                )}
              </div>
            )}

            <label className="mt-6 flex items-center justify-between border-t border-border pt-5 text-sm">
              <span className="flex items-center gap-2">
                <Timer className="size-4 text-rush" strokeWidth={1.75} /> Make it Rush Hour
              </span>
              <input
                type="checkbox"
                checked={rush}
                onChange={(e) => setRush(e.target.checked)}
                className="size-4 accent-[var(--rush)]"
              />
            </label>

            {rush && (
              <div className="mt-4 rounded-2xl rush-surface p-5">
                <p className="font-rush text-xs uppercase tracking-[0.22em]">Countdown</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {durations.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setMinutes(d)}
                      className={
                        "rounded-full border px-4 py-2 font-rush text-xs uppercase tracking-[0.15em] " +
                        (minutes === d
                          ? "border-rush-foreground bg-rush-foreground/20"
                          : "border-rush-foreground/40")
                      }
                    >
                      {d < 60 ? `${d} min` : `${d / 60} h`}
                    </button>
                  ))}
                </div>
                <p className="mt-3 font-rush text-[11px] uppercase tracking-[0.2em] opacity-85">
                  Urgency ends automatically when time runs out
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-7">
            <input
              ref={reelInputRef}
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(event) => {
                chooseReel(event.target.files);
                event.target.value = "";
              }}
            />
            {reel ? (
              <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-reels">
                <video src={reel.url} controls playsInline className="size-full object-cover" />
                <button
                  type="button"
                  onClick={removeReel}
                  aria-label="Remove selected reel"
                  className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => reelInputRef.current?.click()}
                className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-2xl bg-reels text-reels-foreground"
              >
                <FileVideo className="size-8" strokeWidth={1.25} />
                <span className="text-sm">Upload a vertical video</span>
                <span className="text-xs opacity-60">Up to 60 seconds · likes only</span>
              </button>
            )}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a caption…"
              className="mt-5 w-full border-b border-border bg-transparent pb-3 text-[15px] outline-none placeholder:text-muted-foreground"
            />
          </div>
        )}

        {uploadError && <p className="mt-3 text-sm text-destructive">{uploadError}</p>}

        <button
          type="button"
          onClick={() => setDone(true)}
          className="mt-8 w-full rounded-full bg-primary py-4 text-[11px] uppercase tracking-[0.25em] text-primary-foreground"
        >
          <Upload className="mr-2 inline size-3.5" strokeWidth={1.75} />
          {mode === "reel" ? "Publish reel" : rush ? `Post to Rush Hour` : "Post to Feed"}
        </button>

        {done && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Ready to publish
            {selectedHashtag
              ? ` to #${hashtags.find((hashtag) => hashtag.slug === selectedHashtag)?.name ?? selectedHashtag}`
              : ""}{" "}
            {mode === "reel" && reel ? ` with ${reel.file.name}` : ""}
            {mode === "post" && photos.length
              ? ` with ${photos.length} photo${photos.length === 1 ? "" : "s"}`
              : ""}
            — upload is ready for publishing.
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
