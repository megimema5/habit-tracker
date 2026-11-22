import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { ApiError } from '@habit/shared';
import type * as EnvModule from '../config/env.js';

// Pretend we run in production for this file only.
vi.mock('../config/env.js', async (importOriginal) => {
  const actual = await importOriginal<typeof EnvModule>();
  return { ...actual, isProduction: true };
});

const { errorHandler } = await import('../middleware/errorHandler.js');
const { HttpError } = await import('../utils/HttpError.js');

function appThatThrows(error: unknown) {
  const app = express();
  app.get('/boom', () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
}

describe('error handler in production', () => {
  it('hides the details of unexpected errors', async () => {
    const res = await request(appThatThrows(new Error('SQLITE_ERROR: no such table users'))).get(
      '/boom',
    );

    expect(res.status).toBe(500);
    expect((res.body as ApiError).error.message).toBe('Something went wrong');
    expect(JSON.stringify(res.body)).not.toContain('SQLITE');
  });

  it('still shows messages of expected errors (HttpError)', async () => {
    const res = await request(appThatThrows(HttpError.notFound('Habit not found'))).get('/boom');

    expect(res.status).toBe(404);
    expect((res.body as ApiError).error.message).toBe('Habit not found');
  });
});
