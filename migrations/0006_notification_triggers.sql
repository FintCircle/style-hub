-- Notification triggers index update
CREATE INDEX IF NOT EXISTS notifications_type_target_idx
  ON notifications(recipient_id, type, target_id);
