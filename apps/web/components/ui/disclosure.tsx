'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { DURATION, EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Accordéon — révélation progressive d'un contenu secondaire.
 *
 * La hauteur s'anime de 0 → auto (et inversement) avec un fondu, pour que
 * l'ouverture/fermeture soit fluide plutôt qu'un saut brutal du layout.
 */
export function Disclosure({
  title,
  hint,
  defaultOpen = false,
  children,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className={cn('overflow-hidden rounded-xl border border-line bg-surface-sunken', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-muted/60"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">{title}</span>
          {hint && <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: DURATION.fast, ease: EASE.out }}
          className="shrink-0 text-ink-subtle"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE.out }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-5 py-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
