import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { statsApi } from '../../api/stats.api';
import { useToday } from '../common/useToday';

/**
 * Stats for the last `days` days. While a new period loads, the previous numbers stay
 * on screen (keepPreviousData) — no flash of empty charts when switching 7 → 30 → 90.
 */
export function useStats(days: number) {
  const today = useToday();
  return useQuery({
    queryKey: queryKeys.stats.overview(today, days),
    queryFn: ({ signal }) => statsApi.overview({ today, days }, signal),
    placeholderData: keepPreviousData,
  });
}
