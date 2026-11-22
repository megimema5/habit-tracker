import { beforeEach, describe, expect, it } from 'vitest';
import { db, openDatabase } from '../db/connection.js';
import { getSchemaVersion, runMigrations } from '../db/migrate.js';
import { DEMO_USER, seed } from '../db/seed.js';
import { resetDb } from './helpers.js';

function insertUser(email = 'a@example.com'): number {
  const row = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES ('A', ?, 'hash') RETURNING id")
    .get(email) as { id: number };
  return row.id;
}

function insertHabit(userId: number): number {
  const row = db
    .prepare("INSERT INTO habits (user_id, name) VALUES (?, 'Habit') RETURNING id")
    .get(userId) as { id: number };
  return row.id;
}

const count = (table: string): number =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

beforeEach(resetDb);

describe('migrations', () => {
  it('creates the three tables and sets user_version', () => {
    const tables = (
      db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
        .all() as { name: string }[]
    ).map((t) => t.name);

    expect(tables).toEqual(expect.arrayContaining(['users', 'habits', 'habit_logs']));
    expect(getSchemaVersion(db)).toBe(1);
  });

  it('does nothing when the schema is already up to date', () => {
    expect(runMigrations(db)).toEqual([]);
  });

  it('migrates a fresh database from scratch', () => {
    const fresh = openDatabase(':memory:');
    expect(runMigrations(fresh).map((m) => m.name)).toEqual(['001_init']);
    fresh.close();
  });
});

describe('constraints', () => {
  it('has foreign keys turned on', () => {
    expect(db.prepare('PRAGMA foreign_keys').get()).toEqual({ foreign_keys: 1 });
  });

  it('rejects duplicate emails', () => {
    insertUser('same@example.com');
    expect(() => insertUser('same@example.com')).toThrow(/UNIQUE/);
  });

  it('rejects a habit for a user that does not exist', () => {
    expect(() => insertHabit(9999)).toThrow(/FOREIGN KEY/);
  });

  it('allows only one log per habit per day', () => {
    const habitId = insertHabit(insertUser());
    const insert = db.prepare(
      "INSERT INTO habit_logs (habit_id, date, status) VALUES (?, ?, 'done')",
    );
    insert.run(habitId, '2026-11-21');
    expect(() => insert.run(habitId, '2026-11-21')).toThrow(/UNIQUE/);
  });

  it('rejects unknown log statuses and schedule types', () => {
    const userId = insertUser();
    const habitId = insertHabit(userId);
    expect(() =>
      db
        .prepare(
          "INSERT INTO habit_logs (habit_id, date, status) VALUES (?, '2026-11-21', 'maybe')",
        )
        .run(habitId),
    ).toThrow(/CHECK/);
    expect(() =>
      db
        .prepare("INSERT INTO habits (user_id, name, schedule_type) VALUES (?, 'X', 'monthly')")
        .run(userId),
    ).toThrow(/CHECK/);
  });

  it('deleting a user deletes their habits and logs (cascade)', () => {
    const userId = insertUser();
    const habitId = insertHabit(userId);
    db.prepare(
      "INSERT INTO habit_logs (habit_id, date, status) VALUES (?, '2026-11-21', 'done')",
    ).run(habitId);

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    expect(count('habits')).toBe(0);
    expect(count('habit_logs')).toBe(0);
  });
});

describe('seed', () => {
  it('creates the demo user with habits and logs, and can run twice', async () => {
    await seed();
    await seed();

    const users = db.prepare('SELECT email, password_hash FROM users').all() as {
      email: string;
      password_hash: string;
    }[];
    expect(users).toHaveLength(1);
    expect(users[0]?.email).toBe(DEMO_USER.email);
    expect(users[0]?.password_hash).not.toBe(DEMO_USER.password);
    expect(count('habits')).toBe(5);
    expect(count('habit_logs')).toBeGreaterThan(50);
  });
});
