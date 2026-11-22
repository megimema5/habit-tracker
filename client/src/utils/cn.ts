/**
 * Joins class names, skipping falsy values:
 *   cn(styles.button, isActive && styles.active, className)
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
