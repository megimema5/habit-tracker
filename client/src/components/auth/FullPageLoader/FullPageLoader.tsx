import { Spinner } from '../../ui';
import styles from './FullPageLoader.module.css';

/** Shown for the split second while the app asks the server "who is logged in?". */
export function FullPageLoader() {
  return (
    <div className={styles.loader}>
      <Spinner size={32} label="Loading your account" />
    </div>
  );
}
