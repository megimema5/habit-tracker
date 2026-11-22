import { useQuery } from '@tanstack/react-query';
import { habitsApi } from '../../api/habits.api';
import { queryKeys } from '../../api/queryKeys';
import { addDays } from '../../utils/dates';
import { useToday } from '../common/useToday';

export const YEAR_DAYS = 365;

/** One habit with a full year of logs, for the heatmap (reuses GET /habits/:id with a range). */
export function useHabitYear(id: number) {
  const today = useToday();
  return useQuery({
    queryKey: [...queryKeys.habits.detail(id, today), 'year'],
    queryFn: ({ signal }) =>
      habitsApi.get(id, { today, from: addDays(today, -(YEAR_DAYS - 1)), to: today }, signal),
    enabled: Number.isInteger(id) && id > 0,
  });
}
