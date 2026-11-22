import { useQuery } from '@tanstack/react-query';
import { habitsApi } from '../../api/habits.api';
import { queryKeys } from '../../api/queryKeys';
import { addDays } from '../../utils/dates';
import { useToday } from '../common/useToday';

export const HISTORY_DAYS = 30;

/** One habit with its stats and the last 30 days of history (detail page). */
export function useHabit(id: number) {
  const today = useToday();
  return useQuery({
    queryKey: queryKeys.habits.detail(id, today),
    queryFn: ({ signal }) =>
      habitsApi.get(id, { today, from: addDays(today, -(HISTORY_DAYS - 1)), to: today }, signal),
    enabled: Number.isInteger(id) && id > 0,
  });
}
