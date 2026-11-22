import type { Habit, HabitLog, LogStatus, WeekProgress } from '@habit/shared';
import { addDays, datesBetween, isScheduledOn, previousDay, weekStart } from '../utils/dates.js';

/**
 * Streak and progress calculations.
 *
 * These are PURE functions: they take plain data (logs + "today") and return a number.
 * No database, no clock — which makes them easy to understand and to unit-test.
 *
 * Rules (see plan.md §6.5):
 * - Streaks only exist for DAILY habits.
 * - 'done' adds 1 to a streak.
 * - 'skipped' pauses a streak: it doesn't add, but it doesn't break it either.
 * - A day with no log breaks the streak…
 * - …except TODAY: the day isn't over yet, so an unlogged today doesn't break anything.
 */

export type LogMap = Map<string, LogStatus>;

export function toLogMap(logs: HabitLog[]): LogMap {
  return new Map(logs.map((log) => [log.date, log.status]));
}

/** Consecutive days up to today (or yesterday, if today isn't logged yet). */
export function currentStreak(logs: LogMap, today: string): number {
  let day = logs.has(today) ? today : previousDay(today);
  let streak = 0;

  while (logs.has(day)) {
    if (logs.get(day) === 'done') streak++;
    day = previousDay(day);
  }

  return streak;
}

/** The best streak ever: walk all logs oldest → newest, count runs of consecutive days. */
export function longestStreak(logs: LogMap): number {
  const dates = [...logs.keys()].sort();
  let best = 0;
  let run = 0;
  let previous: string | undefined;

  for (const date of dates) {
    // A gap of one or more days without a log ends the run.
    if (previous !== undefined && date !== addDays(previous, 1)) run = 0;
    if (logs.get(date) === 'done') run++;
    best = Math.max(best, run);
    previous = date;
  }

  return best;
}

/**
 * Progress this week (Monday → Sunday):
 * - weekly        → target 1; done once anywhere in the week = complete
 * - specific_days → target = scheduled days this week, minus days explicitly skipped;
 *                   done = scheduled days marked done
 * Days before `startDate` (the day the habit was created) don't count towards the target.
 */
export function weekProgress(
  habit: Pick<Habit, 'scheduleType' | 'scheduleDays'>,
  logs: LogMap,
  today: string,
  startDate?: string,
): WeekProgress {
  const week = datesBetween(weekStart(today), addDays(weekStart(today), 6)).filter(
    (date) => !startDate || date >= startDate || logs.has(date),
  );

  if (habit.scheduleType === 'weekly') {
    const doneThisWeek = week.some((date) => logs.get(date) === 'done');
    return { done: doneThisWeek ? 1 : 0, target: 1 };
  }

  const scheduled = week.filter((date) => isScheduledOn(habit, date));
  const skipped = scheduled.filter((date) => logs.get(date) === 'skipped').length;
  const done = scheduled.filter((date) => logs.get(date) === 'done').length;
  return { done, target: scheduled.length - skipped };
}
