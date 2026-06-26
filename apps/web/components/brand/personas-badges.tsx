import { cn } from '@/lib/utils';
import type { ClientPersona } from '@/lib/brand';
import { PERSONAS } from '@/lib/brand';

export function PersonaBadge({ persona, size: _size, className }: { persona: ClientPersona; size?: 'sm' | 'md'; className?: string }) {
  const p = PERSONAS[persona];
  return (
    <span
      title={`${p.label} — ${p.description}`}
      className={cn('badge-persona cursor-help', className)}
    >
      {p.shortLabel}
    </span>
  );
}

export function PersonaBadgeGroup({ personas, className }: { personas: ClientPersona[]; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span className={cn('inline-flex gap-1.5', className)}>
      {personas.map((p) => <PersonaBadge key={p} persona={p} />)}
    </span>
  );
}
