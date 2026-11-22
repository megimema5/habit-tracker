import type { CSSProperties } from 'react';
import type { LogStatus } from '@habit/shared';
import { cn } from '../../../utils/cn';
import { Icon } from '../../ui';
import styles from './CheckInButton.module.css';

interface CheckInButtonProps {
  habitName: string;
  color: string;
  status: LogStatus | null;
  onChange: (status: LogStatus | null) => void;
  disabled?: boolean;
}

/**
 * The one-tap check-in. Big round button = done / undo; small text button = skip / undo skip.
 * aria-pressed tells screen readers whether the habit is currently done.
 */
export function CheckInButton({
  habitName,
  color,
  status,
  onChange,
  disabled,
}: CheckInButtonProps) {
  const isDone = status === 'done';
  const isSkipped = status === 'skipped';

  return (
    <div className={styles.wrapper} style={{ '--habit-color': color } as CSSProperties}>
      <button
        type="button"
        className={cn(styles.check, isDone && styles.done, isSkipped && styles.skipped)}
        onClick={() => onChange(isDone ? null : 'done')}
        aria-pressed={isDone}
        aria-label={isDone ? `Undo: ${habitName} done` : `Mark ${habitName} as done`}
        title={isDone ? 'Done — click to undo' : 'Mark as done'}
        disabled={disabled}
      >
        <Icon name={isSkipped ? 'skip' : 'check'} size={24} />
      </button>
      {!isDone && (
        <button
          type="button"
          className={styles.skip}
          onClick={() => onChange(isSkipped ? null : 'skipped')}
          aria-label={isSkipped ? `Undo skip for ${habitName}` : `Skip ${habitName} today`}
          disabled={disabled}
        >
          {isSkipped ? 'Undo skip' : 'Skip'}
        </button>
      )}
    </div>
  );
}
