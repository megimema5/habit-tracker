import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';
import { useDocumentTitle } from '../hooks/common/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <main className={styles.page}>
      <p className={styles.code}>404</p>
      <h1>Page not found</h1>
      <p className={styles.text}>The page you are looking for doesn’t exist or was moved.</p>
      <Link to="/" className={styles.link}>
        Go to today
      </Link>
    </main>
  );
}
