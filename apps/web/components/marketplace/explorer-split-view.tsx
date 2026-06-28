'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Flame,
  GitCompare,
  HardHat,
  Landmark,
  LayoutGrid,
  Leaf,
  List,
  Map,
  Ruler,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { COPY, PERSONA_FILTER_LABELS } from '@/lib/copy';
import type { ClientPersona, MarketplacePack } from '@/lib/types';
import { parseDepartmentCode } from '@/lib/geo';
import { buildDepartmentMarkers } from '@/lib/map-departments';
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
} from '@/lib/radar-client-storage';
import { EXPLORER_GUIDE } from '@/lib/site-guide';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { useAccountPreferences } from '@/hooks/use-account-preferences';
import { isClientPersona } from '@/lib/brand';
import { filterExplorerPacks, type ExplorerFilterState } from '@/lib/explorer-filters';
import {
  ExplorerAdvancedFilters,
  ExplorerCoveragePanel,
  ExplorerSearchBar,
  OnboardingModal,
} from '@/components/marketplace/explorer-enhancements';

type PersonaFilter = ClientPersona | 'all' | 'qualified' | 'watchlist';

const PERSONA_TABS: { id: PersonaFilter; label: string; hint?: string; icon?: typeof HardHat }[] = [
  { id: 'all', label: COPY.filterAll, icon: LayoutGrid },
  { id: 'qualified', label: COPY.filterQualified, hint: COPY.qualifiedCriteria, icon: Sparkles },
  { id: 'btp', label: PERSONA_FILTER_LABELS.btp.short, hint: PERSONA_FILTER_LABELS.btp.long, icon: HardHat },
  { id: 'be', label: PERSONA_FILTER_LABELS.be.short, hint: PERSONA_FILTER_LABELS.be.long, icon: Ruler },
  { id: 'amo', label: PERSONA_FILTER_LABELS.amo.short, hint: PERSONA_FILTER_LABELS.amo.long, icon: Landmark },
  { id: 'esco', label: PERSONA_FILTER_LABELS.esco.short, hint: PERSONA_FILTER_LABELS.esco.long, icon: Zap },
  { id: 'cee', label: PERSONA_FILTER_LABELS.cee.short, hint: PERSONA_FILTER_LABELS.cee.long, icon: Leaf },
  { id: 'watchlist', label: COPY.filterFavorites, icon: Star },
];

