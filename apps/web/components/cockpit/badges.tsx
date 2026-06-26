import { cn } from '@/lib/utils';
import type { ClosingLevel } from '@/lib/types';

const STYLES: Record<ClosingLevel, string> = {
  chaud: 'bg-zen-teal/15 text-zen-teal',
  tiede: 'bg-amber-500/15 text-amber-300',
  froid: 'bg-sky-500/15 text-sky-300',
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
  const style = level ? STYLES[level] : 'bg-white/5 text-zen-muted';

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
        className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300"
        title="Il faut peut-être regrouper plus d’écoles"
      >
        À grouper
      </span>
    );
  }
  return (
    <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-zen-muted">
      {statut.replace(/_/g, ' ')}
    </span>
  );
}

export function DpeBadge({ classe }: { classe: string }) {
  const letter = classe?.charAt(0)?.toUpperCase() ?? '?';
  const colors: Record<string, string> = {
    A: 'text-emerald-400',
    B: 'text-lime-400',
    C: 'text-yellow-400',
    D: 'text-amber-400',
    E: 'text-orange-400',
    F: 'text-red-400',
    G: 'text-rose-400',
  };

  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-zen-bg text-sm font-bold',
        colors[letter] ?? 'text-zen-muted',
      )}
    >
      {letter}
    </span>
  );
}
