import { Outlet } from 'react-router-dom';
import { DailyReminderModal } from '../../reminders';
import { Header } from '../Header';
import styles from './AppLayout.module.css';

/**
 * Frame for every logged-in page: skip link, header + navigation, the page itself,
 * and the daily reminder (so it appears whichever page the app is opened on).
 */
export function AppLayout() {
  return (
    <div className={styles.app}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <Header />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <DailyReminderModal />
    </div>
  );
}
