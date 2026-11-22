import { useId } from 'react';
import type { ScheduleType } from '@habit/shared';
import { DayPicker } from '../DayPicker';
import styles from './ScheduleSelector.module.css';

const OPTIONS: { value: ScheduleType; label: string; hint: string }[] = [
  { value: 'daily', label: 'Daily', hint: 'Every day' },
  { value: 'weekly', label: 'Weekly', hint: 'Once a week' },
  { value: 'specific_days', label: 'Specific days', hint: 'Pick the days' },
];

interface ScheduleSelectorProps {
  scheduleType: ScheduleType;
  scheduleDays: number[];
  onChange: (value: { scheduleType: ScheduleType; scheduleDays: number[] }) => void;
  daysError?: string | undefined;
}

/** Daily / Weekly / Specific days (+ the day picker when "specific days" is chosen). */
export function ScheduleSelector({
  scheduleType,
  scheduleDays,
  onChange,
  daysError,
}: ScheduleSelectorProps) {
  const name = useId();

  return (
    <div className={styles.wrapper}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>How often?</legend>
        <div className={styles.options}>
          {OPTIONS.map((option) => {
            const id = `${name}-${option.value}`;
            return (
              <span key={option.value} className={styles.option}>
                <input
                  type="radio"
                  id={id}
                  name={name}
                  className={styles.radio}
                  checked={scheduleType === option.value}
                  onChange={() => onChange({ scheduleType: option.value, scheduleDays })}
                />
                <label htmlFor={id} className={styles.label}>
                  <span className={styles.title}>{option.label}</span>
                  <span className={styles.hint}>{option.hint}</span>
                </label>
              </span>
            );
          })}
        </div>
      </fieldset>
      {scheduleType === 'specific_days' && (
        <DayPicker
          value={scheduleDays}
          onChange={(days) => onChange({ scheduleType, scheduleDays: days })}
          error={daysError}
        />
      )}
    </div>
  );
}
