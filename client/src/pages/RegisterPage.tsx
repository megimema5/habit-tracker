import { Link, useLocation } from 'react-router-dom';
import { AuthForm } from '../components/auth';
import styles from './AuthPage.module.css';
import { useDocumentTitle } from '../hooks/common/useDocumentTitle';

export function RegisterPage() {
  useDocumentTitle('Create account');
  const location = useLocation();
  return (
    <>
      <h1 className={styles.title}>Create your account</h1>
      <p className={styles.subtitle}>Start building habits in less than a minute.</p>
      <AuthForm mode="register" />
      <p className={styles.switch}>
        Already have an account?{' '}
        <Link to="/login" state={location.state as unknown}>
          Log in
        </Link>
      </p>
    </>
  );
}
