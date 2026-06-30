import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PackSlotsBadge({
  remaining,
  max,
  soldOut,
  size = 'sm',
}: {
  remaining: number;
  max: number;
  soldOut: boolean;
  size?: 'sm' | 'md';
}) {
  const title = soldOut
    ? `Ce territoire a atteint la limite de ${max} achats à l'unité. L'abonnement débloque tout.`
    : `${remaining} achat${remaining > 1 ? 's' : ''} à l'unité restant${remaining > 1 ? 's' : ''} sur ${max} (limite pour éviter la sur-exposition commerciale).`;

  if (soldOut) {
    return (
      <span
        title={title}
        className={cn(
          'inline-flex cursor-help items-center gap-1 rounded border border-warning-border bg-warning-soft font-semibold text-warning-text',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]',
        )}
      >
        <Users className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5' } />
        Places épuisées
      </span>
    );
  }

  if (remaining <= 1) {
    return (
      <span
        title={title}
        className={cn(
          'inline-flex cursor-help items-center gap-1 rounded border border-warning-border bg-warning-soft font-semibold text-warning-text',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]',
        )}
      >
        <Users className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5' } />
        {remaining} place restante
      </span>
    );
  }

  return (
    <span
      title={title}
      className={cn(
        'inline-flex cursor-help items-center gap-1 rounded border border-line bg-surface-sunken font-medium text-ink-muted',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]',
      )}
    >
      <Users className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5' } />
      {remaining} places dispo
    </span>
  );
}
