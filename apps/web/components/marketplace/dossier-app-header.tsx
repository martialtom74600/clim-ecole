'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { MarketplacePack } from '@/lib/types';
import { COPY } from '@/lib/copy';
import { PRICING, priceLabel } from '@/lib/pricing';
import { PERSONAS } from '@/lib/brand';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import { WatchlistButton } from '@/components/marketplace/watchlist-button';
import { CheckoutButton } from '@/components/marketplace/checkout-button';
import { cn } from '@/lib/utils';

/**
 * En-tête du dossier — titre + actions essentielles.
 * Métadonnées (EPCI, MAJ) et comparateur relégués au pied de page.
 * CTA déblocage visible en permanence quand verrouillé.
 */
export function DossierAppHeader({
  pack,
  unlocked,
  communesLabel,
  nomEpci,
  soldOut = false,
}: {
  pack: MarketplacePack;
  unlocked: boolean;
  communesLabel?: string;
  nomEpci?: string;
  soldOut?: boolean;
}) {
  const title =
    communesLabel?.split(',')[0]?.trim() ||
    communesLabel ||
    nomEpci ||
    pack.publicName;

  const primaryPersona = pack.personas[0];

  return (
    <header className="flex min-w-0 items-center gap-3 border-b border-line/30 py-2">
      <Link
        href="/explorer"
        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
        aria-label={COPY.backToExplorer}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight text-ink md:text-xl">
            {title}
          </h1>
        </div>
        <p className="truncate text-[11px] text-ink-subtle">
          {pack.department} · {pack.batimentCount} écoles
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <RadarScoreBadge
          score={pack.radarScore}
          grade={pack.radarGrade}
          previewOnly={!unlocked}
          className="hidden sm:flex"
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
            'hidden rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:inline',
            unlocked
              ? 'bg-positive text-white'
              : 'border border-line bg-surface-sunken text-ink-muted',
          )}
        >
          {unlocked ? 'Débloqué' : 'Aperçu'}
        </span>
        <WatchlistButton packId={pack.packId} />

        {!unlocked && (
          <CheckoutButton
            plan="dossier"
            packId={pack.packId}
            disabled={soldOut}
            className="btn-primary !px-3 !py-1.5 !text-xs"
          >
            {soldOut ? 'Complet' : `Débloquer · ${priceLabel(PRICING.dossier)}`}
          </CheckoutButton>
        )}
      </div>
    </header>
  );
}
