-- LeBeHo part 3: admin moderation. Run once against DB after 0001 and 0002.
ALTER TABLE profiles ADD COLUMN is_restricted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN restricted_at TEXT;

-- Existing reels stay live; new uploads start as 'pending' (set by the app).
ALTER TABLE reels ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE reels ADD COLUMN reviewed_at TEXT;
CREATE INDEX IF NOT EXISTS reels_status_idx ON reels(status, created_at DESC);

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
