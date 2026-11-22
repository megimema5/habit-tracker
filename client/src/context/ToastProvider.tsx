import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../components/ui';
import { cn } from '../utils/cn';
import { ToastContext, type Toast, type ToastVariant } from './toastContext';
import styles from './ToastProvider.module.css';

const AUTO_DISMISS_MS = 4000;
const MAX_TOASTS = 3;

const ICONS: Record<ToastVariant, 'check' | 'alert' | 'info'> = {
  success: 'check',
  error: 'alert',
  info: 'info',
};

/**
 * Global toast notifications. Any component or hook can call
 *   const { showToast } = useToast();
 *   showToast('Habit created', 'success');
 *
 * Toasts are announced to screen readers (aria-live) and disappear after 4 seconds.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant }].slice(-MAX_TOASTS));
      window.setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className={styles.region} role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={cn(styles.toast, styles[toast.variant])}>
              <Icon name={ICONS[toast.variant]} size={18} className={styles.icon} />
              <p className={styles.message}>{toast.message}</p>
              <button
                type="button"
                className={styles.close}
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
