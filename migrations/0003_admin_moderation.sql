-- LeBeHo admin & moderation. Run once, after 0001 and 0002.
ALTER TABLE profiles ADD COLUMN is_restricted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN restricted_at TEXT;

-- Reels go to admin review first. Existing reels stay live.
ALTER TABLE reels ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
UPDATE reels SET status = 'approved';
CREATE INDEX IF NOT EXISTS reels_status_idx ON reels(status, created_at DESC);

-- Reports on posts, reels and profiles.
CREATE TABLE IF NOT EXISTS content_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES profiles(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'reel', 'profile')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS content_reports_status_idx ON content_reports(status, created_at DESC);
