import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.js';
import { runMigrations } from './migrate.js';

/**
 * We use Node's built-in SQLite module (`node:sqlite`, Node 22.13+), so there is
 * no native package to compile — `npm install` works on any machine without
 * Python or C++ build tools.
 */
export type Database = DatabaseSync;

/**
 * Opens a SQLite database and applies the settings this app relies on.
 * `:memory:` gives a throwaway in-memory database (used by the tests).
 */
export function openDatabase(filename: string): Database {
  if (filename !== ':memory:') {
    // Make sure the folder (e.g. server/data) exists before SQLite creates the file.
    fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  }

  const database = new DatabaseSync(filename);

  // SQLite does NOT enforce foreign keys (or ON DELETE CASCADE) unless this is on.
  database.exec('PRAGMA foreign_keys = ON');
  // Write-ahead logging: readers don't block the writer — faster and safer for a web server.
  database.exec('PRAGMA journal_mode = WAL');

  return database;
}

/**
 * Runs `fn` inside a transaction: if it throws, every change is rolled back,
 * so the database is never left half-updated.
 */
export function transaction<T>(database: Database, fn: () => T): T {
  database.exec('BEGIN');
  try {
    const result = fn();
    database.exec('COMMIT');
    return result;
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

/**
 * The app's single database connection, opened and migrated once when this
 * module is first imported. node:sqlite is synchronous, so one shared
 * connection is the simplest correct setup.
 */
export const db: Database = openDatabase(env.DB_PATH);
runMigrations(db);

export function closeDatabase(): void {
  if (db.isOpen) db.close();
}
