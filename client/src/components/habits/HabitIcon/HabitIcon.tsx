import type { CSSProperties } from 'react';
import styles from './HabitIcon.module.css';

/** The habit's emoji on a soft circle of its colour. */
export function HabitIcon({
  icon,
  color,
  size = 44,
}: {
  icon: string;
  color: string;
  size?: number;
}) {
  const style = {
    '--habit-color': color,
    width: size,
    height: size,
    fontSize: size * 0.5,
  } as CSSProperties;
  return (
    <span className={styles.icon} style={style} aria-hidden="true">
      {icon}
    </span>
  );
}
