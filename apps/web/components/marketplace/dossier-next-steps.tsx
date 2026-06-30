'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import type { MarketplacePack } from '@/lib/types';
import { getWatchlist } from '@/lib/radar-client-storage';
import { useAccountPreferences } from '@/hooks/use-account-preferences';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import { TerritoryAlertCapture } from '@/components/marketplace/territory-alert-capture';
import { cn } from '@/lib/utils';

/**
 * Filet anti cul-de-sac affiché sous le paywall : un visiteur qui n'achète pas
 * (ou tombe sur un territoire complet) repart avec trois sorties — suivre le
 * territoire, se faire alerter, ou rebondir sur un territoire similaire.
 */
export function DossierNextSteps({
  pack,
  similarPacks,
  soldOut = false,
  className,
}: {
  pack: MarketplacePack;
  similarPacks?: MarketplacePack[];
  soldOut?: boolean;
  className?: string;
}) {
  const { prefs, toggleWatchlist } = useAccountPreferences();
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const list = prefs.watchlist.length ? prefs.watchlist : getWatchlist();
    setFollowing(list.includes(pack.packId));
  }, [pack.packId, prefs.watchlist]);

  return (
    <div className={cn('rounded-2xl border border-line bg-surface-sunken p-5', className)}>
      <p className="text-sm font-semibold text-ink">
        {soldOut ? 'Ce territoire est complet à l’unité' : 'Avant de partir'}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
        {soldOut
          ? 'Gardez-le à l’œil et explorez les territoires voisins encore disponibles.'
          : 'Ne perdez pas ce territoire de vue — et voyez où prospecter ensuite.'}
      </p>

      <button
        type="button"
        onClick={() => {
          const next = toggleWatchlist(pack.packId);
          setFollowing(next.includes(pack.packId));
        }}
        className={cn(
          'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
          following
            ? 'border-warning-border bg-warning-soft text-warning-text'
            : 'border-line bg-white text-ink hover:border-ink/30',
        )}
      >
        <Star className={cn('h-4 w-4', following && 'fill-current')} />
        {following ? 'Territoire suivi' : 'Suivre ce territoire'}
      </button>

      <TerritoryAlertCapture pack={pack} className="mt-3" />

      {similarPacks && similarPacks.length > 0 && (
        <div className="mt-5">
          <p className="label-caps mb-2.5">Territoires similaires</p>
          <ul className="space-y-2">
            {similarPacks.map((p) => (
              <li key={p.packId}>
                <Link
                  href={`/explorer/${p.packId}`}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-white p-3 transition-colors hover:border-ink/30"
                >
                  <RadarScoreBadge score={p.radarScore} grade={p.radarGrade} size="sm" previewOnly />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{p.publicName}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {p.publicZone} · {p.budgetRange}
                      {p.soldOut
                        ? ' · complet'
                        : p.slotsRemaining <= 2
                          ? ` · ${p.slotsRemaining} place${p.slotsRemaining > 1 ? 's' : ''}`
                          : ''}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
