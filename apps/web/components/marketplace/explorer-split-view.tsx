'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Flame,
  GitCompare,
  HardHat,
  Landmark,
  LayoutGrid,
  List,
  Map,
  Ruler,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { COPY, PERSONA_FILTER_LABELS } from '@/lib/copy';
import type { ClientPersona, MarketplacePack } from '@/lib/types';
import { parseDepartmentCode } from '@/lib/geo';
import { buildDepartmentMarkers } from '@/lib/map-departments';
import { packMatchesPersonaFilter } from '@/lib/persona-engine';
import { packMatchesExplorerFilter } from '@/lib/curated-deals';
import { PersonaBadgeGroup } from '@/components/brand/personas';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import { WatchlistButton } from '@/components/marketplace/watchlist-button';
import { PackSlotsBadge } from '@/components/marketplace/pack-slots-badge';
import { RadarMapClient } from '@/components/map/radar-map-client';
import { formatInt } from '@/lib/format';
import { PackBudgetLabel } from '@/components/marketplace/pack-budget-label';
import { ActiveTenderBadge } from '@/components/marketplace/active-tender-badge';
import {
  getCompareList,
  getWatchlist,
  loadPersonaFilter,
  savePersonaFilter,
  toggleCompare,
} from '@/lib/radar-client-storage';
import { EXPLORER_GUIDE } from '@/lib/site-guide';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';

type PersonaFilter = ClientPersona | 'all' | 'qualified' | 'watchlist';

const PERSONA_TABS: { id: PersonaFilter; label: string; hint?: string; icon?: typeof HardHat }[] = [
  { id: 'all', label: COPY.filterAll, icon: LayoutGrid },
  { id: 'qualified', label: COPY.filterQualified, hint: COPY.qualifiedCriteria, icon: Sparkles },
  { id: 'btp', label: PERSONA_FILTER_LABELS.btp.short, hint: PERSONA_FILTER_LABELS.btp.long, icon: HardHat },
  { id: 'be', label: PERSONA_FILTER_LABELS.be.short, hint: PERSONA_FILTER_LABELS.be.long, icon: Ruler },
  { id: 'amo', label: PERSONA_FILTER_LABELS.amo.short, hint: PERSONA_FILTER_LABELS.amo.long, icon: Landmark },
  { id: 'watchlist', label: COPY.filterFavorites, icon: Star },
];

