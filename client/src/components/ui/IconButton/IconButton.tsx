import type { ComponentProps } from 'react';
import { cn } from '../../../utils/cn';
import { Icon, type IconName } from '../Icon';
import styles from './IconButton.module.css';

interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  icon: IconName;
  /** Required: icon-only buttons need a text label for screen readers (and a tooltip). */
  label: string;
  variant?: 'ghost' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(styles.button, styles[variant], styles[size], className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 20} />
    </button>
  );
}
