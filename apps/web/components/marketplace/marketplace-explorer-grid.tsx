'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Flame,
  GitCompare,
  HardHat,
  Landmark,
  LayoutGrid,
  Ruler,
  Sparkles,
  Star,
} from 'lucide-react';
import type { ClientPersona, MarketplacePack } from '@/lib/types';
import { packMatchesPersonaFilter } from '@/lib/persona-engine';
import { packMatchesExplorerFilter } from '@/lib/curated-deals';
import { PersonaBadgeGroup } from '@/components/brand/personas';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import { WatchlistButton } from '@/components/marketplace/watchlist-button';
import { PackSlotsBadge } from '@/components/marketplace/pack-slots-badge';
import { formatInt } from '@/lib/format';
import { PackBudgetLabel } from '@/components/marketplace/pack-budget-label';
import {
  getCompareList,
  getWatchlist,
  loadPersonaFilter,
  savePersonaFilter,
  toggleCompare,
} from '@/lib/radar-client-storage';
import { useEffect, useMemo, useState } from 'react';

type PersonaFilter = ClientPersona | 'all' | 'qualified' | 'watchlist';

const PERSONA_TABS: { id: PersonaFilter; label: string; icon?: typeof HardHat }[] = [
  { id: 'qualified', label: 'Deals qualifiés', icon: Sparkles },
  { id: 'all', label: 'Tous', icon: LayoutGrid },
  { id: 'btp', label: 'Profil BTP', icon: HardHat },
  { id: 'be', label: 'Profil BE', icon: Ruler },
  { id: 'amo', label: 'Profil AMO', icon: Landmark },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
];

export function MarketplaceExplorerGrid({
  packs,
  qualifiedCount,
}: {
  packs: MarketplacePack[];
  qualifiedCount: number;
}) {
  const [filter, setFilter] = useState<PersonaFilter>('qualified');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [watchIds, setWatchIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = loadPersonaFilter();
    if (saved && PERSONA_TABS.some((t) => t.id === saved)) {
      setFilter(saved as PersonaFilter);
    }
    setCompareIds(getCompareList());
    setWatchIds(getWatchlist());
  }, []);

  function changeFilter(f: PersonaFilter) {
    setFilter(f);
    savePersonaFilter(f);
  }

  const filtered = useMemo(() => {
    return packs.filter((p) => {
      if (filter === 'watchlist') return watchIds.includes(p.packId);
      if (filter === 'qualified') return packMatchesExplorerFilter(p, 'qualified', watchIds);
      if (filter === 'all') return true;
      return packMatchesPersonaFilter(p.personas, filter);
    });
  }, [packs, filter, watchIds]);

  return (
    <div className="space-y-8">
      <header className="animate-fade-in-up">
        <p className="label-caps">Explorateur · France</p>
        <h1 className="mt-3 text-display-md font-semibold text-slate-900 md:text-display-lg">
          Signaux de prospection
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          {qualifiedCount} territoires qualifiés (score B+, CAPEX &gt; 400 k€) — triés par potentiel Radar.
        </p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedTabs tabs={PERSONA_TABS} value={filter} onChange={changeFilter} />
        <div className="flex items-center gap-3">
          {compareIds.length > 0 && (
            <Link
              href={`/explorer/compare?ids=${compareIds.join(',')}`}
              className="btn-secondary !py-2 !text-sm"
            >
              <GitCompare className="h-4 w-4" />
              Comparer ({compareIds.length})
            </Link>
          )}
          <span className="text-sm tabular-nums text-slate-500">
            {filtered.length} signal{filtered.length > 1 ? 'aux' : ''}
          </span>
        </div>
      </div>

      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5">Score</th>
              <th className="px-5 py-3.5">Profils</th>
              <th className="px-5 py-3.5">Collectivité</th>
              <th className="px-5 py-3.5">Département</th>
              <th className="px-5 py-3.5 text-right">Tranche budget</th>
              <th className="px-5 py-3.5 text-right">Financement</th>
              <th className="px-5 py-3.5 text-right">Écoles</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((pack) => (
              <tr key={pack.packId} className="group hover:bg-slate-50/80">
                <td className="px-5 py-4">
                  <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} size="sm" previewOnly />
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <PersonaBadgeGroup personas={pack.personas} />
                    {pack.isNew && <span className="badge-new">Nouveau</span>}
                    {pack.isHot && (
                      <span className="badge-hot">
                        <Flame className="h-3 w-3" />
                      </span>
                    )}
                    <PackSlotsBadge
                      remaining={pack.slotsRemaining}
                      max={pack.slotsMax}
                      soldOut={pack.soldOut}
                    />
                  </div>
                </td>
                <td className="px-5 py-4 font-medium text-slate-900">{pack.publicName}</td>
                <td className="px-5 py-4 text-slate-600">{pack.department}</td>
                <td className="px-5 py-4 text-right font-bold">
                  <PackBudgetLabel rangeLabel={pack.budgetRange} capex={pack.packCapexTotal} className="font-bold text-emerald-600" />
                </td>
                <td className="px-5 py-4 text-right text-sm text-radar-muted">
                  Après achat
                </td>
                <td className="px-5 py-4 text-right tabular-nums text-slate-600">
                  {formatInt(pack.batimentCount)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <WatchlistButton packId={pack.packId} />
                    <CompareToggle
                      packId={pack.packId}
                      active={compareIds.includes(pack.packId)}
                      onToggle={() => setCompareIds(toggleCompare(pack.packId))}
                    />
                    <Link
                      href={`/explorer/${pack.packId}`}
                      className="btn-primary !px-4 !py-2 !text-sm whitespace-nowrap"
                    >
                      Analyser
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((pack) => (
          <Link
            key={pack.packId}
            href={`/explorer/${pack.packId}`}
            className="card panel-hover block p-5"
          >
            <div className="flex items-center justify-between">
              <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} size="sm" />
              <WatchlistButton packId={pack.packId} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <PersonaBadgeGroup personas={pack.personas} />
              {pack.isNew && <span className="badge-new">Nouveau</span>}
              <PackSlotsBadge
                remaining={pack.slotsRemaining}
                max={pack.slotsMax}
                soldOut={pack.soldOut}
              />
            </div>
            <p className="mt-3 font-semibold text-slate-900">{pack.publicName}</p>
            <p className="text-xs text-slate-500">{pack.department}</p>
            <p className="mt-3 font-bold text-emerald-600">
              <PackBudgetLabel rangeLabel={pack.budgetRange} capex={pack.packCapexTotal} className="font-bold text-emerald-600" />
            </p>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card py-16 text-center">
          <p className="text-slate-500">Aucun signal pour ce filtre.</p>
          <button type="button" onClick={() => changeFilter('all')} className="btn-ghost mt-3">
            Voir tous les territoires
          </button>
        </div>
      )}
    </div>
  );
}

function CompareToggle({
  packId,
  active,
  onToggle,
}: {
  packId: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Comparer"
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      className={`rounded-lg border p-2 ${active ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 text-slate-400'}`}
    >
      <GitCompare className="h-4 w-4" />
    </button>
  );
}
