import { useId } from 'react';
import { WEEKDAYS } from '@habit/shared';
import styles from './DayPicker.module.css';

interface DayPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
  error?: string | undefined;
}

/** Mon–Sun toggle chips, built on real checkboxes (keyboard + screen reader friendly). */
export function DayPicker({ value, onChange, error }: DayPickerProps) {
  const name = useId();

  function toggle(day: number) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);
  }

  return (
    <fieldset className={styles.group} aria-describedby={error ? `${name}-error` : undefined}>
      <legend className={styles.legend}>On which days?</legend>
      <div className={styles.days}>
        {WEEKDAYS.map((day) => {
          const id = `${name}-${day.value}`;
          return (
            <span key={day.value}>
              <input
                type="checkbox"
                id={id}
                className={styles.checkbox}
                checked={value.includes(day.value)}
                onChange={() => toggle(day.value)}
              />
              <label htmlFor={id} className={styles.chip} title={day.long}>
                {day.short}
              </label>
            </span>
          );
        })}
      </div>
      {error && (
        <p id={`${name}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
