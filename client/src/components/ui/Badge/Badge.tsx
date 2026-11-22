import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import styles from './Badge.module.css';

interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  /** Custom colour (e.g. a habit colour) — overrides `tone`. */
  color?: string | undefined;
  className?: string;
}

export function Badge({ children, tone = 'neutral', color, className }: BadgeProps) {
  const style = color ? ({ '--badge-color': color } as CSSProperties) : undefined;
  return (
    <span
      className={cn(styles.badge, color ? styles.custom : styles[tone], className)}
      style={style}
    >
      {children}
    </span>
  );
}
