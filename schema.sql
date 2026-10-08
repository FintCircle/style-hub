-- LeBeHo Full Cloudflare D1 Database Schema
-- Includes all core entities, content tables, media, voting, Reels, and admin moderation controls.
PRAGMA foreign_keys = ON;

-- --------------------------------------------------
-- 1. PROFILES & USER IDENTITIES
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  email TEXT,
  website TEXT,
  instagram TEXT,
  tiktok TEXT,
  x_handle TEXT,
  profile_image_url TEXT,
  is_restricted INTEGER NOT NULL DEFAULT 0,
  restricted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

-- --------------------------------------------------
-- 2. MEDIA (R2 STORAGE BINDINGS)
-- --------------------------------------------------
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

-- --------------------------------------------------
-- 3. HASHTAGS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS hashtags (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT REFERENCES profiles(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------
-- 4. FEED POSTS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_rush_hour INTEGER NOT NULL DEFAULT 0 CHECK (is_rush_hour IN (0, 1)),
  rush_hour_ends_at TEXT,
  thoughts_closed INTEGER NOT NULL DEFAULT 0 CHECK (thoughts_closed IN (0, 1)),
  is_vote_closed INTEGER NOT NULL DEFAULT 0 CHECK (is_vote_closed IN (0, 1)),
  vote_ends_at TEXT,
  hashtag_slug TEXT REFERENCES hashtags(slug),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS posts_hashtag_idx ON posts(hashtag_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_feed_idx ON posts(deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_rush_idx ON posts(is_rush_hour, rush_hour_ends_at);
CREATE INDEX IF NOT EXISTS posts_author_idx ON posts(author_id, created_at DESC);

-- --------------------------------------------------
-- 5. POST IMAGES
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS post_images (
  post_id TEXT NOT NULL REFERENCES posts(id),
  media_id TEXT NOT NULL REFERENCES media(id),
  position INTEGER NOT NULL,
  PRIMARY KEY (post_id, position)
);

-- --------------------------------------------------
-- 6. VOTES & CHOICES
-- --------------------------------------------------
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

-- --------------------------------------------------
-- 7. THOUGHTS & DISCUSSIONS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS thoughts (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id),
  author_id TEXT NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_hidden INTEGER NOT NULL DEFAULT 0 CHECK (is_hidden IN (0, 1)),
  hidden_by TEXT REFERENCES profiles(id),
  hidden_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  CHECK ((is_hidden = 0 AND hidden_by IS NULL AND hidden_at IS NULL) OR is_hidden = 1)
);
CREATE INDEX IF NOT EXISTS thoughts_post_visible_idx ON thoughts(post_id, is_hidden, created_at DESC);

CREATE TABLE IF NOT EXISTS thought_replies (
  id TEXT PRIMARY KEY,
  thought_id TEXT NOT NULL REFERENCES thoughts(id),
  author_id TEXT NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS thought_replies_thought_idx ON thought_replies(thought_id, created_at);

CREATE TABLE IF NOT EXISTS thought_boosts (
  thought_id TEXT NOT NULL REFERENCES thoughts(id),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (thought_id, user_id)
);

-- --------------------------------------------------
-- 8. REELS (SHORT VERTICAL VIDEOS)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS reels (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id),
  video_media_id TEXT NOT NULL REFERENCES media(id),
  poster_media_id TEXT REFERENCES media(id),
  caption TEXT NOT NULL DEFAULT '',
  duration_ms INTEGER NOT NULL CHECK (duration_ms > 0 AND duration_ms <= 60000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS reels_feed_idx ON reels(deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS reels_author_idx ON reels(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reels_status_idx ON reels(status, created_at DESC);

CREATE TABLE IF NOT EXISTS reel_likes (
  reel_id TEXT NOT NULL REFERENCES reels(id),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (reel_id, user_id)
);

-- --------------------------------------------------
-- 9. USER BLOCKING
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id TEXT NOT NULL REFERENCES profiles(id),
  blocked_id TEXT NOT NULL REFERENCES profiles(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- --------------------------------------------------
-- 10. MODERATION & REPORTS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS content_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES profiles(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'reel', 'profile')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed', 'actioned')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS content_reports_status_idx ON content_reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS thought_reports (
  id TEXT PRIMARY KEY,
  thought_id TEXT NOT NULL REFERENCES thoughts(id),
  reporter_id TEXT NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_thought_report_per_user
  ON thought_reports(thought_id, reporter_id)
  WHERE status = 'pending';

-- --------------------------------------------------
-- 11. NOTIFICATIONS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES profiles(id),
  actor_id TEXT NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('thought', 'thought_reply', 'boost', 'reel_like')),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'reel')),
  target_id TEXT NOT NULL,
  thought_id TEXT REFERENCES thoughts(id),
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON notifications(recipient_id, is_read, created_at DESC);

-- --------------------------------------------------
-- 12. CLERK WEBHOOK EVENTS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS clerk_webhook_events (
  svix_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------
-- 13. TRIGGERS
-- --------------------------------------------------
CREATE TRIGGER IF NOT EXISTS thought_reply_requires_participant
BEFORE INSERT ON thought_replies
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM thoughts t
  JOIN posts p ON p.id = t.post_id
  WHERE t.id = NEW.thought_id
    AND NEW.author_id IN (t.author_id, p.author_id)
)
BEGIN
  SELECT RAISE(ABORT, 'only the post author or Thought author may reply');
END;
