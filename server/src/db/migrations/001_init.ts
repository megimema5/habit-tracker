/**
 * Migration 001 — initial schema.
 *
 * Migrations are TypeScript modules that export their SQL as a string, so the
 * production build (tsc → dist/) includes them automatically — no copy step needed.
 *
 * Relationships:  users 1 ──── * habits 1 ──── * habit_logs
 * Deleting a user deletes their habits; deleting a habit deletes its logs (ON DELETE CASCADE).
 */
export const up = /* sql */ `
  CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,          -- always stored lowercase
    password_hash TEXT    NOT NULL,                 -- bcrypt hash, never the plain password
    created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE habits (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          TEXT    NOT NULL,
    icon          TEXT    NOT NULL DEFAULT '✅',
    color         TEXT    NOT NULL DEFAULT '#4f46e5',
    category      TEXT,
    schedule_type TEXT    NOT NULL DEFAULT 'daily'
                  CHECK (schedule_type IN ('daily', 'weekly', 'specific_days')),
    schedule_days TEXT,                             -- CSV of weekdays 0-6 (0 = Sunday), e.g. '1,3,5'
    target_count  INTEGER NOT NULL DEFAULT 1,       -- reserved for measurable targets
    reminder_time TEXT,                             -- 'HH:MM', optional
    created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE habit_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id   INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date       TEXT    NOT NULL,                    -- local date 'YYYY-MM-DD' chosen by the client
    status     TEXT    NOT NULL CHECK (status IN ('done', 'skipped')),
    value      INTEGER NOT NULL DEFAULT 1,          -- reserved for measurable targets
    created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (habit_id, date)                         -- one log per habit per day
  );

  CREATE INDEX idx_habits_user      ON habits (user_id);
  CREATE INDEX idx_logs_habit_date  ON habit_logs (habit_id, date);
`;
