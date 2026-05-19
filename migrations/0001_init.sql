CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS day_sessions (
  client_id TEXT NOT NULL,
  date_key TEXT NOT NULL,
  assigned_ids TEXT NOT NULL,
  completed_ids TEXT NOT NULL,
  PRIMARY KEY (client_id, date_key),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS drafts (
  client_id TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('daily', 'library')),
  bucket_key TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  field_id TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (client_id, scope, bucket_key, exercise_id, field_id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_drafts_client_bucket ON drafts (client_id, scope, bucket_key);
