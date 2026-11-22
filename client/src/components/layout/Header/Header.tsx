import { Link } from 'react-router-dom';
import { useToday } from '../../../hooks/common/useToday';
import { formatDay } from '../../../utils/dates';
import { Logo } from '../Logo';
import { NavBar } from '../NavBar';
import { UserMenu } from '../UserMenu';
import styles from './Header.module.css';

/** Top bar: logo, main navigation, today's date and the logged-in user. */
export function Header() {
  const today = useToday();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.home} aria-label="Habit Tracker home">
          <Logo />
        </Link>
        <NavBar className={styles.nav} />
        <p className={styles.date}>
          <time dateTime={today}>
            {formatDay(today, { weekday: 'short', day: 'numeric', month: 'short' })}
          </time>
        </p>
        <UserMenu />
      </div>
    </header>
  );
}
