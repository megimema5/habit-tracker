import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiError, User } from '@habit/shared';
import { env } from '../config/env.js';
import { signToken } from '../services/auth.service.js';
import { app, getAuthCookie, makeUser, registerAndLogin, resetDb } from './helpers.js';

const errorOf = (res: request.Response) => (res.body as ApiError).error;
const userOf = (res: request.Response) => (res.body as { data: User }).data;

beforeEach(resetDb);

describe('POST /api/auth/register', () => {
  it('creates the user, returns 201 and sets a secure login cookie', async () => {
    const input = makeUser({ name: '  Megi  ', email: '  Megi@Example.COM ' });
    const res = await request(app).post('/api/auth/register').send(input);

    expect(res.status).toBe(201);
    expect(userOf(res)).toMatchObject({ name: 'Megi', email: 'megi@example.com' });
    expect(typeof userOf(res).id).toBe('number');

    const cookie = getAuthCookie(res);
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('never returns the password or its hash', async () => {
    const res = await request(app).post('/api/auth/register').send(makeUser());
    expect(JSON.stringify(res.body).toLowerCase()).not.toContain('password');
  });

  it('returns 409 when the email is already used (case-insensitive)', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(makeUser({ email: 'taken@example.com' }));
    const res = await request(app)
      .post('/api/auth/register')
      .send(makeUser({ email: 'TAKEN@example.com' }));

    expect(res.status).toBe(409);
    expect(errorOf(res).message).toBe('Email already in use');
  });

  it('returns 400 with field errors for invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(errorOf(res).message).toBe('Validation failed');
    expect(errorOf(res).details).toMatchObject({
      fieldErrors: {
        name: expect.any(Array) as unknown,
        email: expect.any(Array) as unknown,
        password: expect.any(Array) as unknown,
      },
    });
  });

  it.each([
    ['no number', 'onlyletters'],
    ['no letter', '12345678'],
    ['too long for bcrypt', 'a1' + 'x'.repeat(71)],
  ])('rejects a weak password (%s)', async (_label, password) => {
    const res = await request(app).post('/api/auth/register').send(makeUser({ password }));
    expect(res.status).toBe(400);
  });

  it('rejects unknown fields (mass assignment)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...makeUser(), id: 1, role: 'admin' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password', async () => {
    const input = makeUser();
    await request(app).post('/api/auth/register').send(input);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: input.email.toUpperCase(), password: input.password });

    expect(res.status).toBe(200);
    expect(userOf(res).email).toBe(input.email);
    expect(getAuthCookie(res)).toBeDefined();
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const input = makeUser();
    await request(app).post('/api/auth/register').send(input);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: input.email, password: 'wrong-password1' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever1' });

    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(401);
      expect(errorOf(res).message).toBe('Invalid email or password');
      expect(getAuthCookie(res)).toBeUndefined();
    }
  });
});

describe('GET /api/auth/me', () => {
  it('returns the logged-in user', async () => {
    const { agent, user } = await registerAndLogin();
    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(userOf(res)).toEqual(user);
  });

  it('returns 401 without a cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a tampered token', async () => {
    const { user } = await registerAndLogin();
    const token = signToken(user.id);
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa');

    const res = await request(app).get('/api/auth/me').set('Cookie', `habit_token=${tampered}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with another secret', async () => {
    const { user } = await registerAndLogin();
    const forged = jwt.sign({}, 'some-other-secret-that-is-32-characters!!', {
      subject: String(user.id),
    });

    const res = await request(app).get('/api/auth/me').set('Cookie', `habit_token=${forged}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for an unsigned "alg: none" token', async () => {
    const { user } = await registerAndLogin();
    const unsigned = jwt.sign({ sub: String(user.id) }, '', { algorithm: 'none' });

    const res = await request(app).get('/api/auth/me').set('Cookie', `habit_token=${unsigned}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const { user } = await registerAndLogin();
    const expired = jwt.sign({ exp: Math.floor(Date.now() / 1000) - 60 }, env.JWT_SECRET, {
      subject: String(user.id),
    });

    const res = await request(app).get('/api/auth/me').set('Cookie', `habit_token=${expired}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 when the user no longer exists', async () => {
    const { agent } = await registerAndLogin();
    resetDb();

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie so /me returns 401 afterwards', async () => {
    const { agent } = await registerAndLogin();

    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(204);
    expect(getAuthCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });
});

describe('CSRF protection', () => {
  it('rejects non-JSON bodies on requests that change data', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('email=a@example.com&password=x');

    expect(res.status).toBe(415);
  });

  it('rejects requests from another origin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example.com')
      .send({ email: 'a@example.com', password: 'x' });

    expect(res.status).toBe(403);
  });

  it('allows requests from our own client origin', async () => {
    const input = makeUser();
    const res = await request(app)
      .post('/api/auth/register')
      .set('Origin', env.CLIENT_ORIGIN)
      .send(input);

    expect(res.status).toBe(201);
  });
});