export function ExplorerSplitView({
  packs,
  qualifiedCount,
  coverageBadge = 'France',
}: {
  packs: MarketplacePack[];
  qualifiedCount: number;
  coverageBadge?: string;
}) {
  const [filter, setFilter] = useState<PersonaFilter>('all');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [watchIds, setWatchIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);

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

  const personaFiltered = useMemo(() => {
    return packs.filter((p) => {
      if (filter === 'watchlist') return watchIds.includes(p.packId);
      if (filter === 'qualified') return packMatchesExplorerFilter(p, 'qualified', watchIds);
      if (filter === 'all') return true;
      return packMatchesPersonaFilter(p.personas, filter);
    });
  }, [packs, filter, watchIds]);

  const departmentMarkers = useMemo(
    () => buildDepartmentMarkers(personaFiltered),
    [personaFiltered],
  );

  const filtered = useMemo(() => {
    if (!selectedDept) return personaFiltered;
    return personaFiltered.filter((p) => parseDepartmentCode(p.department) === selectedDept);
  }, [personaFiltered, selectedDept]);

  const mapSelectedDept = useMemo(() => {
    if (selectedId) {
      const pack = packs.find((p) => p.packId === selectedId);
      if (pack) return parseDepartmentCode(pack.department);
    }
    return selectedDept;
  }, [selectedId, selectedDept, packs]);

  const selectedPack = filtered.find((p) => p.packId === selectedId);

  function handleSelectPack(id: string | null) {
    setSelectedId(id);
    setListOpen(true);
  }

  function handleSelectDept(deptCode: string | null) {
    setSelectedDept((prev) => (deptCode && prev === deptCode ? null : deptCode));
    setSelectedId(null);
    setListOpen(true);
  }

  return (
    <div className="relative h-[calc(100svh-3.5rem)] min-h-[480px] w-full">
      {/* Carte plein écran */}
      <div className="absolute inset-0 z-0">
        <RadarMapClient
          departments={departmentMarkers}
          selectedId={mapSelectedDept}
          onSelect={handleSelectDept}
          fitOnLoad
        />
      </div>

      {/* Badge région */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 hidden md:block">
        <span className="rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-radar-muted shadow-sm backdrop-blur-sm">
          {coverageBadge} · {filtered.length} {COPY.territoryPlural}
        </span>
      </div>

      {/* Légende carte */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden rounded-lg border border-radar-border bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm md:block">
        <p className="text-[10px] font-medium uppercase tracking-wide text-radar-subtle">
          Vue par département · localisation précise après achat
        </p>
        <div className="mt-2 flex items-center gap-4 text-xs text-radar-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-radar-heat" /> {COPY.hot}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" /> Score A/B
          </span>
        </div>
      </div>

      {/* Panneau gauche : titre + filtres */}
      <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-col gap-3 md:max-w-xs">
        <div className="rounded-xl border border-radar-border bg-white/95 p-4 shadow-sm backdrop-blur-sm">
          <h1 className="text-lg font-semibold md:text-xl">{COPY.explorer}</h1>
          <p className="mt-1 text-sm text-radar-muted">
            Carte par département — tranches et priorité visibles, chiffres exacts et contacts après achat.
          </p>
          <p className="mt-2 text-xs text-radar-subtle">
            {filtered.length} dossier{filtered.length > 1 ? 's' : ''} · {qualifiedCount} prioritaires
            {selectedDept && (
              <button type="button" onClick={() => setSelectedDept(null)} className="ml-2 underline">
                Tous les départements
              </button>
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {PERSONA_TABS.map(({ id, label, hint, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={hint}
                onClick={() => changeFilter(id)}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                  filter === id ? 'chip-active' : 'chip !py-1',
                )}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {label}
              </button>
            ))}
          </div>

          {compareIds.length > 0 && (
            <Link
              href={`/explorer/compare?ids=${compareIds.join(',')}`}
              className="btn-secondary mt-3 inline-flex !py-1.5 !text-xs"
            >
              <GitCompare className="h-3.5 w-3.5" />
              {COPY.compare} ({compareIds.length})
            </Link>
          )}

          <details className="mt-3 rounded-lg border border-radar-border bg-radar-canvas/80">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-radar-muted">
              Comment lire cette carte · {EXPLORER_GUIDE.length} étapes
            </summary>
            <ol className="space-y-2 border-t border-radar-border px-3 py-3">
              {EXPLORER_GUIDE.map(({ step, title, description }) => (
                <li key={step} className="text-xs text-radar-muted">
                  <span className="font-semibold text-radar-text">
                    {step}. {title}
                  </span>
                  <span className="mt-0.5 block leading-relaxed">{description}</span>
                </li>
              ))}
            </ol>
          </details>
        </div>
      </div>

      {/* Toggle liste mobile */}
      <button
        type="button"
        onClick={() => setListOpen((o) => !o)}
        className="absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-radar-border bg-white px-4 py-2.5 text-sm font-medium shadow-md md:hidden"
      >
        {listOpen ? <Map className="h-4 w-4" /> : <List className="h-4 w-4" />}
        {listOpen ? 'Carte' : 'Liste'}
      </button>

      {/* Panneau liste — droite */}
      <div
        className={cn(
          'absolute z-20 flex flex-col border-radar-border bg-white shadow-lg transition-transform duration-300',
          'bottom-0 right-0 top-auto max-h-[55vh] w-full rounded-t-2xl border-t md:bottom-4 md:top-4 md:max-h-none md:w-[min(100%,380px)] md:rounded-xl md:border',
          listOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0',
        )}
      >
        {/* Poignée mobile */}
        <div className="flex justify-center py-2 md:hidden">
          <span className="h-1 w-10 rounded-full bg-radar-border" />
        </div>

        {/* Détail sélectionné */}
        {selectedPack && (
          <div className="shrink-0 border-b border-radar-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <RadarScoreBadge score={selectedPack.radarScore} grade={selectedPack.radarGrade} size="sm" previewOnly />
                  {selectedPack.isHot && <span className="badge-hot">{COPY.hot}</span>}
                  {selectedPack.hasActiveTender && (
                    <ActiveTenderBadge size="sm" title={selectedPack.tenderTitle} />
                  )}
                </div>
                <p className="mt-2 font-medium">{selectedPack.publicName}</p>
                <p className="text-xs text-radar-muted">
                  {formatInt(selectedPack.batimentCount)} écoles · localisation précise après achat
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="shrink-0 rounded-lg p-1.5 text-radar-muted hover:bg-radar-canvas"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-end justify-between gap-2">
              <div>
                <p className="text-xl font-bold">
                  <PackBudgetLabel rangeLabel={selectedPack.budgetRange} capex={selectedPack.packCapexTotal} className="text-xl font-bold" />
                </p>
                <p className="text-xs text-radar-muted">Tranche budget · détail € après achat</p>
              </div>
              <Link href={`/explorer/${selectedPack.packId}`} className="btn-primary !px-3 !py-2 !text-xs">
                {COPY.viewDossier}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Liste scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {filtered.map((pack) => (
            <div
              key={pack.packId}
              className={cn(
                'group border-b border-radar-border transition-colors hover:bg-radar-canvas',
                selectedId === pack.packId && 'bg-radar-canvas',
              )}
            >
              <button
                type="button"
                onClick={() => handleSelectPack(pack.packId)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} size="sm" previewOnly />
                      {pack.isHot && <Flame className="h-3 w-3 text-radar-heat" />}
                      {pack.hasActiveTender && <ActiveTenderBadge size="sm" title={pack.tenderTitle} />}
                      {pack.isNew && <span className="badge-new">{COPY.new}</span>}
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium">{pack.publicName}</p>
                    <p className="text-xs text-radar-muted">{formatInt(pack.batimentCount)} écoles</p>
                    <div className="mt-1"><PersonaBadgeGroup personas={pack.personas} /></div>
                  </div>
                  <div className="shrink-0 text-right">
                    <PackBudgetLabel rangeLabel={pack.budgetRange} capex={pack.packCapexTotal} className="text-sm font-bold" />
                    <PackSlotsBadge remaining={pack.slotsRemaining} max={pack.slotsMax} soldOut={pack.soldOut} />
                  </div>
                </div>
              </button>
              <div className="flex justify-end gap-1 px-4 pb-2 opacity-0 transition-opacity group-hover:opacity-100">
                <WatchlistButton packId={pack.packId} />
                <CompareToggle
                  packId={pack.packId}
                  active={compareIds.includes(pack.packId)}
                  onToggle={() => setCompareIds(toggleCompare(pack.packId))}
                />
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-radar-muted">Aucun territoire pour ce filtre.</p>
              <button type="button" onClick={() => changeFilter('all')} className="btn-ghost mt-2 !text-sm">
                Tout afficher
              </button>
            </div>
          )}
        </div>
      </div>
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
      aria-label={COPY.compare}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'rounded-lg border p-1.5 transition-colors',
        active
          ? 'border-radar-signal/40 bg-radar-signal/15 text-radar-signal'
          : 'border-radar-border text-radar-subtle hover:text-radar-muted',
      )}
    >
      <GitCompare className="h-3.5 w-3.5" />
    </button>
  );
}
