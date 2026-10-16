CREATE TABLE IF NOT EXISTS line_knowledge (
  id TEXT PRIMARY KEY,
  service TEXT NOT NULL CHECK (service IN ('campsite', 'campervan', 'shared')),
  question TEXT NOT NULL,
  keywords TEXT NOT NULL,
  answer TEXT NOT NULL,
  url TEXT NOT NULL,
  source_file TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_line_knowledge_service_enabled
  ON line_knowledge(service, enabled);

CREATE TABLE IF NOT EXISTS line_knowledge_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
