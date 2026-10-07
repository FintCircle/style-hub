-- Add vote lifecycle columns to posts
ALTER TABLE posts ADD COLUMN is_vote_closed INTEGER NOT NULL DEFAULT 0 CHECK (is_vote_closed IN (0, 1));
ALTER TABLE posts ADD COLUMN vote_ends_at TEXT;
