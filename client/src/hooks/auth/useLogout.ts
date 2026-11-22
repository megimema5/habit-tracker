import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import { clearSession } from '../../api/clearSession';

/**
 * Logs out: the server clears the cookie, then all cached data is wiped (clearSession)
 * so the next person on this browser never sees the previous user's habits.
 * Runs on success AND on failure — if the server is unreachable we still log out locally.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => clearSession(queryClient),
  });
}
