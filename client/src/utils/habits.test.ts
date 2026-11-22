import { describe, expect, it } from 'vitest';
import type { LogStatus } from '@habit/shared';
import { dayState, describeSchedule, logMapOf, nextStatus } from './habits';

// 2026-11-21 is a Saturday.
const TODAY = '2026-11-21';
const daily = {
  scheduleType: 'daily' as const,
  scheduleDays: [],
  createdAt: '2026-11-01 08:00:00',
};
const monWedFri = { ...daily, scheduleType: 'specific_days' as const, scheduleDays: [1, 3, 5] };
const weekly = { ...daily, scheduleType: 'weekly' as const };
const noLogs = new Map<string, LogStatus>();

describe('describeSchedule', () => {
  it.each([
    [{ scheduleType: 'daily' as const, scheduleDays: [] }, 'Every day'],
    [{ scheduleType: 'weekly' as const, scheduleDays: [] }, 'Once a week'],
    [{ scheduleType: 'specific_days' as const, scheduleDays: [5, 1, 3] }, 'Mon, Wed, Fri'],
    [{ scheduleType: 'specific_days' as const, scheduleDays: [1, 2, 3, 4, 5] }, 'Weekdays'],
    [{ scheduleType: 'specific_days' as const, scheduleDays: [6, 0] }, 'Weekends'],
    [{ scheduleType: 'specific_days' as const, scheduleDays: [0, 1, 2, 3, 4, 5, 6] }, 'Every day'],
  ])('%o → %s', (schedule, expected) => {
    expect(describeSchedule(schedule)).toBe(expected);
  });
});

describe('dayState', () => {
  it('uses the log when there is one', () => {
    const logs = logMapOf([{ date: '2026-11-20', status: 'skipped' }]);
    expect(dayState(daily, logs, '2026-11-20', TODAY)).toBe('skipped');
  });

  it('today without a log is pending, not missed', () => {
    expect(dayState(daily, noLogs, TODAY, TODAY)).toBe('pending');
  });

  it('a past scheduled day without a log is missed', () => {
    expect(dayState(daily, noLogs, '2026-11-19', TODAY)).toBe('missed');
  });

  it('days the habit is not scheduled on are neutral', () => {
    expect(dayState(monWedFri, noLogs, '2026-11-17', TODAY)).toBe('unscheduled'); // Tuesday
  });

  it('a single empty day of a weekly habit is not "missed"', () => {
    expect(dayState(weekly, noLogs, '2026-11-19', TODAY)).toBe('unscheduled');
  });

  it('days before the habit was created are "not started"', () => {
    const newHabit = { ...daily, createdAt: '2026-11-21 08:00:00' };
    expect(dayState(newHabit, noLogs, '2026-11-15', TODAY)).toBe('notStarted');
  });

  it('days after today are future', () => {
    expect(dayState(daily, noLogs, '2026-11-22', TODAY)).toBe('future');
  });
});

describe('nextStatus', () => {
  it('cycles nothing → done → skipped → nothing', () => {
    expect(nextStatus(null)).toBe('done');
    expect(nextStatus('done')).toBe('skipped');
    expect(nextStatus('skipped')).toBeNull();
  });
});
