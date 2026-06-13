CREATE TABLE IF NOT EXISTS meditations (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  text TEXT NOT NULL,
  url TEXT,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS meditation_stacks (
  client_id TEXT PRIMARY KEY,
  deck TEXT NOT NULL DEFAULT '[]',
  pos INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS meditation_days (
  client_id TEXT NOT NULL,
  date_key TEXT NOT NULL,
  item_ids TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (client_id, date_key),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_meditations_client ON meditations (client_id);