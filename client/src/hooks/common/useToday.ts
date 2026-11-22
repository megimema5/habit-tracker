import { useEffect, useState } from 'react';
import { msUntilMidnight, todayLocal } from '../../utils/dates';

/**
 * Today's local date ('YYYY-MM-DD') that stays correct if the app is left open
 * past midnight, or the laptop wakes up the next morning.
 */
export function useToday(): string {
  const [today, setToday] = useState(todayLocal);

  useEffect(() => {
    const refresh = () => setToday(todayLocal());

    // Update right after midnight…
    const timer = window.setTimeout(refresh, msUntilMidnight() + 1000);
    // …and whenever the tab becomes visible again (timers pause while a laptop sleeps).
    document.addEventListener('visibilitychange', refresh);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [today]);

  return today;
}
