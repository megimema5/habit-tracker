import styles from './Logo.module.css';

/** App mark + name. */
export function Logo() {
  return (
    <span className={styles.logo}>
      <span className={styles.mark} aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className={styles.name}>Habit Tracker</span>
    </span>
  );
}
