'use client';

import Link from 'next/link';
import { ArrowLeft, GitCompare } from 'lucide-react';
import type { MarketplacePack } from '@/lib/types';
import { decodePackId } from '@/lib/pack-id';
import { COPY } from '@/lib/copy';
import { formatDateFr } from '@/lib/format';
import { PERSONAS } from '@/lib/brand';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import { WatchlistButton } from '@/components/marketplace/watchlist-button';
import { useAccountPreferences } from '@/hooks/use-account-preferences';
import { cn } from '@/lib/utils';

/**
 * En-tête du dossier — zone H1 à gauche, actions à droite.
 * Padding géré par le parent (sticky wrapper max-w-7xl).
 * Structure spatiale identique aux en-têtes Compte et Explorateur.
 */
export function DossierAppHeader({
  pack,
  unlocked,
  communesLabel,
  nomEpci,
  dataLoadedAt,
}: {
  pack: MarketplacePack;
  unlocked: boolean;
  communesLabel?: string;
  nomEpci?: string;
  dataLoadedAt?: string;
}) {
  const title =
    communesLabel?.split(',')[0]?.trim() ||
    communesLabel ||
    nomEpci ||
    pack.publicName;

  const epciCode = decodePackId(pack.packId);
  const { prefs, toggleCompare } = useAccountPreferences();
  const inCompare = prefs.compareIds.includes(pack.packId);

  const primaryPersona = pack.personas[0];

  return (
    /* Pas de bg/px propres : le parent sticky fournit le fond et le padding */
    <header className="flex min-w-0 items-center gap-3 border-b border-line/30 py-2">

      {/* Retour — zone méta (breadcrumb) */}
      <Link
        href="/explorer"
        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
        aria-label={COPY.backToExplorer}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </Link>

      {/* Zone H1 */}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight text-ink md:text-xl">
            {title}
          </h1>
          {epciCode && (
            <span
              className="hidden shrink-0 font-mono text-[10px] text-ink-subtle sm:inline"
              title="Identifiant officiel de l'intercommunalité"
            >
              N° {epciCode}
            </span>
          )}
        </div>
        <p className="truncate text-[11px] text-ink-subtle">
          {pack.department} · {pack.batimentCount} écoles
          {dataLoadedAt && ` · MAJ ${formatDateFr(dataLoadedAt)}`}
        </p>
      </div>

      {/* Zone actions — droite */}
      <div className="flex shrink-0 items-center gap-1.5">
        <RadarScoreBadge
          score={pack.radarScore}
          grade={pack.radarGrade}
          previewOnly={!unlocked}
        />
        {primaryPersona && (
          <span
            title={PERSONAS[primaryPersona].label}
            className="hidden rounded-md border border-line bg-surface-muted px-1.5 py-0.5 text-[10px] font-bold text-ink-soft sm:inline"
          >
            {PERSONAS[primaryPersona].shortLabel}
          </span>
        )}
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
            unlocked
              ? 'bg-positive text-white'
              : 'border border-line bg-surface-sunken text-ink-muted',
          )}
        >
          {unlocked ? 'Débloqué' : 'Aperçu'}
        </span>
        <WatchlistButton packId={pack.packId} />
        <button
          type="button"
          title={COPY.compare}
          aria-label={COPY.compare}
          onClick={() => toggleCompare(pack.packId)}
          className={cn(
            'inline-flex items-center justify-center rounded-lg border p-1.5 transition-all duration-200 ease-out',
            inCompare
              ? 'border-ink bg-ink text-white'
              : 'border-line text-ink-subtle hover:border-ink-faint hover:text-ink',
          )}
        >
          <GitCompare className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
