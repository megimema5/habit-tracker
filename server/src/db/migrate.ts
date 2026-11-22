import type { DatabaseSync } from 'node:sqlite';
import { logger } from '../utils/logger.js';
import { migrations, type Migration } from './migrations/index.js';

/** Reads SQLite's `user_version` header value. */
export function getSchemaVersion(db: DatabaseSync): number {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number } | undefined;
  return row?.user_version ?? 0;
}

/**
 * Brings the database schema up to date.
 *
 * SQLite stores a free integer in the file header called `user_version`.
 * We use it as "the last migration that ran". On startup we run every migration
 * with a higher version, each inside a transaction, so a failing migration
 * leaves the database untouched.
 *
 * Returns the migrations that were applied (empty if already up to date).
 */
export function runMigrations(db: DatabaseSync, list: Migration[] = migrations): Migration[] {
  const current = getSchemaVersion(db);
  const pending = list.filter((m) => m.version > current);

  for (const migration of pending) {
    db.exec('BEGIN');
    try {
      db.exec(migration.up);
      // PRAGMA can't use ? parameters; version is a number from our own code, not user input.
      db.exec(`PRAGMA user_version = ${Number(migration.version)}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    logger.info(`Applied migration ${migration.name}`);
  }

  return pending;
}
