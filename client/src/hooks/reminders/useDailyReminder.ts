import { useState } from 'react';
import type { HabitWithStats } from '@habit/shared';
import { useAuth } from '../../context/useAuth';
import {
  habitsToRemind,
  parseReminderState,
  shouldShowReminder,
  SNOOZE_MS,
  takeSnapshot,
  type ReminderSnapshot,
  type ReminderState,
} from '../../utils/reminders';
import { useLocalStorage } from '../common/useLocalStorage';
import { useNow } from '../common/useNow';
import { useToday } from '../common/useToday';
import { useHabits } from '../habits/useHabits';

export interface DailyReminder {
  isOpen: boolean;
  habits: HabitWithStats[];
  /** Close for now — it can come back in 2 hours. */
  snooze: () => void;
  /** Close until tomorrow. */
  dismissForToday: () => void;
}

/**
 * Decides whether the reminder popup is open. Everything is DERIVED from data
 * (habits, time, saved preference, the snapshot taken when the app opened) — no effects —
 * so it can't get out of sync.
 *
 * The storage key includes the user id, so two accounts on one browser don't clash.
 * (AppLayout remounts on login, so the key and snapshot are fresh for each user.)
 */
export function useDailyReminder(): DailyReminder {
  const { user } = useAuth();
  const today = useToday();
  const now = useNow();
  const { data } = useHabits();
  const [stored, setStored] = useLocalStorage<ReminderState>(
    `habit-tracker:reminder:${user?.id ?? 'anonymous'}`,
    {},
  );
  const state = parseReminderState(stored);

  // Remember how things looked the first time the habits loaded ("when the app opened").
  // Setting state during render, guarded like this, is React's recommended way to
  // store information derived from the first value of something.
  const [snapshot, setSnapshot] = useState<ReminderSnapshot | null>(null);
  if (data && snapshot === null) setSnapshot(takeSnapshot(data, now));

  const habits = data && snapshot ? habitsToRemind(data, now, snapshot) : [];
  const isOpen = shouldShowReminder(state, today, now.getTime(), habits.length);

  return {
    isOpen,
    habits,
    snooze: () => setStored({ ...state, snoozedUntil: Date.now() + SNOOZE_MS }),
    dismissForToday: () => setStored({ dismissedOn: today }),
  };
}
