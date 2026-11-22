import { toDateString } from '@habit/shared';

/**
 * Server date helpers. The pure helpers live in @habit/shared (used by the client too)
 * and are re-exported here so server code keeps importing from one place.
 */
export {
  addDays,
  datesBetween,
  dayOfWeek,
  fromDateString,
  isScheduledOn,
  previousDay,
  toDateString,
  weekStart,
} from '@habit/shared';

/** Today on the server's clock. Only a fallback — the client normally sends its own "today". */
export function serverToday(): string {
  return toDateString(new Date());
}
