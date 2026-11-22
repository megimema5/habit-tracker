import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateHabitInput, UpdateHabitInput } from '@habit/shared';
import { habitsApi } from '../../api/habits.api';
import { queryKeys } from '../../api/queryKeys';
import { useToast } from '../../context/useToast';

/**
 * Create / update / delete. After each change every habits and stats query is
 * invalidated (list, detail, stats…) so all pages show fresh data. Validation errors are shown by the
 * form itself, so only success is toasted here.
 */

export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: CreateHabitInput) => habitsApi.create(input),
    onSuccess: async (habit) => {
      showToast(`“${habit.name}” created`, 'success');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
      ]);
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: UpdateHabitInput }) =>
      habitsApi.update(id, changes),
    onSuccess: async () => {
      showToast('Changes saved', 'success');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
      ]);
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (habit: { id: number; name: string }) => habitsApi.remove(habit.id),
    onSuccess: async (_data, habit) => {
      showToast(`“${habit.name}” deleted`, 'success');
      queryClient.removeQueries({ queryKey: [...queryKeys.habits.all, 'detail', habit.id] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
      ]);
    },
    onError: () => showToast('Could not delete the habit. Please try again.', 'error'),
  });
}
