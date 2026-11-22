import {
  LIMITS,
  timestampToLocalDate,
  type CreateHabitInput,
  type Habit,
  type HabitLog,
  type HabitWithStats,
  type LogStatus,
  type UpdateHabitInput,
} from '@habit/shared';
import { habitsRepository } from '../repositories/habits.repository.js';
import { logsRepository } from '../repositories/logs.repository.js';
import { addDays, isScheduledOn, serverToday } from '../utils/dates.js';
import { HttpError } from '../utils/HttpError.js';
import { currentStreak, longestStreak, toLogMap, weekProgress } from './streaks.service.js';

/**
 * Habits business logic. Controllers call these; these call the repositories.
 * `userId` always comes from the verified login cookie (req.user), never from the request body.
 */

const habitNotFound = (): HttpError => HttpError.notFound('Habit not found');

/** Loads a habit the user owns, or throws 404 (also for other users' habits). */
function getOwnedHabit(userId: number, habitId: number): Habit {
  const habit = habitsRepository.findByIdForUser(habitId, userId);
  if (!habit) throw habitNotFound();
  return habit;
}

/** Combines a habit with its logs into everything the UI needs. */
function buildHabitWithStats(
  habit: Habit,
  allLogs: HabitLog[],
  range: { from: string; to: string },
  today: string,
): HabitWithStats {
  const logMap = toLogMap(allLogs);
  const isDaily = habit.scheduleType === 'daily';

  return {
    ...habit,
    logs: allLogs.filter((log) => log.date >= range.from && log.date <= range.to),
    isScheduledToday: isScheduledOn(habit, today),
    todayStatus: logMap.get(today) ?? null,
    currentStreak: isDaily ? currentStreak(logMap, today) : null,
    longestStreak: isDaily ? longestStreak(logMap) : null,
    weekProgress: isDaily
      ? null
      : weekProgress(habit, logMap, today, timestampToLocalDate(habit.createdAt)),
  };
}

/** GET /habits — every habit of the user with stats and the logs of the last `days` days. */
export function listHabitsWithStats(
  userId: number,
  options: { today?: string | undefined; days: number },
): HabitWithStats[] {
  const today = options.today ?? serverToday();
  const range = { from: addDays(today, -(options.days - 1)), to: today };

  // Two queries in total (habits + all their logs), instead of one query per habit.
  const habits = habitsRepository.findAllByUser(userId);
  const logsByHabit = new Map<number, HabitLog[]>();
  for (const { habitId, date, status } of logsRepository.findAllForUser(userId)) {
    const list = logsByHabit.get(habitId) ?? [];
    list.push({ date, status });
    logsByHabit.set(habitId, list);
  }

  return habits.map((habit) =>
    buildHabitWithStats(habit, logsByHabit.get(habit.id) ?? [], range, today),
  );
}

/** GET /habits/:id — one habit with stats and logs in [from, to] (default: last 30 days). */
export function getHabitWithStats(
  userId: number,
  habitId: number,
  options: { today?: string | undefined; from?: string | undefined; to?: string | undefined },
): HabitWithStats {
  const habit = getOwnedHabit(userId, habitId);
  const today = options.today ?? serverToday();
  const to = options.to ?? today;
  const from = options.from ?? addDays(to, -29);

  if (addDays(from, LIMITS.MAX_RANGE_DAYS) <= to) {
    throw HttpError.badRequest(`The date range can be at most ${LIMITS.MAX_RANGE_DAYS} days`);
  }

  return buildHabitWithStats(habit, logsRepository.findAllForHabit(habit.id), { from, to }, today);
}

export function createHabit(userId: number, input: CreateHabitInput): Habit {
  return habitsRepository.create(userId, input);
}

/**
 * PATCH only sends the changed fields, so the schedule rule is checked on the
 * merged result: e.g. switching to 'specific_days' needs days (sent now or already stored).
 */
export function updateHabit(userId: number, habitId: number, changes: UpdateHabitInput): Habit {
  const current = getOwnedHabit(userId, habitId);

  const scheduleType = changes.scheduleType ?? current.scheduleType;
  let scheduleDays = changes.scheduleDays ?? current.scheduleDays;

  if (scheduleType === 'specific_days' && scheduleDays.length === 0) {
    throw HttpError.badRequest('Validation failed', {
      formErrors: [],
      fieldErrors: { scheduleDays: ['Pick at least one day for a specific-days schedule'] },
    });
  }
  if (scheduleType !== 'specific_days') scheduleDays = [];

  const updated = habitsRepository.update(habitId, userId, {
    ...changes,
    // Only write the schedule columns when the schedule is part of the change.
    ...(changes.scheduleType !== undefined || changes.scheduleDays !== undefined
      ? { scheduleType, scheduleDays }
      : {}),
  });
  if (!updated) throw habitNotFound();
  return updated;
}

export function deleteHabit(userId: number, habitId: number): void {
  if (!habitsRepository.delete(habitId, userId)) throw habitNotFound();
}

/**
 * The client sends its own local date, which can be up to a day ahead of the server
 * (time zones reach UTC+14). Anything later than server-today + 1 is a future date.
 */
function assertNotFuture(date: string): void {
  if (date > addDays(serverToday(), 1)) {
    throw HttpError.badRequest("You can't log a habit for a future date");
  }
}

/** PUT /habits/:id/logs/:date — set a day to done/skipped (same request twice = same result). */
export function setLog(userId: number, habitId: number, date: string, status: LogStatus): HabitLog {
  const habit = getOwnedHabit(userId, habitId);
  assertNotFuture(date);
  return logsRepository.upsert(habit.id, date, status);
}

/** DELETE /habits/:id/logs/:date — clear a day (undo). */
export function clearLog(userId: number, habitId: number, date: string): void {
  const habit = getOwnedHabit(userId, habitId);
  logsRepository.delete(habit.id, date);
}
