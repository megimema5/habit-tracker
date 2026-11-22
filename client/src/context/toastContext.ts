import { createContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: number) => void;
}

/** Kept in its own file so ToastProvider.tsx only exports a component (fast refresh rule). */
export const ToastContext = createContext<ToastContextValue | null>(null);
