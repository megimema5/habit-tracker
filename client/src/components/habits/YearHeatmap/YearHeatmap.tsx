import type { CSSProperties } from 'react';
import type { HabitWithStats } from '@habit/shared';
import { cn } from '../../../utils/cn';
import { addDays, formatDay, weekStart } from '../../../utils/dates';
import { DAY_STATE_LABEL, dayState, logMapOf } from '../../../utils/habits';
import styles from './YearHeatmap.module.css';

interface YearHeatmapProps {
  habit: HabitWithStats;
  today: string;
  days: number;
}

// First entry lines up with the month row; then one label per weekday row (Mon → Sun).
const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '', ''];

/**
 * A year at a glance, GitHub-style: one column per week (Mon → Sun), one cell per day.
 * Same states and colours as the 30-day history, so the legend there applies here too.
 * Hover a cell for its date; the summary above it gives the totals in words.
 */
export function YearHeatmap({ habit, today, days }: YearHeatmapProps) {
  const logs = logMapOf(habit.logs);
  const first = weekStart(addDays(today, -(days - 1)));
  const weeks: string[][] = [];
  for (let monday = first; monday <= today; monday = addDays(monday, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(monday, i)));
  }

  const doneCount = habit.logs.filter((log) => log.status === 'done').length;

  return (
    <div className={styles.wrapper} style={{ '--habit-color': habit.color } as CSSProperties}>
      <p className={styles.summary}>
        Done <strong>{doneCount}</strong> {doneCount === 1 ? 'time' : 'times'} in the last year.
      </p>
      <div
        className={styles.scroll}
        tabIndex={0}
        role="img"
        aria-label={`${habit.name}: done ${doneCount} times in the last ${days} days`}
      >
        <div className={styles.grid}>
          <div className={styles.weekdays} aria-hidden="true">
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
          {weeks.map((week) => {
            const month = week.find((date) => date.endsWith('-01') || date === week[0]);
            const showMonth = week.some((date) => date.slice(8) === '01') || week === weeks[0];
            return (
              <div key={week[0]} className={styles.week}>
                <span className={styles.month} aria-hidden="true">
                  {showMonth && month
                    ? formatDay(week.find((d) => d.endsWith('-01')) ?? month, { month: 'short' })
                    : ''}
                </span>
                {week.map((date) => {
                  const state = date > today ? 'future' : dayState(habit, logs, date, today);
                  return (
                    <span
                      key={date}
                      className={cn(styles.cell, styles[state])}
                      title={`${formatDay(date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}: ${DAY_STATE_LABEL[state]}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
