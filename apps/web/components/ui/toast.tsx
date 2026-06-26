'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 right-4 z-[200] flex flex-col gap-2 md:bottom-6 md:right-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'panel pointer-events-auto flex items-center gap-2.5 px-4 py-3 text-sm shadow-2xl animate-fade-in',
              t.type === 'error' && 'border-red-500/30',
            )}
          >
            {t.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-zen-teal" />
            )}
            <span className={t.type === 'error' ? 'text-red-200' : 'text-zinc-200'}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
