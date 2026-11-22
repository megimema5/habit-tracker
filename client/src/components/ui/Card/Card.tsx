import type { CSSProperties, ComponentProps } from 'react';
import { cn } from '../../../utils/cn';
import styles from './Card.module.css';

interface CardProps extends ComponentProps<'div'> {
  /** Adds a coloured stripe on the left (e.g. the habit's colour). */
  accentColor?: string | undefined;
  padding?: 'none' | 'md' | 'lg';
}

export function Card({
  accentColor,
  padding = 'md',
  className,
  style,
  children,
  ...rest
}: CardProps) {
  const accentStyle = accentColor ? ({ '--card-accent': accentColor } as CSSProperties) : undefined;

  return (
    <div
      className={cn(styles.card, styles[padding], accentColor && styles.accent, className)}
      style={{ ...accentStyle, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
