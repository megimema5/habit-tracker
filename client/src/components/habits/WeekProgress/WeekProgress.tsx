import type { WeekProgress as WeekProgressData } from '@habit/shared';
import { Badge } from '../../ui';

/** "2 / 3 this week" for weekly and specific-days habits (they have no streaks). */
export function WeekProgress({ progress }: { progress: WeekProgressData }) {
  // e.g. a Mon/Wed/Fri habit created on a Saturday has nothing left to do this week.
  if (progress.target === 0 && progress.done === 0) return <Badge>Nothing due this week</Badge>;
  const complete = progress.target > 0 && progress.done >= progress.target;
  return (
    <Badge tone={complete ? 'success' : 'primary'}>
      {complete && <span aria-hidden="true">✓</span>}
      {progress.done} / {progress.target} this week
    </Badge>
  );
}
