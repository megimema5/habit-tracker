import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../../ui';
import { cn } from '../../../utils/cn';
import styles from './NavBar.module.css';

const LINKS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Today', icon: 'today', end: true },
  { to: '/habits', label: 'Habits', icon: 'list' },
  { to: '/stats', label: 'Stats', icon: 'chart' },
];

/**
 * Main navigation. Inline in the header on desktop, a bottom tab bar on phones.
 * NavLink adds aria-current="page" to the active link automatically.
 */
export function NavBar({ className }: { className?: string }) {
  return (
    <nav className={cn(styles.nav, className)} aria-label="Main">
      <ul className={styles.list} role="list">
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) => cn(styles.link, isActive && styles.active)}
            >
              <Icon name={link.icon} size={20} />
              <span>{link.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
