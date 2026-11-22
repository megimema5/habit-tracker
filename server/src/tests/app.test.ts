import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { ApiError, ApiSuccess, HealthStatus } from '@habit/shared';
import { createApp } from '../app.js';

const app = createApp();

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');

    const body = res.body as ApiSuccess<HealthStatus>;

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('ok');
    expect(body.data.database).toBe('ok');
    expect(typeof body.data.uptime).toBe('number');
    expect(typeof body.data.timestamp).toBe('string');
  });
});

describe('error handling', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { message: 'Route not found: GET /api/does-not-exist' },
    });
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken": ');

    expect(res.status).toBe(400);
    expect((res.body as ApiError).error.message).toBe('Invalid JSON body');
  });

  it('returns 413 when the body is larger than 10kb', async () => {
    const res = await request(app)
      .post('/api/health')
      .send({ big: 'x'.repeat(11 * 1024) });

    expect(res.status).toBe(413);
    expect((res.body as ApiError).error.message).toBe('Request body is too large');
  });
});

describe('security headers', () => {
  it('sets helmet headers and hides X-Powered-By', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('tells browsers and proxies never to cache API responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['cache-control']).toBe('no-store');
  });
});
