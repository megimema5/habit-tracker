import { cn } from '../../../utils/cn';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: number;
  /** Announced to screen readers. */
  label?: string;
  className?: string;
}

export function Spinner({ size = 24, label = 'Loading', className }: SpinnerProps) {
  return (
    <span className={cn(styles.wrapper, className)} role="status">
      <span className={styles.spinner} style={{ width: size, height: size }} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
