import { useId } from 'react';
import { PERIODS, type Period } from './periods';
import styles from './PeriodFilter.module.css';

interface PeriodFilterProps {
  value: Period;
  onChange: (period: Period) => void;
}

/** "Last 7 / 30 / 90 days" — one row above the stats, scoping everything below it. */
export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const name = useId();
  return (
    <fieldset className={styles.filter}>
      <legend className="visually-hidden">Time period</legend>
      {PERIODS.map((period) => {
        const id = `${name}-${period}`;
        return (
          <span key={period}>
            <input
              type="radio"
              id={id}
              name={name}
              className={styles.radio}
              checked={value === period}
              onChange={() => onChange(period)}
            />
            <label htmlFor={id} className={styles.option}>
              Last {period} days
            </label>
          </span>
        );
      })}
    </fieldset>
  );
}
