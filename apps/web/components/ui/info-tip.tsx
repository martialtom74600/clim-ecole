'use client';

import { useEffect, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InfoTip({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <span ref={ref} className={cn('group/tip relative inline-flex items-center gap-1.5', className)}>
      {children}
      <button
        type="button"
        aria-label={`Aide : ${label}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex rounded-md p-0.5 text-zinc-600 transition-colors hover:text-zen-teal',
          open && 'text-zen-teal',
        )}
      >
        <HelpCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
      </button>
      <span
        role="tooltip"
        className={cn(
          'absolute bottom-[calc(100%+8px)] left-0 z-50 w-64 rounded-xl border border-white/[0.1] bg-zen-elevated px-4 py-3 text-sm font-normal normal-case leading-relaxed tracking-normal text-zinc-300 shadow-xl transition-opacity duration-150',
          'pointer-events-none opacity-0 group-hover/tip:opacity-100',
          open && 'pointer-events-auto opacity-100',
        )}
      >
        {label}
      </span>
    </span>
  );
}
