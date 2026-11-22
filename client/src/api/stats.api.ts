import type { StatsOverview } from '@habit/shared';
import { apiFetch } from './client';

export const statsApi = {
  overview: (query: { today: string; days: number }, signal?: AbortSignal) =>
    apiFetch<StatsOverview>('/stats', { query, signal }),
};
