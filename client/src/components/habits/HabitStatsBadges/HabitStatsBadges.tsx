import type { HabitWithStats } from '@habit/shared';
import { StreakBadge } from '../StreakBadge';
import { WeekProgress } from '../WeekProgress';

/** Streaks for daily habits, weekly progress for the others. */
export function HabitStatsBadges({ habit }: { habit: HabitWithStats }) {
  if (habit.currentStreak !== null && habit.longestStreak !== null) {
    return <StreakBadge current={habit.currentStreak} longest={habit.longestStreak} />;
  }
  if (habit.weekProgress) return <WeekProgress progress={habit.weekProgress} />;
  return null;
}
