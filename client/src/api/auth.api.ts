import type { LoginInput, RegisterInput, User } from '@habit/shared';
import { apiFetch } from './client';

/** One function per auth endpoint. The login cookie is set/cleared by the server. */
export const authApi = {
  register: (input: RegisterInput) =>
    apiFetch<User>('/auth/register', { method: 'POST', body: input }),

  login: (input: LoginInput) => apiFetch<User>('/auth/login', { method: 'POST', body: input }),

  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),

  me: () => apiFetch<User>('/auth/me'),
};
