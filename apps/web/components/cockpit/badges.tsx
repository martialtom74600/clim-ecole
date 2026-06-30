import { cn } from '@/lib/utils';
import type { ClosingLevel } from '@/lib/types';
import { dpeBgClass, dpeTextClass, dpeLetter } from '@/lib/dpe-colors';

const STYLES: Record<ClosingLevel, string> = {
  chaud: 'bg-zen-teal/15 text-zen-teal',
  tiede: 'bg-warning-soft text-warning-text',
  froid: 'bg-info-soft text-info-text',
};

export function TemperatureBadge({
  label,
  level,
  className,
}: {
  label: string;
  level?: ClosingLevel;
  className?: string;
}) {
  const style = level ? STYLES[level] : 'bg-surface-muted text-zen-muted';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium tabular-nums',
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}

export function StatutProjetBadge({ statut }: { statut: string }) {
  if (statut === 'PROJET_GLOBAL_VALIDE') {
    return (
      <span
        className="rounded-lg bg-zen-teal/15 px-2.5 py-1 text-xs font-semibold text-zen-teal"
        title="Budget pack suffisant pour lancer"
      >
        Pack prêt
      </span>
    );
  }
  if (statut === 'SOUS_SEUIL_A_CREUSER') {
    return (
      <span
        className="rounded-lg bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning-text"
        title="Il faut peut-être regrouper plus d’écoles"
      >
        À grouper
      </span>
    );
  }
  return (
    <span className="rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-medium text-zen-muted">
      {statut.replace(/_/g, ' ')}
    </span>
  );
}

export function DpeBadge({ classe }: { classe: string }) {
  const letter = dpeLetter(classe);

  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-sm font-bold',
        dpeBgClass(classe),
        dpeTextClass(classe),
      )}
    >
      {letter}
    </span>
  );
}
