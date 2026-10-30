import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = nextId.current++;
      setToasts((all) => [...all, { id, type, message }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      showToast,
      success: (m: string) => showToast(m, 'success'),
      error: (m: string) => showToast(m, 'error'),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-label="Notifications">
        {toasts.map((t) => (
          // role="alert" announces errors immediately; role="status" is polite for success/info.
          <div key={t.id} className={`toast toast-${t.type}`} role={t.type === 'error' ? 'alert' : 'status'} data-testid="toast">
            <span className="toast-message">{t.message}</span>
            <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
