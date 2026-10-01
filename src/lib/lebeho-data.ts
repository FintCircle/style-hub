import post1 from "@/assets/post-1.jpg";
import post2 from "@/assets/post-2.jpg";
import post3 from "@/assets/post-3.jpg";
import reel1 from "@/assets/reel-1.jpg";

export type VoteChoice = { id: string; label: string; votes: number };

export type Thought = {
  id: string;
  author: string;
  handle: string;
  text: string;
  time: string;
};

export type Post = {
  id: string;
  author: string;
  handle: string;
  time: string;
  text: string;
  images: string[];
  vote?: VoteChoice[];
  /** epoch ms when the rush window closes; undefined = normal feed post */
  rushEndsAt?: number;
  thoughts: Thought[];
};

const now = Date.now();

export const posts: Post[] = [
  {
    id: "p1",
    author: "Amara Nsubuga",
    handle: "@amara",
    time: "12m",
    text: "Leaving for dinner in Kololo. Which one works better for a rooftop table?",
    images: [post2],
    vote: [
      { id: "a", label: "A · Black slip + gold", votes: 184 },
      { id: "b", label: "B · Ivory tailoring", votes: 91 },
    ],
    rushEndsAt: now + 1000 * 60 * 8 + 41_000,
    thoughts: [
      {
        id: "t1",
        author: "Kemi O.",
        handle: "@kemistyles",
        time: "4m",
        text: "A, but swap the gold clutch for something structured. The heels already carry the shine.",
      },
      {
        id: "t2",
        author: "Noah",
        handle: "@noahfits",
        time: "2m",
        text: "Rooftop means wind. Ivory suit wins on movement.",
      },
    ],
  },
  {
    id: "p2",
    author: "Lina Carr",
    handle: "@linacarr",
    time: "38m",
    text: "The oversized coat isn't going anywhere in 2026. The silhouette just moved: shorter boot, longer hem, nothing cinched.",
    images: [post1],
    thoughts: [
      {
        id: "t3",
        author: "Dami",
        handle: "@damiwears",
        time: "20m",
        text: "Agreed — the volume only reads expensive when the shoe stays quiet.",
      },
    ],
  },
  {
    id: "p3",
    author: "Theo Mbeki",
    handle: "@theo",
    time: "1h",
    text: "Unpopular take: white sneakers with a worsted suit still works, but only if the trouser breaks clean. Where do you land?",
    images: [post3],
    vote: [
      { id: "a", label: "Always works", votes: 302 },
      { id: "b", label: "Only off-duty", votes: 410 },
      { id: "c", label: "Never", votes: 88 },
    ],
    thoughts: [
      {
        id: "t4",
        author: "Priya",
        handle: "@priyaedit",
        time: "44m",
        text: "Off-duty only. The second there's a tie involved it falls apart.",
      },
    ],
  },
  {
    id: "p4",
    author: "Juno",
    handle: "@junoo",
    time: "2m",
    text: "Interview in 20 minutes. Collar in or collar out under the knit?",
    images: [],
    vote: [
      { id: "a", label: "Collar out", votes: 57 },
      { id: "b", label: "Collar in", votes: 44 },
    ],
    rushEndsAt: now + 1000 * 60 * 19,
    thoughts: [],
  },
  {
    id: "p5",
    author: "Sade A.",
    handle: "@sade",
    time: "3h",
    text: "Spent the morning re-dyeing a thrifted linen set. Fashion is cheaper when you're patient.",
    images: [],
    thoughts: [],
  },
];

export type Reel = {
  id: string;
  creator: string;
  handle: string;
  caption: string;
  poster: string;
  likes: number;
  duration: string;
};

export const reels: Reel[] = [
  {
    id: "r1",
    creator: "Mira",
    handle: "@mirainmotion",
    caption: "one dress, three ways to spin it 💃",
    poster: reel1,
    likes: 12_400,
    duration: "0:24",
  },
  {
    id: "r2",
    creator: "Theo Mbeki",
    handle: "@theo",
    caption: "how a suit should actually move when you walk",
    poster: post3,
    likes: 8_120,
    duration: "0:41",
  },
  {
    id: "r3",
    creator: "Lina Carr",
    handle: "@linacarr",
    caption: "coat check: the 2026 silhouette in 30 seconds",
    poster: post1,
    likes: 20_903,
    duration: "0:30",
  },
];

export const me = {
  name: "Johnson",
  handle: "@johnson",
  bio: "Fashion-curious. Mostly tailoring, occasionally chaos.",
  stats: { posts: 24, thoughts: 118, reels: 6 },
};
