export type VoteChoice = { id: string; label: string; votes: number };

export type Reply = {
  id: string;
  author: string;
  handle: string;
  text: string;
  time: string;
};

export type Thought = {
  id: string;
  author: string;
  handle: string;
  text: string;
  time: string;
  boosts: number;
  replies?: Reply[];
  isHidden?: boolean;
};

export type Post = {
  id: string;
  author: string;
  handle: string;
  avatarUrl?: string;
  avatarBorderColor?: string;
  time: string;
  text: string;
  images: string[];
  hashtag?: string;
  vote?: VoteChoice[];
  rushEndsAt?: number;
  thoughts: Thought[];
  thoughtsClosed?: boolean;
  live?: boolean;
  thoughtCount?: number;
  viewerVote?: string;
};

export type Reel = {
  id: string;
  creator: string;
  handle: string;
  caption: string;
  poster: string;
  video?: string;
  likes: number;
  duration: string;
  status?: string;
};

export function normalizeHashtag(value: string) {
  return value.trim().replace(/^#/, "").toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function getHashtagLabel(slug: string) {
  return normalizeHashtag(slug);
}

/** Compatibility types for routes being migrated to server-backed loaders. */
export const posts: Post[] = [];
export const reels: Reel[] = [];
export const hashtags: { slug: string; name: string }[] = [];
export const me = {
  name: "",
  handle: "",
  bio: "",
  website: "",
  socials: { instagram: "", tiktok: "", x: "" },
  about: "",
  avatar: "",
  stats: { posts: 0, thoughts: 0, reels: 0, likes: 0, boosts: 0 },
};

export function getHashtag(slug: string) {
  const normalized = normalizeHashtag(slug);
  return normalized ? { slug: normalized, name: normalized } : undefined;
}

export function getHashtagPosts(_slug: string): Post[] {
  return [];
}

export function getPost(_postId: string): Post | undefined {
  return undefined;
}

export function getProfile(_handle: string): Profile | undefined {
  return undefined;
}

export type Profile = {
  name: string;
  handle: string;
  bio: string;
  website?: string;
  socials?: { instagram?: string; tiktok?: string; x?: string };
  about?: string;
  avatar?: string;
  stats?: { posts: number; thoughts: number; reels: number; likes: number; boosts: number };
};

