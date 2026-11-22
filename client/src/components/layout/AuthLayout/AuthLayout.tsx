import { Outlet } from 'react-router-dom';
import { Logo } from '../Logo';
import styles from './AuthLayout.module.css';

/** Centered card for the login and register pages. */
export function AuthLayout() {
  return (
    <main className={styles.page}>
      <div className={styles.logo}>
        <Logo />
      </div>
      <div className={styles.card}>
        <Outlet />
      </div>
      <p className={styles.tagline}>Small steps, every day.</p>
    </main>
  );
}
