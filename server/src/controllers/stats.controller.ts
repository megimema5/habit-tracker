import type { RequestHandler } from 'express';
import type { ApiSuccess, StatsOverview, StatsQuery } from '@habit/shared';
import { getAuthUser } from '../middleware/requireAuth.js';
import { habitsRepository } from '../repositories/habits.repository.js';
import { logsRepository } from '../repositories/logs.repository.js';
import { computeStats } from '../services/stats.service.js';
import { toLogMap, type LogMap } from '../services/streaks.service.js';
import { addDays, serverToday } from '../utils/dates.js';

/** GET /api/stats?today=…&days=30 — completion, trend, per-habit and weekday stats. */
export const overview: RequestHandler = (req, res) => {
  const userId = getAuthUser(req).id;
  const { today: clientToday, days } = req.query as unknown as StatsQuery;
  const today = clientToday ?? serverToday();

  // Two queries for everything: the user's habits and all of their logs.
  const habits = habitsRepository.findAllByUser(userId);
  const grouped = new Map<number, { date: string; status: 'done' | 'skipped' }[]>();
  for (const { habitId, date, status } of logsRepository.findAllForUser(userId)) {
    grouped.set(habitId, [...(grouped.get(habitId) ?? []), { date, status }]);
  }
  const logsByHabit = new Map<number, LogMap>(
    [...grouped].map(([habitId, logs]) => [habitId, toLogMap(logs)]),
  );

  const stats = computeStats(habits, logsByHabit, {
    from: addDays(today, -(days - 1)),
    to: today,
    today,
  });
  res.json({ data: stats } satisfies ApiSuccess<StatsOverview>);
};
