import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from './toastContext';

/** Show a toast from anywhere inside <ToastProvider>. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
