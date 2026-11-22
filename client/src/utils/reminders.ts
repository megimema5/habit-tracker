import type { HabitWithStats } from '@habit/shared';

/**
 * Rules for the daily reminder popup — pure functions, so they are easy to test.
 *
 * The popup is about OPENING the app: it lists habits that were still waiting when the
 * habits first loaded. To avoid notification fatigue:
 * - "Later" (or closing it) snoozes it for 2 hours; finishing the last habit does too,
 * - "Don't remind me today" hides it until tomorrow,
 * - habits created or un-checked during this visit never trigger it — the user is
 *   clearly already using the app,
 * - a habit with a reminder time only counts once that time has passed; if that happens
 *   while the app is open, the popup appears then.
 */

export const SNOOZE_MS = 2 * 60 * 60 * 1000;

/** Saved per user in localStorage (a UI preference — nothing sensitive). */
export interface ReminderState {
  /** 'YYYY-MM-DD' of the day the user chose "Don't remind me today". */
  dismissedOn?: string;
  /** Timestamp (ms) until which the reminder is snoozed. */
  snoozedUntil?: number;
}

/** What the habits looked like when the app opened (first successful load). */
export interface ReminderSnapshot {
  /** Habits that existed at that moment. */
  knownIds: ReadonlySet<number>;
  /** Habits that were scheduled today and not done/skipped at that moment. */
  pendingIds: ReadonlySet<number>;
  /** Time of day the app was opened, 'HH:MM'. */
  openedAt: string;
}

/** '18:05' for the given time. */
export function toTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function takeSnapshot(habits: HabitWithStats[], now: Date): ReminderSnapshot {
  return {
    knownIds: new Set(habits.map((habit) => habit.id)),
    pendingIds: new Set(
      habits.filter((h) => h.isScheduledToday && h.todayStatus === null).map((h) => h.id),
    ),
    openedAt: toTimeString(now),
  };
}

/** Habits that should be listed in the reminder right now. */
export function habitsToRemind(
  habits: HabitWithStats[],
  now: Date,
  snapshot: ReminderSnapshot,
): HabitWithStats[] {
  const time = toTimeString(now);
  return habits.filter((habit) => {
    if (!habit.isScheduledToday || habit.todayStatus !== null) return false;
    if (!snapshot.knownIds.has(habit.id)) return false; // created during this visit
    if (habit.reminderTime && habit.reminderTime > time) return false; // not time yet

    const waitingWhenOpened = snapshot.pendingIds.has(habit.id);
    const reminderPassedSinceOpening =
      habit.reminderTime !== null && habit.reminderTime > snapshot.openedAt;
    return waitingWhenOpened || reminderPassedSinceOpening;
  });
}

export function shouldShowReminder(
  state: ReminderState,
  today: string,
  nowMs: number,
  pendingCount: number,
): boolean {
  if (pendingCount === 0) return false;
  if (state.dismissedOn === today) return false;
  if (state.snoozedUntil !== undefined && state.snoozedUntil > nowMs) return false;
  return true;
}

/** Guards against anything unexpected stored in localStorage. */
export function parseReminderState(value: unknown): ReminderState {
  if (!value || typeof value !== 'object') return {};
  const { dismissedOn, snoozedUntil } = value as Record<string, unknown>;
  return {
    ...(typeof dismissedOn === 'string' ? { dismissedOn } : {}),
    ...(typeof snoozedUntil === 'number' ? { snoozedUntil } : {}),
  };
}
