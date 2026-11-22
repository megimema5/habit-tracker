import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { HabitWithStats, LogStatus } from '@habit/shared';
import { ApiRequestError } from '../../api/client';
import { habitsApi } from '../../api/habits.api';
import { queryKeys } from '../../api/queryKeys';
import { useToast } from '../../context/useToast';
import { todayLocal } from '../../utils/dates';

export interface LogChange {
  habitId: number;
  date: string;
  /** 'done' / 'skipped' sets the day, null clears it (undo). */
  status: LogStatus | null;
}

const LOG_MUTATION_KEY = [...queryKeys.habits.all, 'log'] as const;

/** Applies a check-in to one cached habit (only the parts we can know without the server). */
function applyChange(habit: HabitWithStats, change: LogChange, today: string): HabitWithStats {
  if (habit.id !== change.habitId) return habit;
  const logs = habit.logs.filter((log) => log.date !== change.date);
  if (change.status) logs.push({ date: change.date, status: change.status });
  logs.sort((a, b) => a.date.localeCompare(b.date));
  return {
    ...habit,
    logs,
    todayStatus: change.date === today ? change.status : habit.todayStatus,
  };
}

/**
 * Check-ins with an OPTIMISTIC UPDATE:
 * 1. onMutate  – update the cached habits immediately, so the tick appears instantly
 *                (and remember the previous data).
 * 2. request   – PUT or DELETE /habits/:id/logs/:date.
 * 3. onError   – put the previous data back (rollback) and show an error.
 * 4. onSettled – refetch, so streaks and weekly progress (calculated by the server
 *                from the full history) are exactly right.
 *
 * If several check-ins are clicked quickly, we only refetch after the LAST one finishes,
 * so an older response can't briefly overwrite a newer click.
 */
export function useLogHabit() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationKey: LOG_MUTATION_KEY,
    mutationFn: async ({ habitId, date, status }: LogChange): Promise<void> => {
      if (status) await habitsApi.setLog(habitId, date, status);
      else await habitsApi.clearLog(habitId, date);
    },

    onMutate: async (change) => {
      // Stop in-flight refetches from overwriting our optimistic data.
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.all });
      const previous = queryClient.getQueriesData<HabitWithStats[] | HabitWithStats>({
        queryKey: queryKeys.habits.all,
      });

      const today = todayLocal();
      queryClient.setQueriesData<HabitWithStats[] | HabitWithStats>(
        { queryKey: queryKeys.habits.all },
        (old) => {
          if (!old) return old;
          return Array.isArray(old)
            ? old.map((habit) => applyChange(habit, change, today))
            : applyChange(old, change, today);
        },
      );

      return { previous };
    },

    onError: (err, _change, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      // A 401 is handled globally (session expired → login page), no second message.
      if (!(err instanceof ApiRequestError && err.status === 401)) {
        showToast('Could not save your check-in. Please try again.', 'error');
      }
    },

    onSettled: async () => {
      if (queryClient.isMutating({ mutationKey: LOG_MUTATION_KEY }) === 1) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.habits.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
        ]);
      }
    },
  });
}
