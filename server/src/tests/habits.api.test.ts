import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiError, Habit, HabitLog, HabitWithStats } from '@habit/shared';
import { db } from '../db/connection.js';
import { addDays, serverToday } from '../utils/dates.js';
import { app, registerAndLogin, resetDb } from './helpers.js';

type Agent = Awaited<ReturnType<typeof registerAndLogin>>['agent'];

const dataOf = <T>(res: request.Response): T => (res.body as { data: T }).data;
const errorOf = (res: request.Response) => (res.body as ApiError).error;

const TODAY = serverToday();

async function createHabit(agent: Agent, body: Record<string, unknown> = {}): Promise<Habit> {
  const res = await agent
    .post('/api/habits')
    .send({ name: 'Drink water', ...body })
    .expect(201);
  return dataOf<Habit>(res);
}

beforeEach(resetDb);

describe('authentication', () => {
  it.each([
    ['get', '/api/habits'],
    ['post', '/api/habits'],
    ['get', '/api/habits/1'],
    ['patch', '/api/habits/1'],
    ['delete', '/api/habits/1'],
    ['put', '/api/habits/1/logs/2026-11-21'],
    ['delete', '/api/habits/1/logs/2026-11-21'],
  ] as const)('%s %s returns 401 without a login cookie', async (method, url) => {
    const res = await request(app)[method](url).send({});
    expect(res.status).toBe(401);
  });
});

describe('POST /api/habits', () => {
  it('creates a habit with defaults', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent, { name: '  Read  ' });

    expect(habit).toMatchObject({
      name: 'Read',
      icon: '✅',
      color: '#4f46e5',
      category: null,
      scheduleType: 'daily',
      scheduleDays: [],
      reminderTime: null,
    });
    expect(typeof habit.id).toBe('number');
  });

  it('creates a specific-days habit with sorted days', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent, {
      name: 'Run',
      icon: '🏃',
      color: '#10b981',
      category: 'Fitness',
      scheduleType: 'specific_days',
      scheduleDays: [5, 1, 3],
      reminderTime: '07:30',
    });

    expect(habit).toMatchObject({
      scheduleType: 'specific_days',
      scheduleDays: [1, 3, 5],
      category: 'Fitness',
      reminderTime: '07:30',
    });
  });

  it('ignores schedule days for daily habits', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent, { scheduleType: 'daily', scheduleDays: [1, 2] });
    expect(habit.scheduleDays).toEqual([]);
  });

  it.each([
    ['missing name', {}],
    ['empty name', { name: '   ' }],
    ['name too long', { name: 'x'.repeat(61) }],
    ['bad color', { name: 'X', color: 'red' }],
    ['unknown schedule', { name: 'X', scheduleType: 'monthly' }],
    ['specific days without days', { name: 'X', scheduleType: 'specific_days' }],
    ['weekday out of range', { name: 'X', scheduleType: 'specific_days', scheduleDays: [7] }],
    ['repeated weekday', { name: 'X', scheduleType: 'specific_days', scheduleDays: [1, 1] }],
    ['bad reminder time', { name: 'X', reminderTime: '25:00' }],
    ['unknown field (mass assignment)', { name: 'X', userId: 999 }],
  ])('returns 400 for %s', async (_label, body) => {
    const { agent } = await registerAndLogin();
    const res = await agent.post('/api/habits').send(body);
    expect(res.status).toBe(400);
    expect(errorOf(res).message).toBe('Validation failed');
  });
});

