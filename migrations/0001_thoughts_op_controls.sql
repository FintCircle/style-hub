-- LeBeHo D1 schema: identities are internal profiles mapped to Clerk users.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  profile_image_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_rush_hour INTEGER NOT NULL DEFAULT 0 CHECK (is_rush_hour IN (0, 1)),
  rush_hour_ends_at TEXT,
  thoughts_closed INTEGER NOT NULL DEFAULT 0 CHECK (thoughts_closed IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

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

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id TEXT NOT NULL REFERENCES profiles(id),
  blocked_id TEXT NOT NULL REFERENCES profiles(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

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
