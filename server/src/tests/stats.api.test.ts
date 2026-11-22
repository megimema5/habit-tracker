import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Habit, StatsOverview } from '@habit/shared';
import { addDays, serverToday } from '../utils/dates.js';
import { app, registerAndLogin, resetDb } from './helpers.js';

const dataOf = <T>(res: request.Response): T => (res.body as { data: T }).data;
const TODAY = serverToday();

beforeEach(resetDb);

describe('GET /api/stats', () => {
  it('requires a login', async () => {
    expect((await request(app).get('/api/stats')).status).toBe(401);
  });

  it('returns completion, trend and weekday stats for the logged-in user', async () => {
    const { agent } = await registerAndLogin();
    const habit = dataOf<Habit>(await agent.post('/api/habits').send({ name: 'Read' }));
    await agent.put(`/api/habits/${habit.id}/logs/${TODAY}`).send({ status: 'done' });
    await agent.put(`/api/habits/${habit.id}/logs/${addDays(TODAY, -1)}`).send({ status: 'done' });

    const res = await agent.get('/api/stats').query({ today: TODAY, days: 7 });
    const stats = dataOf<StatsOverview>(res);

    expect(res.status).toBe(200);
    expect(stats).toMatchObject({
      from: addDays(TODAY, -6),
      to: TODAY,
      days: 7,
      done: 2,
      target: 2,
      completionRate: 1,
      perfectDays: 2,
    });
    expect(stats.trend).toHaveLength(7);
    expect(stats.missedByWeekday).toHaveLength(7);
    expect(stats.perHabit).toEqual([
      expect.objectContaining({ habitId: habit.id, name: 'Read', done: 2, target: 2, rate: 1 }),
    ]);
  });

  it('only includes the user’s own habits', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    await alice.agent.post('/api/habits').send({ name: 'Alice habit' });

    const stats = dataOf<StatsOverview>(await bob.agent.get('/api/stats'));
    expect(stats.perHabit).toEqual([]);
    expect(stats.completionRate).toBeNull();
  });

  it.each([
    ['days below 1', { days: 0 }],
    ['days above 366', { days: 400 }],
    ['an invalid today', { today: '2026-13-01' }],
    ['an unknown parameter', { period: 'month' }],
  ])('returns 400 for %s', async (_label, query) => {
    const { agent } = await registerAndLogin();
    expect((await agent.get('/api/stats').query(query)).status).toBe(400);
  });
});
