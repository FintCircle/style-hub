-- LeBeHo D1 schema, part 2: profile details, media (R2), hashtags, votes, Rush Hour, Reels.
-- Builds on 0001 (profiles, posts, thoughts, replies, boosts, reports, blocks).
PRAGMA foreign_keys = ON;

-- Profile details shown on profile pages.
ALTER TABLE profiles ADD COLUMN email TEXT;
ALTER TABLE profiles ADD COLUMN website TEXT;
ALTER TABLE profiles ADD COLUMN about TEXT NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN instagram TEXT;
ALTER TABLE profiles ADD COLUMN tiktok TEXT;
ALTER TABLE profiles ADD COLUMN x_handle TEXT;
ALTER TABLE profiles ADD COLUMN deleted_at TEXT;

-- Every file stored in R2. Rows are created before upload and confirmed after.
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES profiles(id),
  r2_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video', 'avatar', 'reel_poster')),
  content_type TEXT NOT NULL,
  byte_size INTEGER,
  width INTEGER,
  height INTEGER,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms <= 60000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'deleted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS media_owner_idx ON media(owner_id, created_at DESC);

-- Feed post photos (Feed never contains video).
CREATE TABLE IF NOT EXISTS post_images (
  post_id TEXT NOT NULL REFERENCES posts(id),
  media_id TEXT NOT NULL REFERENCES media(id),
  position INTEGER NOT NULL,
  PRIMARY KEY (post_id, position)
);

-- One optional hashtag home per post.
CREATE TABLE IF NOT EXISTS hashtags (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT REFERENCES profiles(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE posts ADD COLUMN hashtag_slug TEXT REFERENCES hashtags(slug);
CREATE INDEX IF NOT EXISTS posts_hashtag_idx ON posts(hashtag_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_feed_idx ON posts(deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_rush_idx ON posts(is_rush_hour, rush_hour_ends_at);
CREATE INDEX IF NOT EXISTS posts_author_idx ON posts(author_id, created_at DESC);

-- Optional vote on a Feed post: 2+ choices, one vote per user.
CREATE TABLE IF NOT EXISTS vote_choices (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id),
  label TEXT NOT NULL,
  position INTEGER NOT NULL,
  UNIQUE (post_id, position)
);
CREATE TABLE IF NOT EXISTS votes (
  post_id TEXT NOT NULL REFERENCES posts(id),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  choice_id TEXT NOT NULL REFERENCES vote_choices(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS votes_choice_idx ON votes(choice_id);

-- Reels: vertical videos up to 60s, Likes only.
CREATE TABLE IF NOT EXISTS reels (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id),
  video_media_id TEXT NOT NULL REFERENCES media(id),
  poster_media_id TEXT REFERENCES media(id),
  caption TEXT NOT NULL DEFAULT '',
  duration_ms INTEGER NOT NULL CHECK (duration_ms > 0 AND duration_ms <= 60000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS reels_feed_idx ON reels(deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS reels_author_idx ON reels(author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reel_likes (
  reel_id TEXT NOT NULL REFERENCES reels(id),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (reel_id, user_id)
);

-- Idempotency log for Clerk webhooks (user.created / updated / deleted).
CREATE TABLE IF NOT EXISTS clerk_webhook_events (
  svix_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
