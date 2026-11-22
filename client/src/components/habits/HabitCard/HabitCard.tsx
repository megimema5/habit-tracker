import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { HabitWithStats, LogStatus } from '@habit/shared';
import { useLogHabit } from '../../../hooks/habits/useLogHabit';
import { cn } from '../../../utils/cn';
import { lastNDays } from '../../../utils/dates';
import { describeSchedule } from '../../../utils/habits';
import { Badge } from '../../ui';
import { CheckInButton } from '../CheckInButton';
import { HabitDays } from '../HabitDays';
import { HabitIcon } from '../HabitIcon';
import { HabitStatsBadges } from '../HabitStatsBadges';
import styles from './HabitCard.module.css';

interface HabitCardProps {
  habit: HabitWithStats;
  today: string;
}

/** One habit on the Today page: check-in, streak / weekly progress and the last 7 days. */
export function HabitCard({ habit, today }: HabitCardProps) {
  const logHabit = useLogHabit();

  const setStatus = (date: string, status: LogStatus | null) =>
    logHabit.mutate({ habitId: habit.id, date, status });

  return (
    <article
      className={cn(styles.card, !habit.isScheduledToday && styles.notToday)}
      style={{ '--habit-color': habit.color } as CSSProperties}
      aria-labelledby={`habit-${habit.id}-name`}
    >
      <div className={styles.main}>
        <HabitIcon icon={habit.icon} color={habit.color} />
        <div className={styles.info}>
          <h3 id={`habit-${habit.id}-name`} className={styles.name}>
            <Link to={`/habits/${habit.id}`} className={styles.link}>
              {habit.name}
            </Link>
          </h3>
          <div className={styles.meta}>
            <span className={styles.schedule}>{describeSchedule(habit)}</span>
            {habit.category && <Badge color={habit.color}>{habit.category}</Badge>}
            <HabitStatsBadges habit={habit} />
          </div>
        </div>
        <CheckInButton
          habitName={habit.name}
          color={habit.color}
          status={habit.todayStatus}
          onChange={(status) => setStatus(today, status)}
        />
      </div>
      <HabitDays habit={habit} dates={lastNDays(7, today)} today={today} onChange={setStatus} />
    </article>
  );
}
