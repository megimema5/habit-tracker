import {
  timestampToLocalDate,
  type DayCompletion,
  type LogStatus,
  type Habit,
  type HabitCompletion,
  type StatsOverview,
  type WeekdayMisses,
} from '@habit/shared';
import { addDays, datesBetween, dayOfWeek, isScheduledOn, weekStart } from '../utils/dates.js';
import type { LogMap } from './streaks.service.js';

/**
 * Stats calculations — PURE functions (habits + logs + dates in, numbers out),
 * so every rule below is covered by unit tests.
 *
 * Counting rules:
 * - A day only counts for a habit if it was due (schedule) and the habit already existed —
 *   unless the user logged it anyway (back-filling a past day), same rule as weekly progress.
 * - Skipped days are left out of the target (a skip is a deliberate day off, not a failure).
 * - TODAY only counts once something is logged — the day isn't over, so an unchecked
 *   habit today is "in progress", not missed.
 * - Logs on days a habit wasn't due are ignored (a Tuesday run on a Mon/Wed/Fri plan).
 * - Weekly habits count WEEKS (done at least once that week), so they appear in the
 *   per-habit list and the overall rate, but not in the day-by-day trend or weekdays.
 */

interface HabitPeriod {
  completion: HabitCompletion;
  /** Per day, for daily / specific-days habits. */
  days: { date: string; done: boolean; missed: boolean }[];
}

/** Days in the period that count for this habit: from its creation day on, plus any logged day. */
function countedDates(habit: Habit, logs: LogMap, from: string, to: string): string[] {
  const created = timestampToLocalDate(habit.createdAt);
  return datesBetween(from, to).filter((date) => date >= created || logs.has(date));
}

function completionOf(habit: Habit, done: number, target: number): HabitCompletion {
  return {
    habitId: habit.id,
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    scheduleType: habit.scheduleType,
    done,
    target,
    rate: target > 0 ? done / target : null,
  };
}

/** Daily and specific-days habits: one entry per due day. */
export function dailyHabitPeriod(
  habit: Habit,
  logs: LogMap,
  from: string,
  to: string,
  today: string,
): HabitPeriod {
  const days: HabitPeriod['days'] = [];
  for (const date of countedDates(habit, logs, from, to)) {
    if (!isScheduledOn(habit, date)) continue;
    const status = logs.get(date);
    if (status === 'skipped') continue;
    if (date === today && !status) continue; // today is still in progress
    days.push({ date, done: status === 'done', missed: status !== 'done' });
  }
  const done = days.filter((day) => day.done).length;
  return { completion: completionOf(habit, done, days.length), days };
}

/** Weekly habits: one entry per week (Mon–Sun) that overlaps the period. */
export function weeklyHabitPeriod(
  habit: Habit,
  logs: LogMap,
  from: string,
  to: string,
  today: string,
): HabitPeriod {
  const counted = new Set(countedDates(habit, logs, from, to));
  let done = 0;
  let target = 0;

  for (let monday = weekStart(from); monday <= to; monday = addDays(monday, 7)) {
    const week = datesBetween(monday, addDays(monday, 6)).filter((date) => counted.has(date));
    if (week.length === 0) continue; // before the habit existed
    const statuses = week.map((date) => logs.get(date));
    const doneThisWeek = statuses.includes('done');
    const skippedThisWeek = statuses.includes('skipped');
    const inProgress = week.includes(today);

    if (doneThisWeek) {
      done++;
      target++;
    } else if (!skippedThisWeek && !inProgress) {
      target++; // a finished week with nothing logged = missed
    }
  }

  return { completion: completionOf(habit, done, target), days: [] };
}

/** Weekday with the highest miss rate (ties → more misses → earlier in the week). */
export function mostMissedWeekday(misses: WeekdayMisses[]): number | null {
  const candidates = misses.filter((m) => m.missed > 0);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.missed / b.due - a.missed / a.due || b.missed - a.missed);
  return candidates[0]?.weekday ?? null;
}

export function computeStats(
  habits: Habit[],
  logsByHabit: Map<number, LogMap>,
  range: { from: string; to: string; today: string },
): StatsOverview {
  const { from, to, today } = range;
  const periods = habits.map((habit) => {
    const logs: LogMap = logsByHabit.get(habit.id) ?? new Map<string, LogStatus>();
    return habit.scheduleType === 'weekly'
      ? weeklyHabitPeriod(habit, logs, from, to, today)
      : dailyHabitPeriod(habit, logs, from, to, today);
  });

  // Day-by-day trend (daily + specific-days habits).
  const byDate = new Map<string, DayCompletion>(
    datesBetween(from, to).map((date) => [date, { date, done: 0, target: 0, rate: null }]),
  );
  // Misses per weekday (past days only — today is never "missed").
  const weekdays: WeekdayMisses[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    missed: 0,
    due: 0,
  }));

  for (const { days } of periods) {
    for (const day of days) {
      const entry = byDate.get(day.date);
      if (entry) {
        entry.target++;
        if (day.done) entry.done++;
      }
      if (day.date < today) {
        const weekday = weekdays[dayOfWeek(day.date)];
        if (weekday) {
          weekday.due++;
          if (day.missed) weekday.missed++;
        }
      }
    }
  }

  const trend = [...byDate.values()].map((day) => ({
    ...day,
    rate: day.target > 0 ? day.done / day.target : null,
  }));
  const perHabit = periods.map((period) => period.completion);
  const done = perHabit.reduce((sum, h) => sum + h.done, 0);
  const target = perHabit.reduce((sum, h) => sum + h.target, 0);

  return {
    from,
    to,
    days: trend.length,
    done,
    target,
    completionRate: target > 0 ? done / target : null,
    perfectDays: trend.filter((day) => day.target > 0 && day.done === day.target).length,
    perHabit,
    trend,
    missedByWeekday: weekdays,
    mostMissedWeekday: mostMissedWeekday(weekdays),
  };
}
