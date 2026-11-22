import { describe, expect, it } from 'vitest';
import type { HabitWithStats } from '@habit/shared';
import {
  habitsToRemind,
  parseReminderState,
  shouldShowReminder,
  takeSnapshot,
  toTimeString,
  type ReminderSnapshot,
} from './reminders';

const OPENED = new Date(2026, 10, 21, 18, 0); // app opened at 18:00
const NOW = new Date(2026, 10, 21, 18, 30); // it is now 18:30

function habit(overrides: Partial<HabitWithStats> = {}): HabitWithStats {
  return {
    id: 1,
    name: 'Drink water',
    icon: '💧',
    color: '#06b6d4',
    category: null,
    scheduleType: 'daily',
    scheduleDays: [],
    reminderTime: null,
    createdAt: '2026-11-01 08:00:00',
    updatedAt: '2026-11-01 08:00:00',
    logs: [],
    isScheduledToday: true,
    todayStatus: null,
    currentStreak: 0,
    longestStreak: 0,
    weekProgress: null,
    ...overrides,
  };
}

describe('habitsToRemind', () => {
  const remind = (
    habits: HabitWithStats[],
    snapshot: ReminderSnapshot = takeSnapshot(habits, OPENED),
  ) => habitsToRemind(habits, NOW, snapshot);

  it('includes habits that were waiting when the app opened', () => {
    expect(remind([habit()])).toHaveLength(1);
  });

  it.each([
    ['done today', { todayStatus: 'done' as const }],
    ['skipped today', { todayStatus: 'skipped' as const }],
    ['not scheduled today', { isScheduledToday: false }],
    ['reminder time later today', { reminderTime: '21:00' }],
  ])('leaves out a habit that is %s', (_label, overrides) => {
    expect(remind([habit(overrides)])).toEqual([]);
  });

  it('leaves out a habit created during this visit', () => {
    const snapshot = takeSnapshot([], OPENED);
    expect(remind([habit({ id: 7 })], snapshot)).toEqual([]);
  });

  it('leaves out a habit that was done at opening and un-checked later', () => {
    const snapshot = takeSnapshot([habit({ todayStatus: 'done' })], OPENED);
    expect(remind([habit({ todayStatus: null })], snapshot)).toEqual([]);
  });

  it('includes a habit whose reminder time passed while the app was open', () => {
    const atOpening = habit({ reminderTime: '18:15', todayStatus: 'done' });
    const snapshot = takeSnapshot([atOpening], OPENED);
    expect(remind([{ ...atOpening, todayStatus: null }], snapshot)).toHaveLength(1);
  });

  it('includes a habit once its reminder time has passed', () => {
    expect(remind([habit({ reminderTime: '18:30' })])).toHaveLength(1);
  });
});

describe('takeSnapshot', () => {
  it('records known habits, pending habits and the opening time', () => {
    const snapshot = takeSnapshot(
      [habit({ id: 1 }), habit({ id: 2, todayStatus: 'done' })],
      OPENED,
    );
    expect([...snapshot.knownIds]).toEqual([1, 2]);
    expect([...snapshot.pendingIds]).toEqual([1]);
    expect(snapshot.openedAt).toBe('18:00');
  });
});

describe('shouldShowReminder', () => {
  const today = '2026-11-21';
  const nowMs = NOW.getTime();

  it('shows when habits are pending and nothing was chosen', () => {
    expect(shouldShowReminder({}, today, nowMs, 2)).toBe(true);
  });

  it('never shows with nothing pending', () => {
    expect(shouldShowReminder({}, today, nowMs, 0)).toBe(false);
  });

  it('stays hidden for the rest of the day after "Don’t remind me today"', () => {
    expect(shouldShowReminder({ dismissedOn: today }, today, nowMs, 2)).toBe(false);
    expect(shouldShowReminder({ dismissedOn: '2026-11-20' }, today, nowMs, 2)).toBe(true);
  });

  it('respects a snooze until it runs out', () => {
    expect(shouldShowReminder({ snoozedUntil: nowMs + 1000 }, today, nowMs, 2)).toBe(false);
    expect(shouldShowReminder({ snoozedUntil: nowMs - 1000 }, today, nowMs, 2)).toBe(true);
  });
});

describe('parseReminderState', () => {
  it('keeps valid fields and drops anything else', () => {
    expect(parseReminderState({ dismissedOn: '2026-11-21', snoozedUntil: 5, extra: 1 })).toEqual({
      dismissedOn: '2026-11-21',
      snoozedUntil: 5,
    });
    expect(parseReminderState({ dismissedOn: 42, snoozedUntil: 'soon' })).toEqual({});
    expect(parseReminderState('garbage')).toEqual({});
    expect(parseReminderState(null)).toEqual({});
  });
});

describe('toTimeString', () => {
  it('pads hours and minutes', () => {
    expect(toTimeString(new Date(2026, 0, 1, 7, 5))).toBe('07:05');
  });
});
