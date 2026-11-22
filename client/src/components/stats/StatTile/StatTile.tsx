import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import styles from './StatTile.module.css';

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** The one headline number of the page (shown larger). */
  hero?: boolean;
}

/** A labelled headline number. */
export function StatTile({ label, value, hint, hero = false }: StatTileProps) {
  return (
    <div className={cn(styles.tile, hero && styles.hero)}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
