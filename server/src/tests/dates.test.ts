import { describe, expect, it } from 'vitest';
import { isValidDateString, timestampToLocalDate } from '@habit/shared';
import {
  addDays,
  datesBetween,
  dayOfWeek,
  fromDateString,
  isScheduledOn,
  previousDay,
  toDateString,
  weekStart,
} from '../utils/dates.js';

// Reference: 2026-11-21 is a Saturday, 2026-11-16 is a Monday.

describe('toDateString / fromDateString', () => {
  it('formats a Date as a local YYYY-MM-DD string', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('round-trips a date string', () => {
    expect(toDateString(fromDateString('2026-11-21'))).toBe('2026-11-21');
  });
});

describe('addDays / previousDay', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(previousDay('2026-01-01')).toBe('2025-12-31');
  });

  it('handles leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('is not affected by daylight-saving changes', () => {
    // Europe switches clocks on the last Sunday of March and October.
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
  });
});

describe('dayOfWeek / weekStart', () => {
  it('returns JavaScript weekday numbers', () => {
    expect(dayOfWeek('2026-11-21')).toBe(6); // Saturday
    expect(dayOfWeek('2026-11-22')).toBe(0); // Sunday
  });

  it('weeks start on Monday', () => {
    expect(weekStart('2026-11-16')).toBe('2026-11-16'); // Monday itself
    expect(weekStart('2026-11-21')).toBe('2026-11-16'); // Saturday
    expect(weekStart('2026-11-22')).toBe('2026-11-16'); // Sunday belongs to the same week
    expect(weekStart('2026-11-23')).toBe('2026-11-23'); // next Monday
  });
});

describe('datesBetween', () => {
  it('includes both ends', () => {
    expect(datesBetween('2026-11-29', '2026-12-02')).toEqual([
      '2026-11-29',
      '2026-11-30',
      '2026-12-01',
      '2026-12-02',
    ]);
  });

  it('returns an empty list when from > to', () => {
    expect(datesBetween('2026-11-22', '2026-11-21')).toEqual([]);
  });
});

describe('isScheduledOn', () => {
  it('daily and weekly habits are scheduled every day', () => {
    expect(isScheduledOn({ scheduleType: 'daily', scheduleDays: [] }, '2026-11-21')).toBe(true);
    expect(isScheduledOn({ scheduleType: 'weekly', scheduleDays: [] }, '2026-11-21')).toBe(true);
  });

  it('specific-days habits only on the chosen weekdays', () => {
    const monWedFri = { scheduleType: 'specific_days' as const, scheduleDays: [1, 3, 5] };
    expect(isScheduledOn(monWedFri, '2026-11-16')).toBe(true); // Monday
    expect(isScheduledOn(monWedFri, '2026-11-17')).toBe(false); // Tuesday
  });
});

describe('isValidDateString (shared)', () => {
  it.each(['2026-11-21', '2028-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(isValidDateString(value)).toBe(true);
  });

  it.each(['2026-02-30', '2026-13-01', '2026-11-1', '21-11-2026', 'today', '2026-02-29'])(
    'rejects %s',
    (value) => {
      expect(isValidDateString(value)).toBe(false);
    },
  );
});

describe('timestampToLocalDate (shared)', () => {
  it('turns a SQLite UTC timestamp into a local date', () => {
    const expected = new Date(Date.UTC(2026, 10, 21, 8, 30)).toLocaleDateString('en-CA');
    expect(timestampToLocalDate('2026-11-21 08:30:00')).toBe(expected);
  });

  it('falls back to the first 10 characters for unexpected input', () => {
    expect(timestampToLocalDate('2026-11-21')).toBe('2026-11-21');
  });
});
