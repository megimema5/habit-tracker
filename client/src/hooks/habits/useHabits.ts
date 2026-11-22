import { useQuery } from '@tanstack/react-query';
import { LIMITS } from '@habit/shared';
import { habitsApi } from '../../api/habits.api';
import { queryKeys } from '../../api/queryKeys';
import { useToday } from '../common/useToday';

/**
 * All habits of the logged-in user, with stats and the logs of the last `days` days.
 * "today" is the user's local date, so streaks are calculated for their time zone.
 */
export function useHabits(days: number = LIMITS.WEEK_STRIP_DAYS) {
  const today = useToday();
  return useQuery({
    queryKey: queryKeys.habits.list(today, days),
    queryFn: ({ signal }) => habitsApi.list({ today, days }, signal),
  });
}
