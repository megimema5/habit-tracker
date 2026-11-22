import { useCallback, useState } from 'react';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    // Storage can be blocked (private mode, browser settings) or hold invalid JSON.
    return fallback;
  }
}

/**
 * Like useState, but the value survives a page refresh.
 * Only for small UI preferences (e.g. "reminder already shown today") — never for
 * anything sensitive; the login lives in an httpOnly cookie, not here.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((previous: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => read(key, initialValue));

  const setValue = useCallback(
    (value: T | ((previous: T) => T)) => {
      setStored((previous) => {
        const next = value instanceof Function ? value(previous) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Ignore write errors (quota, blocked storage) — the in-memory value still updates.
        }
        return next;
      });
    },
    [key],
  );

  return [stored, setValue];
}