export function ExplorerSplitView({
  packs,
  qualifiedCount,
  coverageBadge = 'France',
  initialPersonaFilter,
}: {
  packs: MarketplacePack[];
  qualifiedCount: number;
  coverageBadge?: string;
  initialPersonaFilter?: string;
}) {
  const defaultFilter: PersonaFilter =
    initialPersonaFilter && isClientPersona(initialPersonaFilter)
      ? initialPersonaFilter
      : 'all';

  const [filter, setFilter] = useState<PersonaFilter>(defaultFilter);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [watchIds, setWatchIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const [minCapex, setMinCapex] = useState(0);
  const [minGrade, setMinGrade] = useState<'A' | 'B' | 'C' | 'D' | 'all'>('all');
  const [aoOnly, setAoOnly] = useState(false);
  const [mutualizableOnly, setMutualizableOnly] = useState(defaultFilter === 'esco');
  const [minCeeEuros, setMinCeeEuros] = useState(defaultFilter === 'cee' ? 25_000 : 0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { prefs, loaded, toggleCompare, completeOnboarding } = useAccountPreferences();

  useEffect(() => {
    const saved = loadPersonaFilter();
    if (saved && PERSONA_TABS.some((t) => t.id === saved)) {
      setFilter(saved as PersonaFilter);
    }
    setCompareIds(getCompareList());
    setWatchIds(getWatchlist());
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setWatchIds(prefs.watchlist.length ? prefs.watchlist : getWatchlist());
    setCompareIds(prefs.compareIds.length ? prefs.compareIds : getCompareList());
    if (prefs.onboarding?.minCapex) setMinCapex(prefs.onboarding.minCapex);
    if (!prefs.onboarding?.completedAt) setShowOnboarding(true);
  }, [loaded, prefs.watchlist, prefs.compareIds, prefs.onboarding]);

  function changeFilter(f: PersonaFilter) {
    setFilter(f);
    savePersonaFilter(f);
  }

  const explorerFilters: ExplorerFilterState = useMemo(
    () => ({
      query: '',
      persona: filter,
      minCapex,
      minGrade,
      aoOnly,
      passoiresOnly: false,
      mutualizableOnly,
      minCeeEuros,
      departments: selectedDept ? [selectedDept] : [],
    }),
    [filter, minCapex, minGrade, aoOnly, mutualizableOnly, minCeeEuros, selectedDept],
  );

  const personaFiltered = useMemo(
    () => filterExplorerPacks(packs, explorerFilters, watchIds),
    [packs, explorerFilters, watchIds],
  );

  const departmentMarkers = useMemo(
    () => buildDepartmentMarkers(personaFiltered),
    [personaFiltered],
  );

  const filtered = personaFiltered;

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
      <OnboardingModal
        open={showOnboarding}
        onComplete={(persona, capex) => {
          completeOnboarding({ persona, minCapex: capex });
          setMinCapex(capex);
          changeFilter(persona);
          if (persona === 'esco') setMutualizableOnly(true);
          if (persona === 'cee') setMinCeeEuros(25_000);
          setShowOnboarding(false);
        }}
        onSkip={() => {
          completeOnboarding({});
          setShowOnboarding(false);
        }}
      />
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
        <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-overlay backdrop-blur-md">
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

          <ExplorerSearchBar className="mt-3" />

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

          <ExplorerAdvancedFilters
            minCapex={minCapex}
            minGrade={minGrade}
            aoOnly={aoOnly}
            mutualizableOnly={mutualizableOnly}
            minCeeEuros={minCeeEuros}
            onMinCapexChange={setMinCapex}
            onMinGradeChange={setMinGrade}
            onAoOnlyChange={setAoOnly}
            onMutualizableOnlyChange={setMutualizableOnly}
            onMinCeeEurosChange={setMinCeeEuros}
          />

          <ExplorerCoveragePanel packs={packs} />

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
          'absolute z-20 flex flex-col border-line bg-white shadow-overlay transition-transform duration-300',
          'bottom-0 right-0 top-auto max-h-[55vh] w-full rounded-t-2xl border-t md:bottom-4 md:top-4 md:max-h-none md:w-[min(100%,380px)] md:rounded-2xl md:border',
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
                'group relative border-b border-radar-border transition-colors hover:bg-radar-canvas',
                selectedId === pack.packId && 'bg-radar-canvas',
              )}
            >
              <button
                type="button"
                onClick={() => handleSelectPack(pack.packId)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} size="sm" previewOnly />
                    <p className="truncate text-sm font-semibold text-ink">{pack.publicName}</p>
                  </div>
                  <PackBudgetLabel
                    rangeLabel={pack.budgetRange}
                    capex={pack.packCapexTotal}
                    className="shrink-0 text-sm font-bold text-ink"
                  />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-radar-muted">
                  <span>{formatInt(pack.batimentCount)} écoles</span>
                  {pack.isHot && (
                    <span className="inline-flex items-center gap-0.5 font-medium text-radar-heat">
                      <Flame className="h-3 w-3" />
                      {COPY.hot}
                    </span>
                  )}
                  {pack.hasActiveTender && <ActiveTenderBadge size="sm" title={pack.tenderTitle} />}
                  {pack.isNew && <span className="badge-new">{COPY.new}</span>}
                  <PackSlotsBadge remaining={pack.slotsRemaining} max={pack.slotsMax} soldOut={pack.soldOut} />
                </div>
                <div className="mt-1.5"><PersonaBadgeGroup personas={pack.personas} /></div>
              </button>
              <div className="absolute bottom-2.5 right-3 flex gap-1 opacity-100 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
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
