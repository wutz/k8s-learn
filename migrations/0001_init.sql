-- k8s-learn 学习进度 schema
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE lesson_state (
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','completed')),
  best_score INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_position INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX idx_lesson_state_user ON lesson_state(user_id, status);

CREATE TABLE progress_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('visit','complete','uncomplete','quiz_attempt')),
  payload TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_events_user ON progress_events(user_id, created_at);

CREATE TABLE resume_point (
  user_id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
