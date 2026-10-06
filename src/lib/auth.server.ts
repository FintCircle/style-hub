import { createClerkClient, verifyToken } from "@clerk/backend";
import { db as loadDb, getClerkSecret, loadWorkersEnv, mediaUrl, type D1Database } from "./cf-env.server";

export const ADMIN_EMAIL = "mderrickm00@gmail.com";

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
  profile_border_color: string;
  email: string | null;
  is_restricted: number | null;
  created_at: string;
};

/** Verifies the Clerk session token sent as `Authorization: Bearer <token>`. */
export async function clerkUserIdFrom(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  await loadWorkersEnv();
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

const PROFILE_COLORS = ["#C77D61", "#6C8E8A", "#B493C5", "#C7A36A", "#6F88B8", "#A4775B"];

function profileColor(seed: string) {
  const hash = [...seed].reduce((total, character) => total + character.charCodeAt(0), 0);
  return PROFILE_COLORS[hash % PROFILE_COLORS.length];
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
    const taken = await db.prepare("SELECT 1 FROM profiles WHERE username = ?").bind(username).first();
    if (taken) continue;
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO profiles (id, clerk_user_id, username, display_name, email, profile_image_url, profile_border_color)
         VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(clerk_user_id) DO NOTHING`,
      )
      .bind(id, clerkUserId, username, displayName, email, user.imageUrl ?? null, profileColor(clerkUserId))
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
  const db = await loadDb(request);
  if (!db) return null;
  const clerkUserId = await clerkUserIdFrom(request);
  if (!clerkUserId) return null;
  return { db, profile: await ensureProfile(db, clerkUserId) };
}

export async function requireViewer(request: Request) {
  if (!(await loadDb(request))) throw new Error("Server is missing the DB binding.");
  const viewer = await viewerFrom(request);
  if (!viewer) throw new Error("Please sign in to continue.");
  return viewer;
}

export function isAdminProfile(row: ProfileRow) {
  return (row.email ?? "").trim().toLowerCase() === ADMIN_EMAIL;
}

/** Signed-in viewer who is allowed to upload / create content. */
export async function requireCreator(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer.profile.is_restricted && !isAdminProfile(viewer.profile))
    throw new Error("Your account is restricted from uploading or creating content.");
  return viewer;
}

/** Admin only — re-checks the verified primary email with Clerk. */
export async function requireAdmin(request: Request) {
  const viewer = await requireViewer(request);
  const clerk = createClerkClient({ secretKey: getClerkSecret()! });
  const user = await clerk.users.getUser(viewer.profile.clerk_user_id);
  const primary = user.primaryEmailAddress;
  const ok =
    primary?.emailAddress.toLowerCase() === ADMIN_EMAIL && primary.verification?.status === "verified";
  if (!ok) throw new Error("Admins only.");
  return viewer;
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
    isAdmin: isAdminProfile(row),
    restricted: Boolean(row.is_restricted),
  };
}
