import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, Loader2, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => string;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  loading: (message: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const STYLES: Record<ToastType, string> = {
  success: 'bg-sage-600 text-white',
  error: 'bg-burgundy-600 text-white',
  info: 'bg-chef text-white',
  loading: 'bg-chef-muted text-white',
};

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  loading: Loader2,
};

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 px-4 flex flex-col gap-3 pointer-events-none max-w-lg mx-auto">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-4 rounded-2xl shadow-lg min-h-[52px] ${STYLES[t.type]}`}
            role="status"
          >
            <Icon size={22} className={t.type === 'loading' ? 'animate-spin shrink-0' : 'shrink-0'} />
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            {t.type !== 'loading' && (
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 p-2 -mr-1 rounded-full hover:bg-white/20 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    if (type !== 'loading') {
      setTimeout(() => dismiss(id), 4000);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((message: string) => { toast(message, 'success'); }, [toast]);
  const error = useCallback((message: string) => { toast(message, 'error'); }, [toast]);
  const info = useCallback((message: string) => { toast(message, 'info'); }, [toast]);
  const loading = useCallback((message: string) => toast(message, 'loading'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, loading, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
