/**
 * React Query cache keys, defined in one place.
 * Using the same functions everywhere means invalidating `queryKeys.habits.all`
 * refreshes every habits query (list, detail…) after a change.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  habits: {
    all: ['habits'] as const,
    list: (today: string, days: number) => ['habits', 'list', today, days] as const,
    detail: (id: number, today: string) => ['habits', 'detail', id, today] as const,
  },
  stats: {
    all: ['stats'] as const,
    overview: (today: string, days: number) => ['stats', 'overview', today, days] as const,
  },
};
