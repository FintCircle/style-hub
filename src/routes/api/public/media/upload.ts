import { createFileRoute } from "@tanstack/react-router";

const LIMITS = {
  image: {
    types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxBytes: 15 * 1024 * 1024,
  },
  avatar: { types: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * 1024 * 1024 },
  video: { types: ["video/mp4", "video/quicktime", "video/webm"], maxBytes: 95 * 1024 * 1024 },
} as const;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Streams one file into R2 (MEDIA) and records its key + metadata in D1. */
export const Route = createFileRoute("/api/public/media/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getCfEnv, mediaUrl } = await import("@/lib/cf-env.server");
        const { viewerFrom } = await import("@/lib/auth.server");
        const { requireCreator } = await import("@/lib/auth.server");
        const env = getCfEnv(request);
        if (!env.DB || !env.MEDIA) {
          console.error("Missing Worker bindings", {
            DB: Boolean(env.DB),
            MEDIA: Boolean(env.MEDIA),
          });
          return json(
            {
              error: `Server is missing storage bindings (DB: ${Boolean(env.DB)}, MEDIA: ${Boolean(env.MEDIA)}).`,
            },
            503,
          );
        }

        const viewer = await viewerFrom(request);
        if (!viewer) return json({ error: "Please sign in to upload." }, 401);
        try {
          await requireCreator(request);
        } catch (error) {
          return json({ error: (error as Error).message }, 403);
        }

        const kind = new URL(request.url).searchParams.get("kind") as keyof typeof LIMITS | null;
        if (!kind || !(kind in LIMITS)) return json({ error: "Unknown upload type." }, 400);
        const contentType = (request.headers.get("content-type") ?? "").split(";")[0]!.trim();
        const limit = LIMITS[kind];
        if (!(limit.types as readonly string[]).includes(contentType))
          return json({ error: "That file type isn't supported." }, 415);
        const size = Number(request.headers.get("content-length") ?? 0);
        if (!size || size > limit.maxBytes) return json({ error: "That file is too large." }, 413);
        const durationMs = Number(request.headers.get("x-duration-ms") ?? 0) || null;
        if (kind === "video" && (!durationMs || durationMs > 60_000))
          return json({ error: "Reels can be up to 60 seconds." }, 400);
        if (!request.body) return json({ error: "Empty upload." }, 400);

        const id = crypto.randomUUID();
        const folder = kind === "video" ? "reels" : kind === "avatar" ? "avatars" : "posts";
        const key = `${folder}/${viewer.profile.id}/${id}.${EXT[contentType]}`;
        await env.MEDIA.put(key, await request.arrayBuffer(), {
          httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
        });
        await viewer.db
          .prepare(
            `INSERT INTO media (id, owner_id, r2_key, kind, content_type, byte_size, duration_ms, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'ready')`,
          )
          .bind(id, viewer.profile.id, key, kind, contentType, size, durationMs)
          .run();
        return json({ id, key, url: mediaUrl(key) });
      },
    },
  },
});
