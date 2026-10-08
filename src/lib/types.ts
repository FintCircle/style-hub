export type VoteChoice = { id: string; label: string; votes: number };

export type Reply = {
  id: string;
  author: string;
  handle: string;
  text: string;
  time: string;
};

/** A public one-to-one conversation between the poster and a Thought author. */
export type Thought = {
  id: string;
  /** D1 profile id of the Thought author (live posts only), used for blocking. */
  authorId?: string | undefined;
  author: string;
  handle: string;
  authorAvatar?: string | undefined;
  text: string;
  time: string;
  /** Community endorsement of useful advice. */
  boosts: number;
  replies?: Reply[] | undefined;
  /** OP visibility control; hidden Thoughts remain stored but leave the public list. */
  isHidden?: boolean | undefined;
};

export type Post = {
  id: string;
  author: string;
  handle: string;
  authorAvatar?: string | undefined;
  time: string;
  text: string;
  images: string[];
  /** Optional, single discovery home for this public post. */
  hashtag?: string | undefined;
  vote?: VoteChoice[] | undefined;
  /** epoch ms when the rush window closes; undefined = normal feed post */
  rushEndsAt?: number | undefined;
  thoughts: Thought[];
  /** Prevents new opening Thoughts without affecting existing conversations. */
  thoughtsClosed?: boolean | undefined;
  /** True when voting has been marked Done or voting period has expired. */
  isVoteClosed?: boolean | undefined;
  /** epoch ms when voting closes automatically; undefined = no automatic expiry */
  voteEndsAt?: number | undefined;
  /** Indicates whether current viewer is the author of this post. */
  isAuthor?: boolean | undefined;
  /** Stored in D1 (vs. sample content). */
  live?: boolean | undefined;
  /** Visible Thought count when the list itself isn't loaded. */
  thoughtCount?: number | undefined;
  /** Choice the signed-in viewer already picked. */
  viewerVote?: string | undefined;
};

export type Hashtag = {
  slug: string;
  name: string;
};

export function normalizeHashtag(value: string) {
  return value
    .trim()
    .replace(/^#/, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

export type Reel = {
  id: string;
  creator: string;
  handle: string;
  caption: string;
  poster: string;
  likes: number;
  duration: string;
  /** R2 video URL for live reels. */
  video?: string;
  likedByViewer?: boolean;
  /** Live reels: pending until LeBeHo reviews them. */
  status?: "pending" | "approved" | "rejected";
};

export type ProfileThought = {
  id: string;
  text: string;
  time: string;
  postId: string;
  postAuthor: string;
};

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
