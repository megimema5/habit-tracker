import type { LOG_STATUSES, SCHEDULE_TYPES } from './constants.js';

export type ScheduleType = (typeof SCHEDULE_TYPES)[number];
export type LogStatus = (typeof LOG_STATUSES)[number];

/** A user as the API returns it. Never includes the password hash. */
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

/** A habit as the API returns it. */
export interface Habit {
  id: number;
  name: string;
  icon: string;
  color: string;
  category: string | null;
  scheduleType: ScheduleType;
  /** Weekdays 0–6 (0 = Sunday). Empty unless scheduleType is 'specific_days'. */
  scheduleDays: number[];
  reminderTime: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One day's check-in. A day with no log means "missed" (or not scheduled). */
export interface HabitLog {
  date: string;
  status: LogStatus;
}

/** Progress this week (Monday–Sunday) for weekly and specific-days habits. */
export interface WeekProgress {
  done: number;
  target: number;
}

/** A habit plus everything the UI needs to show it. */
export interface HabitWithStats extends Habit {
  /** Logs inside the requested range (default: the last 7 days). */
  logs: HabitLog[];
  isScheduledToday: boolean;
  todayStatus: LogStatus | null;
  /** Streaks only exist for daily habits; null for the other schedules. */
  currentStreak: number | null;
  longestStreak: number | null;
  /** Only for weekly / specific-days habits; null for daily habits. */
  weekProgress: WeekProgress | null;
}

/** Completion for one day, across daily and specific-days habits. */
export interface DayCompletion {
  date: string;
  done: number;
  /** Habits due that day, minus skipped ones (today only counts once something is logged). */
  target: number;
  /** done / target, or null when nothing was due. */
  rate: number | null;
}

/** Completion for one habit over the period (weekly habits count weeks, not days). */
export interface HabitCompletion {
  habitId: number;
  name: string;
  icon: string;
  color: string;
  scheduleType: ScheduleType;
  done: number;
  target: number;
  rate: number | null;
}

/** How often each weekday was missed (past days only). */
export interface WeekdayMisses {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  missed: number;
  /** Days that were due on this weekday (missed + done). */
  due: number;
}

/** GET /api/stats */
export interface StatsOverview {
  from: string;
  to: string;
  days: number;
  done: number;
  target: number;
  completionRate: number | null;
  /** Days where every due habit was done. */
  perfectDays: number;
  perHabit: HabitCompletion[];
  trend: DayCompletion[];
  missedByWeekday: WeekdayMisses[];
  /** Weekday with the highest miss rate, or null if nothing was missed. */
  mostMissedWeekday: number | null;
}

/** Every successful API response has this shape. */
export interface ApiSuccess<T> {
  data: T;
}

/** Every failed API response has this shape. */
export interface ApiError {
  error: {
    message: string;
    details?: unknown;
  };
}

/** GET /api/health */
export interface HealthStatus {
  status: 'ok';
  database: 'ok';
  uptime: number;
  timestamp: string;
}
