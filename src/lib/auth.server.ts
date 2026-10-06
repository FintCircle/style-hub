import { createClerkClient, verifyToken } from "@clerk/backend";
import { getClerkSecret, getDb, mediaUrl, type D1Database } from "./cf-env.server";

export type ProfileRow = {
  id: string;
  clerk_user_id: string;
  username: string;
  display_name: string;
  bio: string;
  about: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  x_handle: string | null;
  profile_image_url: string | null;
};

/** Verifies the Clerk session token sent as `Authorization: Bearer <token>`. */
export async function clerkUserIdFrom(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const secretKey = getClerkSecret();
  if (!token || !secretKey) return null;
  try {
    const payload = await verifyToken(token, { secretKey });
    return payload.sub ?? null;
  } catch (error) {
    console.error("Clerk token rejected", error);
    return null;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

/** Returns the D1 profile for a Clerk user, creating it on first sign-in. */
export async function ensureProfile(db: D1Database, clerkUserId: string): Promise<ProfileRow> {
  const existing = await db
    .prepare("SELECT * FROM profiles WHERE clerk_user_id = ? AND deleted_at IS NULL")
    .bind(clerkUserId)
    .first<ProfileRow>();
  if (existing) return existing;

  const clerk = createClerkClient({ secretKey: getClerkSecret()! });
  const user = await clerk.users.getUser(clerkUserId);
  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    email?.split("@")[0] ||
    "LeBeHo member";
  const base = slugify(user.username ?? email?.split("@")[0] ?? displayName) || "member";

  for (let attempt = 0; attempt < 6; attempt++) {
    const username = attempt === 0 ? base : `${base}${Math.floor(Math.random() * 10_000)}`;
    const taken = await db
      .prepare("SELECT 1 FROM profiles WHERE username = ?")
      .bind(username)
      .first();
    if (taken) continue;
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO profiles (id, clerk_user_id, username, display_name, email, profile_image_url)
         VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(clerk_user_id) DO NOTHING`,
      )
      .bind(id, clerkUserId, username, displayName, email, user.imageUrl ?? null)
      .run();
    const created = await db
      .prepare("SELECT * FROM profiles WHERE clerk_user_id = ?")
      .bind(clerkUserId)
      .first<ProfileRow>();
    if (created) return created;
  }
  throw new Error("Could not create your LeBeHo profile");
}

/** Signed-in viewer for a request, or null (signed out / outside Cloudflare). */
export async function viewerFrom(request: Request) {
  const db = getDb(request);
  if (!db) return null;
  const clerkUserId = await clerkUserIdFrom(request);
  if (!clerkUserId) return null;
  return { db, profile: await ensureProfile(db, clerkUserId) };
}

export async function requireViewer(request: Request) {
  if (!getDb(request)) throw new Error("Server is missing the DB binding.");
  const viewer = await viewerFrom(request);
  if (!viewer) throw new Error("Please sign in to continue.");
  return viewer;
}

/** Signed-in viewer who is allowed to upload or create content (not restricted by admin). */
export async function requireCreator(request: Request) {
  const viewer = await requireViewer(request);
  if (Number((viewer.profile as ProfileRow & { is_restricted?: number }).is_restricted ?? 0)) {
    throw new Error("Your account is restricted from creating content on LeBeHo.");
  }
  return viewer;
}

export const ADMIN_EMAIL = "mderrickm00@gmail.com";

/** Cheap check for UI (header button): the profile email recorded from Clerk. */
export function isAdminProfile(row: ProfileRow) {
  return (
    ((row as ProfileRow & { email?: string | null }).email ?? "").toLowerCase() === ADMIN_EMAIL
  );
}

/** Admin actions: checks if viewer owns the admin email or verified in Clerk. */
export async function requireAdmin(request: Request) {
  const viewer = await requireViewer(request);
  if (isAdminProfile(viewer.profile)) {
    return viewer;
  }
  const secretKey = getClerkSecret();
  if (secretKey) {
    try {
      const clerk = createClerkClient({ secretKey });
      const user = await clerk.users.getUser(viewer.profile.clerk_user_id);
      const ok = user.emailAddresses.some(
        (e) =>
          e.emailAddress.toLowerCase() === ADMIN_EMAIL && e.verification?.status === "verified",
      );
      if (ok) return viewer;
    } catch (e) {
      console.error("Clerk admin check error", e);
    }
  }
  throw new Error("Admins only.");
}

export function toPublicProfile(row: ProfileRow) {
  return {
    id: row.id,
    name: row.display_name,
    handle: `@${row.username}`,
    bio: row.bio ?? "",
    about: row.about ?? "",
    website: row.website ?? "",
    instagram: row.instagram ?? "",
    tiktok: row.tiktok ?? "",
    x: row.x_handle ?? "",
    avatar: mediaUrl(row.profile_image_url) ?? "",
  };
}
