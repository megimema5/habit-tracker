const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;

/**
 * Converts a short duration like "30m", "12h" or "7d" to milliseconds.
 * Used so the cookie's maxAge always matches the JWT's expiresIn.
 */
export function durationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit as keyof typeof UNIT_MS];
}
