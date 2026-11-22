import { describe, expect, it } from 'vitest';
import type { Habit, LogStatus } from '@habit/shared';
import {
  computeStats,
  dailyHabitPeriod,
  mostMissedWeekday,
  weeklyHabitPeriod,
} from '../services/stats.service.js';
import type { LogMap } from '../services/streaks.service.js';

// Reference week: Mon 2026-11-16 … Sun 2026-11-22. "Today" is Saturday 2026-11-21.
const TODAY = '2026-11-21';
const MONDAY = '2026-11-16';

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 1,
    name: 'Habit',
    icon: '✅',
    color: '#4f46e5',
    category: null,
    scheduleType: 'daily',
    scheduleDays: [],
    reminderTime: null,
    createdAt: '2026-10-01 08:00:00',
    updatedAt: '2026-10-01 08:00:00',
    ...overrides,
  };
}

const logs = (entries: Record<string, LogStatus>): LogMap => new Map(Object.entries(entries));

describe('dailyHabitPeriod', () => {
  it('counts due days, leaves out skipped days and an unlogged today', () => {
    const period = dailyHabitPeriod(
      habit(),
      logs({
        '2026-11-16': 'done',
        '2026-11-17': 'done',
        // 18th: missed
        '2026-11-19': 'skipped',
        '2026-11-20': 'done',
        // 21st (today): nothing yet → in progress, not missed
      }),
      MONDAY,
      TODAY,
      TODAY,
    );
    expect(period.completion).toMatchObject({ done: 3, target: 4, rate: 0.75 });
    expect(period.days.filter((d) => d.missed).map((d) => d.date)).toEqual(['2026-11-18']);
  });

  it('counts today once it is done', () => {
    const period = dailyHabitPeriod(habit(), logs({ [TODAY]: 'done' }), TODAY, TODAY, TODAY);
    expect(period.completion).toMatchObject({ done: 1, target: 1, rate: 1 });
  });

  it('starts on the day the habit was created', () => {
    const created = habit({ createdAt: '2026-11-19 09:00:00' });
    const period = dailyHabitPeriod(created, logs({ '2026-11-20': 'done' }), MONDAY, TODAY, TODAY);
    expect(period.completion).toMatchObject({ done: 1, target: 2 }); // Thu (missed) + Fri (done)
  });

  it('still counts a day logged before the creation date (back-filled)', () => {
    const created = habit({ createdAt: '2026-11-19 09:00:00' });
    const period = dailyHabitPeriod(created, logs({ '2026-11-17': 'done' }), MONDAY, TODAY, TODAY);
    expect(period.completion).toMatchObject({ done: 1, target: 3 }); // Tue (done), Thu, Fri
  });

  it('specific days: only scheduled days count; logs on other days are ignored', () => {
    const monWedFri = habit({ scheduleType: 'specific_days', scheduleDays: [1, 3, 5] });
    const period = dailyHabitPeriod(
      monWedFri,
      logs({ '2026-11-16': 'done', '2026-11-17': 'done', '2026-11-20': 'done' }),
      MONDAY,
      TODAY,
      TODAY,
    );
    expect(period.completion).toMatchObject({ done: 2, target: 3 }); // Mon, Fri done; Wed missed
  });

  it('has a null rate when nothing was due', () => {
    const period = dailyHabitPeriod(habit(), logs({}), TODAY, TODAY, TODAY);
    expect(period.completion).toMatchObject({ done: 0, target: 0, rate: null });
  });
});

describe('weeklyHabitPeriod', () => {
  const weekly = habit({ scheduleType: 'weekly' });
  const from = '2026-11-08'; // Sunday → three weeks overlap: 2–8, 9–15, 16–22 (current)

  it('counts weeks; the current week only counts once done', () => {
    const period = weeklyHabitPeriod(weekly, logs({ '2026-11-12': 'done' }), from, TODAY, TODAY);
    // week 2–8: missed · week 9–15: done · current week: in progress
    expect(period.completion).toMatchObject({ done: 1, target: 2 });
  });

  it('a done current week counts', () => {
    const period = weeklyHabitPeriod(
      weekly,
      logs({ '2026-11-12': 'done', '2026-11-17': 'done' }),
      from,
      TODAY,
      TODAY,
    );
    expect(period.completion).toMatchObject({ done: 2, target: 3 });
  });

  it('a skipped week does not count against the habit', () => {
    const period = weeklyHabitPeriod(
      weekly,
      logs({ '2026-11-08': 'skipped', '2026-11-12': 'done' }),
      from,
      TODAY,
      TODAY,
    );
    // week 2–8: skipped (left out) · week 9–15: done · current week: in progress
    expect(period.completion).toMatchObject({ done: 1, target: 1, rate: 1 });
  });
});

