import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { ApiError } from '@habit/shared';
import { createRateLimiter } from '../middleware/rateLimit.js';

/**
 * The real auth limiter is raised during tests (many requests come from one "IP"),
 * so the limiter is tested here on a tiny app with a limit of 3.
 */
describe('rate limiter', () => {
  it('blocks requests over the limit with a 429 in the normal error format', async () => {
    const app = express();
    app.post(
      '/login',
      createRateLimiter({ limit: 3, message: 'Too many attempts' }),
      (_req, res) => {
        res.status(401).json({ error: { message: 'Invalid email or password' } });
      },
    );

    for (let i = 0; i < 3; i++) {
      await request(app).post('/login').expect(401);
    }

    const blocked = await request(app).post('/login');
    expect(blocked.status).toBe(429);
    expect((blocked.body as ApiError).error.message).toBe('Too many attempts');
    expect(blocked.headers['ratelimit-policy']).toBeDefined();
  });
});
