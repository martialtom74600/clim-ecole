'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { DURATION, EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';

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
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: DURATION.base, ease: EASE.out }}
              className={cn(
                'pointer-events-auto flex items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-sm shadow-overlay',
                t.type === 'error' && 'border-heat-border',
              )}
            >
              {t.type === 'error' ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-heat-text" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" />
              )}
              <span className={t.type === 'error' ? 'text-heat-text' : 'text-ink-soft'}>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
