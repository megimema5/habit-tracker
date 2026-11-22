import type {
  CreateHabitInput,
  Habit,
  HabitLog,
  HabitWithStats,
  LogStatus,
  UpdateHabitInput,
} from '@habit/shared';
import { apiFetch } from './client';

/** One function per habits endpoint. */
export const habitsApi = {
  list: (query: { today: string; days: number }, signal?: AbortSignal) =>
    apiFetch<HabitWithStats[]>('/habits', { query, signal }),

  get: (id: number, query: { today: string; from?: string; to?: string }, signal?: AbortSignal) =>
    apiFetch<HabitWithStats>(`/habits/${id}`, { query, signal }),

  create: (input: CreateHabitInput) => apiFetch<Habit>('/habits', { method: 'POST', body: input }),

  update: (id: number, changes: UpdateHabitInput) =>
    apiFetch<Habit>(`/habits/${id}`, { method: 'PATCH', body: changes }),

  remove: (id: number) => apiFetch<void>(`/habits/${id}`, { method: 'DELETE' }),

  setLog: (id: number, date: string, status: LogStatus) =>
    apiFetch<HabitLog>(`/habits/${id}/logs/${date}`, { method: 'PUT', body: { status } }),

  clearLog: (id: number, date: string) =>
    apiFetch<void>(`/habits/${id}/logs/${date}`, { method: 'DELETE' }),
};
