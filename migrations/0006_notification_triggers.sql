-- Migration 0006: Update notifications table check constraint for notification triggers
CREATE TABLE IF NOT EXISTS notifications_new (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES profiles(id),
  actor_id TEXT NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('thought', 'thought_reply', 'boost', 'reel_like', 'poll_ended', 'rush_ending', 'content_report')),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'reel')),
  target_id TEXT NOT NULL,
  thought_id TEXT REFERENCES thoughts(id),
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notifications_new SELECT * FROM notifications;
DROP TABLE notifications;
ALTER TABLE notifications_new RENAME TO notifications;

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON notifications(recipient_id, is_read, created_at DESC);
