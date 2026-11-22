import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * Forgets everything about the current user (logout or expired session).
 *
 * Order matters: the `auth.me` entry is set to null IN PLACE first, so every component
 * watching it (route guards, header) is notified and redirects to /login. Then all other
 * cached data (habits…) is removed so the next person on this browser never sees it.
 *
 * (queryClient.clear() would also delete the auth.me entry itself — components still
 * subscribed to the old entry would then miss the update and stay on the page.)
 */
export function clearSession(queryClient: QueryClient): void {
  void queryClient.cancelQueries();
  queryClient.setQueryData(queryKeys.auth.me, null);
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== queryKeys.auth.me[0],
  });
}
