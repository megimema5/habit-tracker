import { Badge } from '../../ui';

interface StreakBadgeProps {
  current: number;
  longest: number;
}

/** 🔥 current streak, plus the best ever when it's higher. */
export function StreakBadge({ current, longest }: StreakBadgeProps) {
  const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;
  return (
    <>
      <Badge tone={current > 0 ? 'warning' : 'neutral'}>
        <span aria-hidden="true">🔥</span>
        <span>
          <span className="visually-hidden">Current streak: </span>
          {days(current)}
        </span>
      </Badge>
      {longest > current && <Badge>Best {days(longest)}</Badge>}
    </>
  );
}
