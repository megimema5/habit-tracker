import { useEffect, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@habit/shared';
import { clearSession } from '../api/clearSession';
import { setUnauthorizedHandler } from '../api/client';
import { queryKeys } from '../api/queryKeys';
import { useLogin } from '../hooks/auth/useLogin';
import { useLogout } from '../hooks/auth/useLogout';
import { useMe } from '../hooks/auth/useMe';
import { useRegister } from '../hooks/auth/useRegister';
import { AuthContext, type AuthContextValue } from './authContext';
import { useToast } from './useToast';

/**
 * Makes the current user available everywhere through useAuth().
 * It is a thin layer over the React Query auth hooks — the user itself lives in the
 * query cache (key `auth.me`), so there is only ever one source of truth.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const me = useMe();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  // If any request answers 401 while we think the user is logged in, the session has
  // expired (or the account was deleted): clear everything and go back to the login page.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      const current = queryClient.getQueryData<User | null>(queryKeys.auth.me);
      if (!current) return; // e.g. a wrong password on the login form — not an expiry
      clearSession(queryClient);
      showToast('Your session has expired. Please log in again.', 'info');
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient, showToast]);

  const { mutateAsync: login } = loginMutation;
  const { mutateAsync: register } = registerMutation;
  const { mutateAsync: logout } = logoutMutation;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: me.data ?? null,
      isLoading: me.isPending,
      isAuthenticated: Boolean(me.data),
      login,
      register,
      logout: () => logout(),
    }),
    [me.data, me.isPending, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
