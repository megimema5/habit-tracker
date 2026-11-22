import { useEffect } from 'react';

const APP_NAME = 'Habit Tracker';

/**
 * Sets the browser tab title, e.g. "Today · Habit Tracker".
 * Screen readers announce the title when a page changes, so every page gets one.
 */
export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
