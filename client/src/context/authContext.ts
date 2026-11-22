import { createContext } from 'react';
import type { LoginInput, RegisterInput, User } from '@habit/shared';

export interface AuthContextValue {
  /** The logged-in user, or null when logged out. */
  user: User | null;
  /** True only while the first "who am I?" request is running. */
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

/** Kept in its own file so AuthProvider.tsx only exports a component (fast refresh rule). */
export const AuthContext = createContext<AuthContextValue | null>(null);
