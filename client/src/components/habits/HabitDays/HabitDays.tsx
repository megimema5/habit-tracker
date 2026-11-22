import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { HabitWithStats, LogStatus } from '@habit/shared';
import { cn } from '../../../utils/cn';
import { formatDay } from '../../../utils/dates';
import {
  DAY_STATE_LABEL,
  dayState,
  logMapOf,
  nextStatus,
  type DayState,
} from '../../../utils/habits';
import { Icon, type IconName } from '../../ui';
import styles from './HabitDays.module.css';

interface HabitDaysProps {
  habit: HabitWithStats;
  dates: string[];
  today: string;
  /** 'strip' = one row with weekday labels (Today page); 'grid' = wrapping calendar (detail). */
  variant?: 'strip' | 'grid';
  onChange?: (date: string, status: LogStatus | null) => void;
}

const STATE_ICON: Partial<Record<DayState, IconName>> = {
  done: 'check',
  skipped: 'minus',
  missed: 'close',
};

/**
 * A row (or grid) of days showing done / skipped / missed. Every cell is a button:
 * clicking cycles nothing → done → skipped → nothing, so past days can be fixed.
 * Colour is never the only signal — every state also has an icon and a text label.
 *
 * Keyboard: the whole strip is ONE Tab stop ("roving tabindex"); the arrow keys,
 * Home and End move between days. Without this, every habit would cost 7 extra Tab presses.
 */
export function HabitDays({ habit, dates, today, variant = 'strip', onChange }: HabitDaysProps) {
  const logs = logMapOf(habit.logs);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // The ONE day reachable with Tab: starts on today (or the last day) and then follows
  // whichever day the user moved to, so Tab always leaves the strip.
  const todayIndex = dates.indexOf(today);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const tabbableIndex = focusedIndex ?? (todayIndex >= 0 ? todayIndex : dates.length - 1);

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const current = cellRefs.current.findIndex((cell) => cell === document.activeElement);
    if (current === -1) return;
    const last = dates.length - 1;
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? Math.min(current + 1, last)
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? Math.max(current - 1, 0)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    cellRefs.current[next]?.focus();
  }

  return (
    <ul
      className={cn(styles.days, styles[variant])}
      style={{ '--habit-color': habit.color } as CSSProperties}
      role="list"
      aria-label={`${habit.name}: history`}
      onKeyDown={handleKeyDown}
    >
      {dates.map((date, index) => {
        const state = dayState(habit, logs, date, today);
        const icon = STATE_ICON[state];
        const next = nextStatus(logs.get(date));
        const nextLabel = next === null ? 'clear' : `mark ${next}`;
        const label = `${formatDay(date, { weekday: 'long', day: 'numeric', month: 'long' })}: ${DAY_STATE_LABEL[state]}`;

        return (
          <li key={date} className={styles.day}>
            {variant === 'strip' && (
              <span
                className={cn(styles.weekday, date === today && styles.todayLabel)}
                aria-hidden="true"
              >
                {formatDay(date, { weekday: 'narrow' })}
              </span>
            )}
            <button
              ref={(cell) => {
                cellRefs.current[index] = cell;
              }}
              type="button"
              tabIndex={index === tabbableIndex ? 0 : -1}
              onFocus={() => setFocusedIndex(index)}
              aria-keyshortcuts="ArrowLeft ArrowRight Home End"
              className={cn(styles.cell, styles[state], date === today && styles.today)}
              onClick={() => onChange?.(date, next)}
              disabled={!onChange || state === 'future'}
              aria-label={onChange ? `${label}. Click to ${nextLabel}.` : label}
              title={label}
            >
              {icon ? (
                <Icon name={icon} size={variant === 'strip' ? 16 : 14} />
              ) : (
                variant === 'grid' && <span className={styles.number}>{Number(date.slice(8))}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
