import post1 from "@/assets/post-1.jpg";
import post2 from "@/assets/post-2.jpg";
import post3 from "@/assets/post-3.jpg";
import reel1 from "@/assets/reel-1.jpg";

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
  author: string;
  handle: string;
  text: string;
  time: string;
  /** Community endorsement of useful advice. */
  boosts: number;
  replies?: Reply[];
  /** OP visibility control; hidden Thoughts remain stored but leave the public list. */
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
  /** Optional, single discovery home for this public post. */
  hashtag?: string;
  vote?: VoteChoice[];
  /** epoch ms when the rush window closes; undefined = normal feed post */
  rushEndsAt?: number;
  thoughts: Thought[];
  /** Prevents new opening Thoughts without affecting existing conversations. */
  thoughtsClosed?: boolean;
  /** Stored in D1 (vs. sample content). */
  live?: boolean;
  /** Visible Thought count when the list itself isn't loaded. */
  thoughtCount?: number;
  /** Choice the signed-in viewer already picked. */
  viewerVote?: string;
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
    hashtag: "menswear",
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
        boosts: 24,
        text: "A, but swap the gold clutch for something structured. The heels already carry the shine.",
        replies: [
          {
            id: "r1",
            author: "Amara Nsubuga",
            handle: "@amara",
            time: "3m",
            text: "Good point — structured it is. I have a small black box bag that will do the job.",
          },
          {
            id: "r2",
            author: "Kemi O.",
            handle: "@kemistyles",
            time: "2m",
            text: "Exactly. That will keep the whole look intentional.",
          },
        ],
      },
      {
        id: "t2",
        author: "Noah",
        handle: "@noahfits",
        time: "2m",
        boosts: 11,
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
    images: [post1, post3],
    hashtag: "menswearuk",
    thoughts: [
      {
        id: "t3",
        author: "Dami",
        handle: "@damiwears",
        time: "20m",
        boosts: 18,
        text: "Agreed — the volume only reads expensive when the shoe stays quiet.",
        replies: [
          {
            id: "r3",
            author: "Lina Carr",
            handle: "@linacarr",
            time: "15m",
            text: "Yes — a simple toe gives the coat room to do all the talking.",
          },
        ],
      },
    ],
  },
  {
    id: "p3",
    author: "Theo Mbeki",
    handle: "@theo",
    time: "1h",
    text: "Unpopular take: white sneakers with a worsted suit still works, but only if the trouser breaks clean. Where do you land?",
    images: [post3, post2, post1, post2, post1],
    hashtag: "streetwear",
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
        boosts: 9,
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
    hashtag: "thrift",
    thoughts: [],
  },
];

export type Hashtag = {
  slug: string;
  name: string;
};

/** Community-created discovery homes available to reuse while creating a post. */
export const hashtags: Hashtag[] = [
  { slug: "menswear", name: "Menswear" },
  { slug: "menswearuk", name: "MenswearUK" },
  { slug: "menswearvintage", name: "MenswearVintage" },
  { slug: "streetwear", name: "Streetwear" },
  { slug: "thrift", name: "Thrift" },
];

