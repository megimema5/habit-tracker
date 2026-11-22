import type { CSSProperties } from 'react';
import { cn } from '../../../utils/cn';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number;
  max: number;
  /** Read by screen readers, e.g. "Habits done today". */
  label: string;
  color?: string | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  color,
  size = 'md',
  className,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const style = { '--progress': `${percent}%`, '--bar-color': color } as CSSProperties;
  return (
    <div
      className={cn(styles.track, styles[size], className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      style={style}
    >
      <div className={styles.fill} />
    </div>
  );
}
