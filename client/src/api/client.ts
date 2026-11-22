import type { ApiError } from '@habit/shared';

/**
 * The one place that talks HTTP. Every API call goes through apiFetch, so JSON handling,
 * cookies and errors are dealt with consistently.
 */

/** Thrown for any non-2xx response. Components can read `status` and field `details`. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }

  /** Field errors from a 400 validation response, e.g. { email: ['Enter a valid email'] }. */
  get fieldErrors(): Record<string, string[]> {
    const details = this.details as { fieldErrors?: Record<string, string[]> } | undefined;
    return details?.fieldErrors ?? {};
  }
}

/**
 * Called whenever the API answers 401 (e.g. the login expired).
 * The auth layer (Phase 6) registers a handler that clears the user so the app
 * redirects to the login page.
 */
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiFetchOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

const BASE_URL = '/api';

function buildUrl(path: string, query?: ApiFetchOptions['query']): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

/**
 * Calls the API and returns the `data` field of the response.
 *
 *   const habits = await apiFetch<HabitWithStats[]>('/habits', { query: { today } });
 *   await apiFetch('/habits', { method: 'POST', body: input });
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: 'include', // send the httpOnly login cookie
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiRequestError(0, 'Could not reach the server. Check your connection.');
  }

  if (response.status === 204) return undefined as T;

  const json = (await response.json().catch(() => null)) as { data?: T } | ApiError | null;

  if (!response.ok) {
    if (response.status === 401) unauthorizedHandler?.();
    const error = json && 'error' in json ? json.error : undefined;
    throw new ApiRequestError(
      response.status,
      error?.message ?? `Request failed (${response.status})`,
      error?.details,
    );
  }

  return (json as { data: T }).data;
}
