import { addDays, fromDateString, toDateString } from '@habit/shared';

/**
 * Client date helpers. The API works with LOCAL calendar dates ('YYYY-MM-DD'),
 * so "today" is always computed here, in the user's own time zone, and sent to the server.
 * The pure helpers come from @habit/shared — the same code the server uses.
 */
export { addDays, isScheduledOn, weekStart } from '@habit/shared';

/** Today in the user's time zone. */
export function todayLocal(): string {
  return toDateString(new Date());
}

/** The last `count` days ending with `end`, oldest first: lastNDays(3, '2026-11-21') → [19, 20, 21]. */
export function lastNDays(count: number, end: string = todayLocal()): string[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - (count - 1)));
}

/** 'Sat, 21 Nov' (or another style) in the user's locale. */
export function formatDay(
  value: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' },
): string {
  return fromDateString(value).toLocaleDateString(undefined, options);
}

/** Milliseconds from now until the next local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}
