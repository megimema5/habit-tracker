import { cn } from '../../../utils/cn';
import styles from './Skeleton.module.css';

/** Grey placeholder shown while content loads (feels faster than a spinner). */
export function Skeleton({ height = 16, className }: { height?: number; className?: string }) {
  return <div className={cn(styles.skeleton, className)} style={{ height }} aria-hidden="true" />;
}
