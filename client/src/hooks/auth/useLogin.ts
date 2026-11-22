import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import { queryKeys } from '../../api/queryKeys';

/**
 * Logs in. On success the user is written straight into the `auth.me` cache, so every
 * component using useAuth() updates immediately — and PublicOnlyRoute sends the user on
 * to the app. No extra /auth/me request needed.
 */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me, user);
    },
  });
}