export function normalizeHashtag(value: string) {
  return value
    .trim()
    .replace(/^#/, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

export function getHashtag(slug: string) {
  return hashtags.find((hashtag) => hashtag.slug === normalizeHashtag(slug));
}

export function getHashtagLabel(slug: string) {
  return getHashtag(slug)?.name ?? slug;
}

export function getHashtagPosts(slug: string) {
  const normalizedSlug = normalizeHashtag(slug);
  return posts.filter((post) => post.hashtag === normalizedSlug);
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
  website: "https://lebeho.example/johnson",
  socials: { instagram: "@johnsonfits", tiktok: "@johnsonfits", x: "@johnsonfits" },
  about:
    "I am drawn to the precise parts of getting dressed: a good shoulder, a long trouser break, and the right amount of chaos. I share outfits, styling notes, and the occasional wardrobe experiment from a tailoring-first point of view.",
  avatar: post3,
  stats: { posts: 24, thoughts: 118, reels: 6, likes: 1240, boosts: 86 },
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

const seededProfileDetails: Record<string, Omit<Profile, "name" | "handle">> = {
  "@amara": {
    bio: "Evenings out, considered details, and a good rooftop table.",
    website: "https://amara.example",
    socials: { instagram: "@amaraafterdark", tiktok: "@amaraafterdark", x: "@amaraedits" },
    about:
      "I collect dinner looks, thoughtful details, and places worth dressing up for. My wardrobe is built around a little drama, a dependable black slip, and the belief that every rooftop deserves an entrance.",
    avatar: post2,
    stats: { posts: 38, thoughts: 284, reels: 12, likes: 18400, boosts: 721 },
  },
  "@kemistyles": {
    bio: "Stylist with an eye for the finishing touch.",
    website: "https://kemi.example",
    socials: { instagram: "@kemistyles", tiktok: "@kemistyles", x: "@kemistyles" },
    about:
      "I am a stylist who starts with the finishing touch: the bag, the shoe, the proportion that makes a look feel intentional. Here for practical advice and polished choices.",
    avatar: post1,
    stats: { posts: 56, thoughts: 892, reels: 27, likes: 32100, boosts: 1850 },
  },
  "@noahfits": {
    bio: "Practical fits for wherever the day goes.",
    website: "https://noahfits.example",
    socials: { instagram: "@noahfits", tiktok: "@noahfits" },
    about:
      "Getting dressed should work as hard as your day does. I share useful combinations, dependable layers, and fits that move from the commute to wherever the evening lands.",
    avatar: post3,
    stats: { posts: 31, thoughts: 410, reels: 9, likes: 9600, boosts: 418 },
  },
  "@linacarr": {
    bio: "Coats, proportion, and the long view.",
    website: "https://linacarr.example",
    socials: { instagram: "@linacarr", x: "@linacarr" },
    about:
      "I write and dress with proportion in mind. Expect coats, quiet shoes, long hems, and observations about the silhouettes that stay interesting after the trend cycle moves on.",
    avatar: post1,
    stats: { posts: 72, thoughts: 630, reels: 16, likes: 41500, boosts: 2210 },
  },
  "@damiwears": {
    bio: "Quiet shoes and thoughtful volume.",
    socials: { instagram: "@damiwears", tiktok: "@damiwears" },
    about:
      "I am interested in volume, texture, and the understated shoes that let an outfit breathe. My style is patient, useful, and made to be lived in.",
    avatar: post3,
    stats: { posts: 19, thoughts: 178, reels: 4, likes: 5300, boosts: 204 },
  },
  "@theo": {
    bio: "Tailoring, movement, and occasional unpopular takes.",
    website: "https://theo.example",
    socials: { instagram: "@theotailors", x: "@theotailors" },
    about:
      "Tailoring is a starting point, not a uniform. I make room for movement, personality, and the occasional opinion that does not go down easily.",
    avatar: post1,
    stats: { posts: 43, thoughts: 356, reels: 8, likes: 11200, boosts: 612 },
  },
  "@priyaedit": {
    bio: "A sharp edit is always the answer.",
    socials: { instagram: "@priyaedit", x: "@priyaedit" },
    about:
      "I believe a sharper edit solves most wardrobe questions. I share the pieces, proportions, and small decisions that turn plenty of clothes into a clear point of view.",
    avatar: post2,
    stats: { posts: 27, thoughts: 245, reels: 6, likes: 7800, boosts: 347 },
  },
  "@junoo": {
    bio: "Getting dressed on a deadline.",
    socials: { instagram: "@junoo", tiktok: "@junoo" },
    about:
      "I get dressed quickly and I like helping other people do the same. Expect practical outfit formulas, quick fixes, and a little more confidence before you head out the door.",
    avatar: post3,
    stats: { posts: 21, thoughts: 198, reels: 11, likes: 6900, boosts: 290 },
  },
  "@sade": {
    bio: "Thrifted pieces, patiently remade.",
    website: "https://sade.example",
    socials: { instagram: "@sademakes", tiktok: "@sademakes" },
    about:
      "I find, mend, and remake clothes with a history. My wardrobe is proof that a good piece can have more than one life when you give it some patience.",
    avatar: post2,
    stats: { posts: 35, thoughts: 302, reels: 14, likes: 15800, boosts: 980 },
  },
};

export function getProfile(handle: string): Profile | undefined {
  const normalizedHandle = `@${handle.replace(/^@/, "").toLowerCase()}`;
  if (normalizedHandle === me.handle) return me;

  const author = posts
    .flatMap((post) => [
      { name: post.author, handle: post.handle },
      ...post.thoughts.flatMap((thought) => [
        { name: thought.author, handle: thought.handle },
        ...(thought.replies ?? []).map((reply) => ({ name: reply.author, handle: reply.handle })),
      ]),
    ])
    .find((person) => person.handle.toLowerCase() === normalizedHandle);

  return (
    author && {
      ...author,
      ...(seededProfileDetails[normalizedHandle] ?? {
        bio: "Sharing a point of view on LeBeHo.",
      }),
    }
  );
}

export function getPost(postId: string) {
  return posts.find((post) => post.id === postId);
}
