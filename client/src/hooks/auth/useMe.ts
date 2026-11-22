import { useQuery } from '@tanstack/react-query';
import type { User } from '@habit/shared';
import { authApi } from '../../api/auth.api';
import { ApiRequestError } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';

/**
 * Who is logged in? Asks the server once when the app loads (GET /auth/me).
 * The login cookie is httpOnly, so JavaScript can't read it — the server is the
 * only one who knows. A 401 simply means "not logged in" → null.
 */
export function useMe() {
  return useQuery<User | null>({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}
