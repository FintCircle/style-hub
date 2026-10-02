/** Clerk account portal + browser helpers. Publishable key is public by design. */
export const CLERK_PUBLISHABLE_KEY = "pk_live_Y2xlcmsubGViZWhvLmNvbSQ";
export const ACCOUNTS_URL = "https://accounts.lebeho.com";

function returnTo(path?: string) {
  if (typeof window === "undefined") return "https://lebeho.com";
  return path ? new URL(path, window.location.origin).toString() : window.location.href;
}

export const signUpUrl = (path?: string) =>
  `${ACCOUNTS_URL}/sign-up?redirect_url=${encodeURIComponent(returnTo(path))}`;
export const signInUrl = (path?: string) =>
  `${ACCOUNTS_URL}/sign-in?redirect_url=${encodeURIComponent(returnTo(path))}`;

export function goToSignIn(path?: string) {
  window.location.assign(signInUrl(path));
}

type ClerkGlobal = { session?: { getToken(): Promise<string | null> } | null };

export async function getSessionToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const clerk = (window as unknown as { Clerk?: ClerkGlobal }).Clerk;
  try {
    return (await clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

/** Uploads one file to R2 via the app; returns the stored media id + public URL. */
export async function uploadMedia(
  file: File,
  kind: "image" | "avatar" | "video",
  durationMs?: number,
): Promise<{ id: string; url: string }> {
  const token = await getSessionToken();
  const headers: Record<string, string> = { "content-type": file.type };
  if (token) headers["authorization"] = `Bearer ${token}`;
  if (durationMs) headers["x-duration-ms"] = String(Math.round(durationMs));
  const response = await fetch(`/api/public/media/upload?kind=${kind}`, {
    method: "POST",
    headers,
    body: file,
  });
  const body = (await response.json().catch(() => ({}))) as { id?: string; url?: string; error?: string };
  if (!response.ok || !body.id) throw new Error(body.error ?? "Upload failed.");
  return { id: body.id, url: body.url ?? "" };
}

export function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration * 1000);
    };
    video.onerror = () => reject(new Error("Couldn't read that video."));
    video.src = URL.createObjectURL(file);
  });
}
