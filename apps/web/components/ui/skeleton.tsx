import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Placeholder de chargement.
 *
 * S'appuie sur l'utilitaire `.skeleton` (globals.css) : fond `surface-muted`
 * + balayage shimmer calibré pour le thème clair. Les classes de taille et de
 * forme (h-*, w-*, rounded-*) passées via `className` priment.
 */
function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton', className)} {...props} />;
}

export { Skeleton };
