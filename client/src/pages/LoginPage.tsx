import { Link, useLocation } from 'react-router-dom';
import { AuthForm } from '../components/auth';
import styles from './AuthPage.module.css';
import { useDocumentTitle } from '../hooks/common/useDocumentTitle';

export function LoginPage() {
  useDocumentTitle('Log in');
  const location = useLocation();
  return (
    <>
      <h1 className={styles.title}>Welcome back</h1>
      <p className={styles.subtitle}>Log in to keep your streaks going.</p>
      <AuthForm mode="login" />
      <p className={styles.switch}>
        No account yet?{' '}
        {/* Pass the "from" page along, so registering also returns the user there. */}
        <Link to="/register" state={location.state as unknown}>
          Create one
        </Link>
      </p>
    </>
  );
}
