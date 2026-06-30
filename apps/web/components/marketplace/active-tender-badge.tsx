'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActiveTenderBadge({
  title,
  className,
  size = 'md',
}: {
  title?: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-warning-border bg-warning-soft font-semibold text-warning-text',
        'animate-pulse',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        className,
      )}
      title={title ?? 'Appel d\'offres public actif détecté sur ce territoire'}
    >
      <AlertTriangle className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />
      Statut AO : Actif
    </span>
  );
}
