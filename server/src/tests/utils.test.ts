import { describe, expect, it } from 'vitest';
import { durationToMs } from '../utils/duration.js';

describe('durationToMs', () => {
  it.each([
    ['30s', 30_000],
    ['15m', 900_000],
    ['12h', 43_200_000],
    ['7d', 604_800_000],
  ])('%s → %i ms', (input, expected) => {
    expect(durationToMs(input)).toBe(expected);
  });

  it('throws for an invalid value', () => {
    expect(() => durationToMs('7 days')).toThrow();
  });
});
