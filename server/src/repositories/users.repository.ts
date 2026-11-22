import type { User } from '@habit/shared';
import { db } from '../db/connection.js';

/**
 * Users repository — the ONLY place that runs SQL against the `users` table.
 *
 * Rules:
 * - Prepared statements with `?` placeholders only (never string concatenation) → no SQL injection.
 * - Rows are converted from snake_case to the camelCase `User` type here.
 * - `password_hash` never leaves this file except through `findByEmailWithPassword`,
 *   which only the auth service uses to check a login.
 */

/** A row exactly as it is stored in SQLite. */
interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

/** Public user + the hash, for checking a password at login. */
export interface UserWithPassword {
  user: User;
  passwordHash: string;
}

function toUser(row: UserRow): User {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}

// Prepared once, reused for every request.
const statements = {
  findById: db.prepare('SELECT * FROM users WHERE id = ?'),
  findByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  insert: db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING *'),
};

export const usersRepository = {
  findById(id: number): User | undefined {
    const row = statements.findById.get(id) as UserRow | undefined;
    return row ? toUser(row) : undefined;
  },

  emailExists(email: string): boolean {
    return statements.findByEmail.get(email) !== undefined;
  },

  findByEmailWithPassword(email: string): UserWithPassword | undefined {
    const row = statements.findByEmail.get(email) as UserRow | undefined;
    return row ? { user: toUser(row), passwordHash: row.password_hash } : undefined;
  },

  create(input: { name: string; email: string; passwordHash: string }): User {
    const row = statements.insert.get(input.name, input.email, input.passwordHash) as
      UserRow | undefined;
    if (!row) throw new Error('Failed to create user');
    return toUser(row);
  },
};
