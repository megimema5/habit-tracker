import { useCallback, useState } from 'react';

export interface Disclosure {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Open/close state for modals, menus and dialogs:
 *   const confirm = useDisclosure();
 *   <Button onClick={confirm.open}>Delete</Button>
 *   <ConfirmDialog isOpen={confirm.isOpen} onCancel={confirm.close} … />
 */
export function useDisclosure(initial = false): Disclosure {
  const [isOpen, setIsOpen] = useState(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((value) => !value), []);
  return { isOpen, open, close, toggle };
}
