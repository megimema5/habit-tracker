import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { IconButton } from '../IconButton';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Buttons at the bottom (e.g. Cancel / Save). */
  footer?: ReactNode;
  size?: 'sm' | 'md';
}

/**
 * Accessible modal built on the native <dialog> element. `showModal()` gives us for free:
 * - a focus trap (Tab stays inside the dialog)
 * - Esc to close
 * - the rest of the page made inert for screen readers
 * - focus returned to the button that opened it
 * Forms additionally get focus in their first field.
 *
 * Children are only rendered while open, so forms inside start fresh every time.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      // showModal() focuses the first focusable element (the ✕ button). In a form, the first
      // field is the more useful place to start typing — move focus there if there is one.
      dialog
        .querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([type="radio"]), select, textarea',
        )
        ?.focus();
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(styles.dialog, styles[size])}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Esc: let React state decide, so the dialog and isOpen never get out of sync.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // A click on the dark backdrop lands on the <dialog> itself, not on its content.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {isOpen && (
        <div className={styles.content}>
          <header className={styles.header}>
            <div>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              )}
            </div>
            <IconButton icon="close" label="Close" size="sm" onClick={onClose} />
          </header>
          {children && <div className={styles.body}>{children}</div>}
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