describe('GET /api/habits', () => {
  it('returns only the logged-in user’s habits, with stats', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    await createHabit(alice.agent, { name: 'Alice habit' });
    await createHabit(bob.agent, { name: 'Bob habit' });

    const res = await alice.agent.get('/api/habits').query({ today: TODAY });
    const habits = dataOf<HabitWithStats[]>(res);

    expect(res.status).toBe(200);
    expect(habits.map((h) => h.name)).toEqual(['Alice habit']);
    expect(habits[0]).toMatchObject({
      logs: [],
      isScheduledToday: true,
      todayStatus: null,
      currentStreak: 0,
      longestStreak: 0,
      weekProgress: null,
    });
  });

  it('calculates streaks from logs and limits logs to the requested range', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent);
    for (let daysAgo = 0; daysAgo < 10; daysAgo++) {
      await agent
        .put(`/api/habits/${habit.id}/logs/${addDays(TODAY, -daysAgo)}`)
        .send({ status: 'done' })
        .expect(200);
    }

    const res = await agent.get('/api/habits').query({ today: TODAY, days: 7 });
    const [stats] = dataOf<HabitWithStats[]>(res);

    expect(stats?.currentStreak).toBe(10);
    expect(stats?.longestStreak).toBe(10);
    expect(stats?.todayStatus).toBe('done');
    expect(stats?.logs).toHaveLength(7);
  });

  it('gives weekly progress instead of streaks for non-daily habits', async () => {
    const { agent } = await registerAndLogin();
    await createHabit(agent, { scheduleType: 'weekly' });

    const res = await agent.get('/api/habits').query({ today: TODAY });
    const [stats] = dataOf<HabitWithStats[]>(res);

    expect(stats?.currentStreak).toBeNull();
    expect(stats?.longestStreak).toBeNull();
    expect(stats?.weekProgress).toEqual({ done: 0, target: 1 });
  });

  it.each([
    ['an invalid today', { today: '2026-02-30' }],
    ['too many days', { days: 400 }],
    ['an unknown query parameter', { sort: 'name' }],
  ])('returns 400 for %s', async (_label, query) => {
    const { agent } = await registerAndLogin();
    const res = await agent.get('/api/habits').query(query);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/habits/:id', () => {
  it('returns one habit with logs in the requested range', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent);
    await agent.put(`/api/habits/${habit.id}/logs/${TODAY}`).send({ status: 'done' });
    await agent.put(`/api/habits/${habit.id}/logs/${addDays(TODAY, -40)}`).send({ status: 'done' });

    const res = await agent.get(`/api/habits/${habit.id}`).query({ today: TODAY });
    const stats = dataOf<HabitWithStats>(res);

    expect(res.status).toBe(200);
    expect(stats.logs).toEqual([{ date: TODAY, status: 'done' }]); // default range: 30 days
  });

  it('returns 404 for another user’s habit and for a missing one', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const habit = await createHabit(alice.agent);

    expect((await bob.agent.get(`/api/habits/${habit.id}`)).status).toBe(404);
    expect((await alice.agent.get('/api/habits/99999')).status).toBe(404);
  });

  it('returns 400 for a non-numeric id', async () => {
    const { agent } = await registerAndLogin();
    expect((await agent.get('/api/habits/abc')).status).toBe(400);
  });

  it('returns 400 when "from" is after "to"', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent);
    const res = await agent
      .get(`/api/habits/${habit.id}`)
      .query({ from: '2026-11-20', to: '2026-11-01' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/habits/:id', () => {
  it('updates only the fields sent', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent, { name: 'Old', color: '#10b981' });

    const res = await agent.patch(`/api/habits/${habit.id}`).send({ name: 'New' });
    const updated = dataOf<Habit>(res);

    expect(res.status).toBe(200);
    expect(updated.name).toBe('New');
    expect(updated.color).toBe('#10b981');
  });

  it('switching to specific days requires days', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent);

    const missing = await agent
      .patch(`/api/habits/${habit.id}`)
      .send({ scheduleType: 'specific_days' });
    expect(missing.status).toBe(400);

    const ok = await agent
      .patch(`/api/habits/${habit.id}`)
      .send({ scheduleType: 'specific_days', scheduleDays: [2, 4] });
    expect(dataOf<Habit>(ok).scheduleDays).toEqual([2, 4]);
  });

  it('switching back to daily clears the days', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent, { scheduleType: 'specific_days', scheduleDays: [1] });

    const res = await agent.patch(`/api/habits/${habit.id}`).send({ scheduleType: 'daily' });
    expect(dataOf<Habit>(res).scheduleDays).toEqual([]);
  });

  it('can clear the category and reminder', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent, { category: 'Health', reminderTime: '08:00' });

    const res = await agent
      .patch(`/api/habits/${habit.id}`)
      .send({ category: null, reminderTime: null });
    expect(dataOf<Habit>(res)).toMatchObject({ category: null, reminderTime: null });
  });

  it('returns 400 for an empty body or unknown fields', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent);

    expect((await agent.patch(`/api/habits/${habit.id}`).send({})).status).toBe(400);
    expect((await agent.patch(`/api/habits/${habit.id}`).send({ id: 5 })).status).toBe(400);
  });

  it('returns 404 for another user’s habit and does not change it', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const habit = await createHabit(alice.agent, { name: 'Mine' });

    const res = await bob.agent.patch(`/api/habits/${habit.id}`).send({ name: 'Hacked' });
    expect(res.status).toBe(404);

    const check = await alice.agent.get(`/api/habits/${habit.id}`);
    expect(dataOf<Habit>(check).name).toBe('Mine');
  });
});

