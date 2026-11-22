import { useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { useToast } from '../../../context/useToast';
import { Icon } from '../../ui';
import styles from './UserMenu.module.css';

/** Shows who is logged in, with a logout button. */
export function UserMenu() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      showToast('You have been logged out.', 'info');
    } catch {
      // useLogout already cleared the local session even if the request failed.
      showToast('Logged out on this device.', 'info');
    }
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className={styles.menu}>
      <span className={styles.avatar} aria-hidden="true">
        {initial}
      </span>
      <span className={styles.name}>{user.name}</span>
      <button
        type="button"
        className={styles.logout}
        onClick={() => void handleLogout()}
        disabled={loggingOut}
        aria-label="Log out"
        title="Log out"
      >
        <Icon name="logout" size={18} />
        <span className={styles.logoutText}>Log out</span>
      </button>
    </div>
  );
}
