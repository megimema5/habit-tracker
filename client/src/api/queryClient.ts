import { QueryClient } from '@tanstack/react-query';
import { ApiRequestError } from './client';

/** Retrying a 400/401/404 won't change the answer — only retry network/server errors. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiRequestError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // data is "fresh" for 30s → no refetch when switching pages quickly
      retry: shouldRetry,
      refetchOnWindowFocus: true, // coming back to the tab shows up-to-date data
    },
    mutations: {
      retry: false,
    },
  },
});
