import { describe, expect, it } from 'vitest';
import type { LogStatus } from '@habit/shared';
import {
  currentStreak,
  longestStreak,
  weekProgress,
  type LogMap,
} from '../services/streaks.service.js';

// Reference week: Mon 2026-11-16 … Sun 2026-11-22. "Today" is Saturday 2026-11-21.
const TODAY = '2026-11-21';

const logs = (entries: Record<string, LogStatus>): LogMap => new Map(Object.entries(entries));

describe('currentStreak', () => {
  it('is 0 with no logs', () => {
    expect(currentStreak(logs({}), TODAY)).toBe(0);
  });

  it('counts consecutive done days ending today', () => {
    const map = logs({ '2026-11-19': 'done', '2026-11-20': 'done', '2026-11-21': 'done' });
    expect(currentStreak(map, TODAY)).toBe(3);
  });

  it("doesn't break when today isn't logged yet (the day isn't over)", () => {
    const map = logs({ '2026-11-19': 'done', '2026-11-20': 'done' });
    expect(currentStreak(map, TODAY)).toBe(2);
  });

  it('a skipped day pauses the streak without breaking it', () => {
    const map = logs({
      '2026-11-18': 'done',
      '2026-11-19': 'skipped',
      '2026-11-20': 'done',
      '2026-11-21': 'done',
    });
    expect(currentStreak(map, TODAY)).toBe(3);
  });

  it('a missed day (no log) breaks the streak', () => {
    const map = logs({ '2026-11-17': 'done', '2026-11-18': 'done', '2026-11-20': 'done' });
    expect(currentStreak(map, TODAY)).toBe(1);
  });

  it('is 0 when yesterday was missed and today is not logged', () => {
    const map = logs({ '2026-11-18': 'done', '2026-11-19': 'done' });
    expect(currentStreak(map, TODAY)).toBe(0);
  });

  it('only skipped days give a streak of 0', () => {
    const map = logs({ '2026-11-20': 'skipped', '2026-11-21': 'skipped' });
    expect(currentStreak(map, TODAY)).toBe(0);
  });

  it('works across a month boundary', () => {
    const map = logs({ '2026-11-30': 'done', '2026-12-01': 'done', '2026-12-02': 'done' });
    expect(currentStreak(map, '2026-12-02')).toBe(3);
  });
});

describe('longestStreak', () => {
  it('is 0 with no logs', () => {
    expect(longestStreak(logs({}))).toBe(0);
  });

  it('finds the best run even if it is in the past', () => {
    const map = logs({
      '2026-11-01': 'done',
      '2026-11-02': 'done',
      '2026-11-03': 'done',
      '2026-11-04': 'done', // run of 4
      '2026-11-10': 'done',
      '2026-11-11': 'done', // run of 2
    });
    expect(longestStreak(map)).toBe(4);
  });

  it('skipped days continue a run without adding to it', () => {
    const map = logs({
      '2026-11-01': 'done',
      '2026-11-02': 'skipped',
      '2026-11-03': 'done',
      '2026-11-04': 'done',
    });
    expect(longestStreak(map)).toBe(3);
  });

  it('does not depend on insertion order', () => {
    const map = logs({ '2026-11-03': 'done', '2026-11-01': 'done', '2026-11-02': 'done' });
    expect(longestStreak(map)).toBe(3);
  });
});

describe('weekProgress', () => {
  const weekly = { scheduleType: 'weekly' as const, scheduleDays: [] };
  const monWedFri = { scheduleType: 'specific_days' as const, scheduleDays: [1, 3, 5] };

  it('weekly: 0/1 until done once this week, then 1/1', () => {
    expect(weekProgress(weekly, logs({}), TODAY)).toEqual({ done: 0, target: 1 });
    expect(weekProgress(weekly, logs({ '2026-11-17': 'done' }), TODAY)).toEqual({
      done: 1,
      target: 1,
    });
  });

  it('weekly: a log from last week does not count', () => {
    expect(weekProgress(weekly, logs({ '2026-11-15': 'done' }), TODAY)).toEqual({
      done: 0,
      target: 1,
    });
  });

  it('specific days: counts done scheduled days out of all scheduled days this week', () => {
    const map = logs({ '2026-11-16': 'done', '2026-11-18': 'done' }); // Mon, Wed
    expect(weekProgress(monWedFri, map, TODAY)).toEqual({ done: 2, target: 3 });
  });

  it('specific days: a skipped day lowers the target', () => {
    const map = logs({ '2026-11-16': 'done', '2026-11-20': 'skipped' }); // Mon done, Fri skipped
    expect(weekProgress(monWedFri, map, TODAY)).toEqual({ done: 1, target: 2 });
  });

  it('specific days: days before the habit was created do not count', () => {
    // Created on Thursday 19 Nov → Mon and Wed of this week are not part of the target.
    expect(weekProgress(monWedFri, logs({}), TODAY, '2026-11-19')).toEqual({ done: 0, target: 1 });
  });

  it('specific days: a day logged before the creation date still counts', () => {
    const map = logs({ '2026-11-16': 'done' });
    expect(weekProgress(monWedFri, map, TODAY, '2026-11-19')).toEqual({ done: 1, target: 2 });
  });

  it('specific days: logs on non-scheduled days are ignored', () => {
    const map = logs({ '2026-11-17': 'done' }); // Tuesday
    expect(weekProgress(monWedFri, map, TODAY)).toEqual({ done: 0, target: 3 });
  });
});
