/**
 * Constants shared by the client and the server.
 * Keeping them in one place means there are no "magic" strings or numbers
 * duplicated across the codebase.
 */

/** How often a habit should be done. */
export const SCHEDULE_TYPES = ['daily', 'weekly', 'specific_days'] as const;

/** What can be stored for a habit on a given day. "Missed" = no log at all. */
export const LOG_STATUSES = ['done', 'skipped'] as const;

/** Weekdays as JavaScript numbers them (Date#getDay): 0 = Sunday … 6 = Saturday. */
export const WEEKDAYS = [
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
  { value: 0, short: 'Sun', long: 'Sunday' },
] as const;

/** Suggested categories (users can also type their own). */
export const DEFAULT_CATEGORIES = [
  'Health',
  'Fitness',
  'Study',
  'Work',
  'Mindfulness',
  'Other',
] as const;

/** Colour swatches offered in the habit form (hex). */
export const HABIT_COLORS = [
  '#4f46e5',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#8b5cf6',
  '#64748b',
] as const;

/** Emoji icons offered in the habit form. */
export const HABIT_ICONS = [
  '✅',
  '💧',
  '🏃',
  '📚',
  '🧘',
  '🥗',
  '😴',
  '💪',
  '✍️',
  '🎯',
  '🚭',
  '🎸',
] as const;

export const DEFAULT_HABIT_COLOR = HABIT_COLORS[0];
export const DEFAULT_HABIT_ICON = HABIT_ICONS[0];

/** Validation limits — used by zod schemas on both sides. */
export const LIMITS = {
  HABIT_NAME_MAX: 60,
  CATEGORY_MAX: 30,
  ICON_MAX: 8,
  USER_NAME_MAX: 50,
  PASSWORD_MIN: 8,
  /** bcrypt ignores everything after 72 bytes, so we never accept more. */
  PASSWORD_MAX: 72,
  /** Max number of days a single range query may ask for. */
  MAX_RANGE_DAYS: 366,
  /** Days shown in the week strip. */
  WEEK_STRIP_DAYS: 7,
} as const;

/** Regex for a local calendar date string, e.g. "2026-11-21". */
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Regex for a 6-digit hex colour, e.g. "#4f46e5". */
export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

/** Regex for a time of day, e.g. "18:30". */
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
