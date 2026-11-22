import { WEEKDAYS, type Habit, type HabitLog, type LogStatus } from '@habit/shared';
import { timestampToLocalDate } from '@habit/shared';
import { isScheduledOn } from './dates';

type Schedule = Pick<Habit, 'scheduleType' | 'scheduleDays'>;

/** "Every day", "Once a week", "Weekdays", "Mon, Wed, Fri"… */
export function describeSchedule(habit: Schedule): string {
  if (habit.scheduleType === 'daily') return 'Every day';
  if (habit.scheduleType === 'weekly') return 'Once a week';

  const days = [...habit.scheduleDays].sort();
  if (days.length === 7) return 'Every day';
  if (days.join() === '1,2,3,4,5') return 'Weekdays';
  if (days.join() === '0,6') return 'Weekends';
  return WEEKDAYS.filter((day) => days.includes(day.value))
    .map((day) => day.short)
    .join(', ');
}

/** What a day looks like in the history strip. */
export type DayState =
  'done' | 'skipped' | 'missed' | 'pending' | 'unscheduled' | 'notStarted' | 'future';

export function logMapOf(logs: HabitLog[]): Map<string, LogStatus> {
  return new Map(logs.map((log) => [log.date, log.status]));
}

export function dayState(
  habit: Schedule & Pick<Habit, 'createdAt'>,
  logs: Map<string, LogStatus>,
  date: string,
  today: string,
): DayState {
  const status = logs.get(date);
  if (status) return status;
  if (date > today) return 'future';
  // Days before the habit existed can't be "missed".
  if (date < timestampToLocalDate(habit.createdAt)) return 'notStarted';
  if (!isScheduledOn(habit, date)) return 'unscheduled';
  if (date === today) return 'pending';
  // A weekly habit can be done on any day, so a single empty day isn't "missed".
  return habit.scheduleType === 'weekly' ? 'unscheduled' : 'missed';
}

/** Clicking a day cycles: nothing → done → skipped → nothing. */
export function nextStatus(current: LogStatus | null | undefined): LogStatus | null {
  if (!current) return 'done';
  if (current === 'done') return 'skipped';
  return null;
}

export const DAY_STATE_LABEL: Record<DayState, string> = {
  done: 'Done',
  skipped: 'Skipped',
  missed: 'Missed',
  pending: 'Not done yet',
  unscheduled: 'Not scheduled',
  notStarted: 'Before this habit started',
  future: 'Upcoming',
};
