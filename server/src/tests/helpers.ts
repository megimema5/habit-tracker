import request from 'supertest';
import type { RegisterInput, User } from '@habit/shared';
import { createApp } from '../app.js';
import { db } from '../db/connection.js';

/**
 * Shared test helpers. Every test file gets its own in-memory database
 * (DB_PATH=:memory: in vitest.config.ts), and resetDb() empties it between tests.
 */
export const app = createApp();

export function resetDb(): void {
  // Deleting users cascades to habits and habit_logs.
  db.exec('DELETE FROM users');
}

let counter = 0;

export function makeUser(overrides: Partial<RegisterInput> = {}): RegisterInput {
  counter += 1;
  return {
    name: 'Test User',
    email: `user${counter}@example.com`,
    password: 'password123',
    ...overrides,
  };
}

/** Registers a user and returns a Supertest agent that keeps the login cookie. */
export async function registerAndLogin(
  overrides: Partial<RegisterInput> = {},
): Promise<{ agent: ReturnType<typeof request.agent>; user: User; input: RegisterInput }> {
  const input = makeUser(overrides);
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send(input).expect(201);
  return { agent, user: (res.body as { data: User }).data, input };
}

/** Reads the login cookie from a response's Set-Cookie header. */
export function getAuthCookie(res: request.Response): string | undefined {
  const header = res.headers['set-cookie'] as string[] | string | undefined;
  const cookies = Array.isArray(header) ? header : header ? [header] : [];
  return cookies.find((c) => c.startsWith('habit_token='));
}