describe('mostMissedWeekday', () => {
  it('picks the weekday with the highest miss rate', () => {
    expect(
      mostMissedWeekday([
        { weekday: 1, missed: 2, due: 4 }, // 50%
        { weekday: 4, missed: 3, due: 4 }, // 75%
        { weekday: 5, missed: 3, due: 10 }, // 30%
      ]),
    ).toBe(4);
  });

  it('breaks rate ties by the number of misses', () => {
    expect(
      mostMissedWeekday([
        { weekday: 2, missed: 1, due: 2 },
        { weekday: 3, missed: 2, due: 4 },
      ]),
    ).toBe(3);
  });

  it('is null when nothing was missed', () => {
    expect(mostMissedWeekday([{ weekday: 1, missed: 0, due: 3 }])).toBeNull();
  });
});

describe('computeStats', () => {
  const water = habit({ id: 1 });
  const read = habit({ id: 2 });
  const review = habit({ id: 3, scheduleType: 'weekly' });
  const logsByHabit = new Map<number, LogMap>([
    [
      1,
      logs({ '2026-11-16': 'done', '2026-11-17': 'done', '2026-11-18': 'done', [TODAY]: 'done' }),
    ],
    [2, logs({ '2026-11-16': 'done', '2026-11-18': 'skipped' })],
    [3, logs({ '2026-11-17': 'done' })],
  ]);
  const stats = computeStats([water, read, review], logsByHabit, {
    from: MONDAY,
    to: TODAY,
    today: TODAY,
  });

  it('adds up every habit (weekly habits count weeks)', () => {
    // water: Mon–Wed done, Thu + Fri missed, today done → 4 done of 6 due
    expect(stats.perHabit.map((h) => [h.habitId, h.done, h.target])).toEqual([
      [1, 4, 6],
      [2, 1, 4], // Mon done, Wed skipped, Tue/Thu/Fri missed, today in progress
      [3, 1, 1],
    ]);
    expect(stats.done).toBe(6);
    expect(stats.target).toBe(11);
    expect(stats.completionRate).toBeCloseTo(6 / 11);
  });

  it('builds a day-by-day trend from daily habits', () => {
    expect(stats.trend.map((d) => [d.date.slice(8), d.done, d.target])).toEqual([
      ['16', 2, 2],
      ['17', 1, 2],
      ['18', 1, 1], // read was skipped
      ['19', 0, 2],
      ['20', 0, 2],
      ['21', 1, 1], // today: only the logged habit counts
    ]);
  });

  it('counts perfect days (everything due was done)', () => {
    expect(stats.perfectDays).toBe(3); // 16th, 18th, today
  });

  it('counts misses per weekday (past days only) and finds the worst one', () => {
    const byDay = Object.fromEntries(stats.missedByWeekday.map((w) => [w.weekday, w]));
    expect(byDay[4]).toEqual({ weekday: 4, missed: 2, due: 2 }); // Thursday
    expect(byDay[6]).toEqual({ weekday: 6, missed: 0, due: 0 }); // Saturday = today, never "missed"
    expect([4, 5]).toContain(stats.mostMissedWeekday); // Thu and Fri are both 100%
  });

  it('handles no habits at all', () => {
    const empty = computeStats([], new Map(), { from: MONDAY, to: TODAY, today: TODAY });
    expect(empty).toMatchObject({ done: 0, target: 0, completionRate: null, perfectDays: 0 });
    expect(empty.trend).toHaveLength(6);
    expect(empty.mostMissedWeekday).toBeNull();
  });
});
