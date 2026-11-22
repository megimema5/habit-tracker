import { DATE_REGEX } from './constants.js';
import type { Habit } from './types.js';

/**
 * Date helpers shared by the client and the server — one implementation, tested once.
 *
 * Dates are plain LOCAL calendar strings ('YYYY-MM-DD'), never UTC timestamps. That avoids
 * the classic bug where a check-in at 00:30 in Tirane is stored as the previous day in UTC.
 * 'YYYY-MM-DD' strings also sort correctly as text, so '<' and '>' work on them.
 */

/**
 * True for a real calendar date written as 'YYYY-MM-DD'.
 * '2026-02-30' matches the pattern but is not a real date, so it is rejected.
 */
export function isValidDateString(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1) return false;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= daysInMonth;
}

/** Formats a Date as a local 'YYYY-MM-DD' string. */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses 'YYYY-MM-DD' as a LOCAL date at midnight (new Date('2026-11-21') would be UTC!). */
export function fromDateString(value: string): Date {
  const [y = NaN, m = NaN, d = NaN] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Adds (or subtracts, with a negative number) whole days. Safe across DST changes. */
export function addDays(value: string, days: number): string {
  const date = fromDateString(value);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export function previousDay(value: string): string {
  return addDays(value, -1);
}

/** Weekday number like Date#getDay: 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(value: string): number {
  return fromDateString(value).getDay();
}

/** The Monday of the week that contains `value` (weeks run Monday → Sunday). */
export function weekStart(value: string): string {
  const daysSinceMonday = (dayOfWeek(value) + 6) % 7;
  return addDays(value, -daysSinceMonday);
}

/** Every date from `from` to `to`, both included. */
export function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) dates.push(day);
  return dates;
}

/**
 * Is the habit meant to be done on this date?
 * - daily / weekly → any day (a weekly habit can be done on any day of the week)
 * - specific_days  → only on the chosen weekdays
 */
export function isScheduledOn(
  habit: Pick<Habit, 'scheduleType' | 'scheduleDays'>,
  date: string,
): boolean {
  if (habit.scheduleType !== 'specific_days') return true;
  return habit.scheduleDays.includes(dayOfWeek(date));
}

/**
 * Converts a SQLite timestamp ('2026-11-21 08:30:00', stored in UTC) to the LOCAL calendar
 * date of whoever runs the code — e.g. the day a habit was created, in the user's time zone.
 */
export function timestampToLocalDate(timestamp: string): string {
  const date = new Date(`${timestamp.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? timestamp.slice(0, 10) : toDateString(date);
}