describe('DELETE /api/habits/:id', () => {
  it('deletes the habit and its logs', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent);
    await agent.put(`/api/habits/${habit.id}/logs/${TODAY}`).send({ status: 'done' });

    expect((await agent.delete(`/api/habits/${habit.id}`)).status).toBe(204);
    expect((await agent.get(`/api/habits/${habit.id}`)).status).toBe(404);

    const logs = db.prepare('SELECT COUNT(*) AS n FROM habit_logs').get() as { n: number };
    expect(logs.n).toBe(0);
  });

  it('returns 404 for another user’s habit and keeps it', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const habit = await createHabit(alice.agent);

    expect((await bob.agent.delete(`/api/habits/${habit.id}`)).status).toBe(404);
    expect((await alice.agent.get(`/api/habits/${habit.id}`)).status).toBe(200);
  });
});

describe('PUT /api/habits/:id/logs/:date', () => {
  it('marks a day done, then changes it to skipped', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent);
    const url = `/api/habits/${habit.id}/logs/${TODAY}`;

    const done = await agent.put(url).send({ status: 'done' });
    expect(done.status).toBe(200);
    expect(dataOf<HabitLog>(done)).toEqual({ date: TODAY, status: 'done' });

    const skipped = await agent.put(url).send({ status: 'skipped' });
    expect(dataOf<HabitLog>(skipped).status).toBe('skipped');
  });

  it('is idempotent: the same request twice leaves one log', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent);
    const url = `/api/habits/${habit.id}/logs/${TODAY}`;

    await agent.put(url).send({ status: 'done' }).expect(200);
    await agent.put(url).send({ status: 'done' }).expect(200);

    const logs = db.prepare('SELECT COUNT(*) AS n FROM habit_logs').get() as { n: number };
    expect(logs.n).toBe(1);
  });

  it.each([
    ['an invalid status', TODAY, { status: 'maybe' }],
    ['a missing status', TODAY, {}],
    ['an impossible date', '2026-02-30', { status: 'done' }],
    ['a badly formatted date', '21-11-2026', { status: 'done' }],
    ['a future date', addDays(TODAY, 5), { status: 'done' }],
  ])('returns 400 for %s', async (_label, date, body) => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent);
    const res = await agent.put(`/api/habits/${habit.id}/logs/${date}`).send(body);
    expect(res.status).toBe(400);
  });

  it('returns 404 when logging another user’s habit', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const habit = await createHabit(alice.agent);

    const res = await bob.agent
      .put(`/api/habits/${habit.id}/logs/${TODAY}`)
      .send({ status: 'done' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/habits/:id/logs/:date', () => {
  it('clears a log, and clearing again is still fine (idempotent)', async () => {
    const { agent } = await registerAndLogin();
    const habit = await createHabit(agent);
    const url = `/api/habits/${habit.id}/logs/${TODAY}`;
    await agent.put(url).send({ status: 'done' });

    expect((await agent.delete(url)).status).toBe(204);
    expect((await agent.delete(url)).status).toBe(204);

    const res = await agent.get('/api/habits').query({ today: TODAY });
    expect(dataOf<HabitWithStats[]>(res)[0]?.todayStatus).toBeNull();
  });

  it('returns 404 for another user’s habit', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const habit = await createHabit(alice.agent);

    expect((await bob.agent.delete(`/api/habits/${habit.id}/logs/${TODAY}`)).status).toBe(404);
  });
});
