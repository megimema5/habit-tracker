import type { CSSProperties } from 'react';
import type { HabitCompletion } from '@habit/shared';
import { formatPercent } from '../../../utils/format';
import { HabitIcon } from '../../habits';
import styles from './HabitCompletionList.module.css';

/**
 * Meter list: one row per habit — name, a bar of its completion rate and the figure.
 * Ranked from best to worst so the reader can compare at a glance. The bar is the
 * habit's own colour (identity); the text stays in text colours.
 */
export function HabitCompletionList({ habits }: { habits: HabitCompletion[] }) {
  const ranked = [...habits].sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

  return (
    <ul className={styles.list} role="list">
      {ranked.map((habit) => (
        <li key={habit.habitId} className={styles.row}>
          <HabitIcon icon={habit.icon} color={habit.color} size={32} />
          <div className={styles.body}>
            <div className={styles.top}>
              <span className={styles.name}>{habit.name}</span>
              <span className={styles.figure}>
                {formatPercent(habit.rate)}
                <span className={styles.count}>
                  {' '}
                  · {habit.done}/{habit.target} {habit.scheduleType === 'weekly' ? 'weeks' : 'days'}
                </span>
              </span>
            </div>
            <div
              className={styles.track}
              style={{ '--habit-color': habit.color } as CSSProperties}
              role="meter"
              aria-label={`${habit.name} completion`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={habit.rate === null ? 0 : Math.round(habit.rate * 100)}
              aria-valuetext={
                habit.rate === null
                  ? 'Nothing due yet'
                  : `${formatPercent(habit.rate)}, ${habit.done} of ${habit.target}`
              }
            >
              <div className={styles.fill} style={{ width: formatPercent(habit.rate ?? 0) }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
