import { z } from 'zod';
import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  HEX_COLOR_REGEX,
  LIMITS,
  LOG_STATUSES,
  SCHEDULE_TYPES,
  TIME_REGEX,
} from './constants.js';
import { isValidDateString } from './dates.js';

/**
 * zod schemas shared by the server (request validation) and the client (form validation).
 * One definition → both sides always agree on what is valid.
 *
 * All object schemas are strict: unknown fields (e.g. `id`, `userId`) are rejected,
 * which prevents "mass assignment" attacks.
 */

/** Number of bytes a string takes in UTF-8 (what bcrypt actually hashes). */
export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

/** Email: trimmed, lowercased (so "Megi@Mail.com" and "megi@mail.com" are the same account). */
const emailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long')
  .pipe(z.email({ error: 'Enter a valid email address' }));

/**
 * Password rules: 8+ characters, at least one letter and one number,
 * and at most 72 bytes — bcrypt silently ignores anything after 72 bytes,
 * so a longer password would give a false sense of security.
 * (Bytes, not characters: emoji and accented letters take 2–4 bytes each.)
 */
const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(LIMITS.PASSWORD_MIN, `Password must be at least ${LIMITS.PASSWORD_MIN} characters`)
  .refine((value) => utf8ByteLength(value) <= LIMITS.PASSWORD_MAX, {
    error: 'Password is too long',
  })
  .refine((value) => /[a-zA-Z]/.test(value) && /\d/.test(value), {
    error: 'Password must contain at least one letter and one number',
  });

export const registerSchema = z.strictObject({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(LIMITS.USER_NAME_MAX, `Name must be at most ${LIMITS.USER_NAME_MAX} characters`),
  email: emailSchema,
  password: passwordSchema,
});

/** Login only checks that both fields are present — the strength rules apply at registration. */
export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required')
    .max(200, 'Password is too long'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/* ------------------------------------------------------------------ */
/* Habits                                                              */
/* ------------------------------------------------------------------ */

/** A local calendar date 'YYYY-MM-DD' that actually exists. */
export const dateSchema = z
  .string({ error: 'Date is required' })
  .refine(isValidDateString, { error: 'Date must be a real date in YYYY-MM-DD format' });

const habitFields = {
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(LIMITS.HABIT_NAME_MAX, `Name must be at most ${LIMITS.HABIT_NAME_MAX} characters`),
  icon: z.string().trim().min(1, 'Pick an icon').max(LIMITS.ICON_MAX, 'Icon is too long'),
  color: z.string().regex(HEX_COLOR_REGEX, 'Color must be a hex value like #4f46e5'),
  /** Empty string or null both mean "no category". */
  category: z
    .string()
    .trim()
    .max(LIMITS.CATEGORY_MAX, `Category must be at most ${LIMITS.CATEGORY_MAX} characters`)
    .nullable()
    .transform((value) => (value ? value : null)),
  scheduleType: z.enum(SCHEDULE_TYPES),
  scheduleDays: z
    .array(z.number().int().min(0).max(6), { error: 'Schedule days must be weekday numbers 0–6' })
    .max(7)
    .refine((days) => new Set(days).size === days.length, { error: 'Days must not repeat' })
    .transform((days) => [...days].sort((a, b) => a - b)),
  reminderTime: z.string().regex(TIME_REGEX, 'Time must look like 18:30').nullable(),
};

/**
 * Schedule rule shared by create and update:
 * 'specific_days' needs at least one day; other schedules ignore the days.
 */
export function checkSchedule(
  value: { scheduleType: string; scheduleDays: number[] },
  ctx: z.RefinementCtx,
): void {
  if (value.scheduleType === 'specific_days' && value.scheduleDays.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['scheduleDays'],
      message: 'Pick at least one day for a specific-days schedule',
    });
  }
}

export const createHabitSchema = z
  .strictObject({
    name: habitFields.name,
    icon: habitFields.icon.default(DEFAULT_HABIT_ICON),
    color: habitFields.color.default(DEFAULT_HABIT_COLOR),
    category: habitFields.category.optional().transform((value) => value ?? null),
    scheduleType: habitFields.scheduleType.default('daily'),
    scheduleDays: habitFields.scheduleDays.default([]),
    reminderTime: habitFields.reminderTime.optional().transform((value) => value ?? null),
  })
  .superRefine(checkSchedule)
  .transform((habit) => ({
    ...habit,
    scheduleDays: habit.scheduleType === 'specific_days' ? habit.scheduleDays : [],
  }));

/** Every field optional, but at least one must be sent. The schedule rule is checked
 *  by the service after merging with the stored habit. */
export const updateHabitSchema = z
  .strictObject({
    name: habitFields.name.optional(),
    icon: habitFields.icon.optional(),
    color: habitFields.color.optional(),
    category: habitFields.category.optional(),
    scheduleType: habitFields.scheduleType.optional(),
    scheduleDays: habitFields.scheduleDays.optional(),
    reminderTime: habitFields.reminderTime.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { error: 'Send at least one field to update' });

export const logEntrySchema = z.strictObject({
  status: z.enum(LOG_STATUSES, { error: "Status must be 'done' or 'skipped'" }),
});

/** URL params like /habits/:id — ids arrive as strings, so they are coerced to numbers. */
export const habitIdParamsSchema = z.strictObject({
  id: z.coerce.number({ error: 'Invalid id' }).int().positive('Invalid id'),
});

export const logParamsSchema = z.strictObject({
  id: habitIdParamsSchema.shape.id,
  date: dateSchema,
});

/** GET /habits?today=2026-11-21&days=7 */
export const habitsQuerySchema = z.strictObject({
  today: dateSchema.optional(),
  days: z.coerce.number().int().min(1).max(LIMITS.MAX_RANGE_DAYS).default(LIMITS.WEEK_STRIP_DAYS),
});

/** GET /habits/:id?today=…&from=…&to=… (range up to MAX_RANGE_DAYS) */
export const habitDetailQuerySchema = z
  .strictObject({
    today: dateSchema.optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    error: "'from' must be before 'to'",
    path: ['from'],
  });

/** GET /stats?today=2026-11-21&days=30 */
export const statsQuerySchema = z.strictObject({
  today: dateSchema.optional(),
  days: z.coerce.number().int().min(1).max(LIMITS.MAX_RANGE_DAYS).default(30),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type LogEntryInput = z.infer<typeof logEntrySchema>;
export type HabitsQuery = z.infer<typeof habitsQuerySchema>;
export type HabitDetailQuery = z.infer<typeof habitDetailQuerySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
