'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { DURATION, EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Infobulle d'aide — popover sombre haute lisibilité.
 *
 * S'ouvre au survol et reste épinglée au clic. Se ferme au clic extérieur
 * ou avec Échap. Entrée scale + fondu depuis le point d'ancrage (framer-motion,
 * neutralisée automatiquement si « réduire les animations »).
 */
export function InfoTip({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const open = pinned || hovered;

  useEffect(() => {
    if (!pinned) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPinned(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setPinned(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [pinned]);

  return (
    <span
      ref={ref}
      className={cn('relative inline-flex items-center gap-1.5', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <button
        type="button"
        aria-label={`Aide : ${label}`}
        aria-expanded={open}
        onClick={() => setPinned((v) => !v)}
        className={cn(
          'inline-flex rounded-md p-0.5 text-ink-subtle transition-colors hover:text-ink',
          open && 'text-ink',
        )}
      >
        <HelpCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: DURATION.fast, ease: EASE.out }}
            style={{ originY: 1 }}
            className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-64 rounded-xl bg-ink px-4 py-3 text-sm font-normal normal-case leading-relaxed tracking-normal text-white shadow-overlay"
          >
            {label}
            {/* Flèche */}
            <span className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 rounded-[2px] bg-ink" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
