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
  MapPinOff,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { COPY, PERSONA_FILTER_LABELS, SCORE_GRADES } from '@/lib/copy';
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
import { motion } from 'framer-motion';
import { TRANSITION } from '@/lib/motion';
import { useEffect, useMemo, useState } from 'react';
import { useAccountPreferences } from '@/hooks/use-account-preferences';
import { isClientPersona } from '@/lib/brand';
import { filterExplorerPacks, type ExplorerFilterState } from '@/lib/explorer-filters';
import { PERSONA_THRESHOLDS } from '@/lib/persona-engine';
import {
  ExplorerAdvancedFilters,
  ExplorerCoveragePanel,
  ExplorerFilterSheet,
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
  const [minCapex, setMinCapex] = useState(
    defaultFilter === 'btp' ? PERSONA_THRESHOLDS.BTP_CAPEX_MIN : 0,
  );
  const [minGrade, setMinGrade] = useState<'A' | 'B' | 'C' | 'D' | 'all'>(
    defaultFilter === 'btp' ? 'B' : 'all',
  );
  const [aoOnly, setAoOnly] = useState(false);
  const [mutualizableOnly, setMutualizableOnly] = useState(defaultFilter === 'esco');
  const [minCeeEuros, setMinCeeEuros] = useState(
    defaultFilter === 'cee' ? PERSONA_THRESHOLDS.CEE_EUROS_MIN : 0,
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount =
    (minCapex > 0 ? 1 : 0) +
    (minGrade !== 'all' ? 1 : 0) +
    (aoOnly ? 1 : 0) +
    (mutualizableOnly ? 1 : 0) +
    (minCeeEuros > 0 ? 1 : 0);

  function resetAllFilters() {
    setMinCapex(0);
    setMinGrade('all');
    setAoOnly(false);
    setMutualizableOnly(false);
    setMinCeeEuros(0);
    setSelectedDept(null);
    changeFilter('all');
  }

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
    <div className="relative h-full min-h-0 w-full">
      <OnboardingModal
        open={showOnboarding}
        onComplete={(persona, capex) => {
          completeOnboarding({ persona, minCapex: capex });
          setMinCapex(capex);
          changeFilter(persona);
          if (persona === 'esco') setMutualizableOnly(true);
          if (persona === 'cee') setMinCeeEuros(PERSONA_THRESHOLDS.CEE_EUROS_MIN);
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
        <span className="rounded-md border border-line/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-ink-muted shadow-raised backdrop-blur-md backdrop-saturate-150">
          {coverageBadge} · {filtered.length} {COPY.territoryPlural}
        </span>
      </div>

      {/* Légende carte */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden rounded-xl border border-line/60 bg-white/80 px-4 py-3 shadow-raised backdrop-blur-md backdrop-saturate-150 md:block">
        <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
          Vue par département · localisation précise après achat
        </p>
        <div className="mt-2 flex items-center gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-heat" /> {COPY.hot}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink" /> Score A/B
          </span>
        </div>
      </div>

      {/* Panneau gauche : titre + filtres */}
      <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-col gap-3 md:max-w-xs">
        <div className="rounded-2xl border border-line/70 bg-white/85 p-4 shadow-overlay ring-1 ring-ink/[0.02] backdrop-blur-xl backdrop-saturate-150">
          <h1 className="text-lg font-semibold md:text-xl">{COPY.explorer}</h1>
          <p className="mt-2 text-xs text-ink-subtle">
            {filtered.length} dossier{filtered.length > 1 ? 's' : ''} · {qualifiedCount} prioritaires
            {selectedDept && (
              <button type="button" onClick={() => setSelectedDept(null)} className="ml-2 underline">
                Tous les départements
              </button>
            )}
          </p>

          <details className="mt-3 rounded-lg border border-line/60 bg-surface-sunken/80 px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-ink-muted hover:text-ink">
              Score de priorité (A–D)
            </summary>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink-muted">
              {(Object.entries(SCORE_GRADES) as [keyof typeof SCORE_GRADES, string][]).map(
                ([grade, desc]) => (
                  <li key={grade}>
                    <span className="font-mono font-semibold text-ink">{grade}</span> — {desc}
                  </li>
                ),
              )}
              <li className="pt-1 text-ink-subtle">{COPY.scorePrioriteHint}</li>
            </ul>
          </details>

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

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="btn-secondary flex-1 !py-1.5 !text-xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                title="Réinitialiser les filtres"
                aria-label="Réinitialiser les filtres"
                className="btn-ghost !px-2 !py-1.5 !text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
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
        </div>
      </div>

      {/* Panneau coulissant des filtres avancés */}
      <ExplorerFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        activeCount={activeFilterCount}
      >
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

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="btn-ghost w-full !justify-start !px-3 !py-2 !text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser tous les filtres
          </button>
        )}

        <ExplorerCoveragePanel packs={packs} />

        <details className="rounded-lg border border-line bg-surface-sunken">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink-muted">
            Comment lire cette carte · {EXPLORER_GUIDE.length} étapes
          </summary>
          <ol className="space-y-2 border-t border-line px-3 py-3">
            {EXPLORER_GUIDE.map(({ step, title, description }) => (
              <li key={step} className="text-xs text-ink-muted">
                <span className="font-semibold text-ink">
                  {step}. {title}
                </span>
                <span className="mt-0.5 block leading-relaxed">{description}</span>
              </li>
            ))}
          </ol>
        </details>
      </ExplorerFilterSheet>

      {/* Toggle liste mobile */}
      <button
        type="button"
        onClick={() => setListOpen((o) => !o)}
        className="absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium shadow-raised md:hidden"
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
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>

        {/* Détail sélectionné */}
        {selectedPack && (
          <div className="shrink-0 border-b border-line p-4">
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
                <p className="text-xs text-ink-muted">
                  {formatInt(selectedPack.batimentCount)} écoles · localisation précise après achat
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="shrink-0 rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken"
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
                <p className="text-xs text-ink-muted">Tranche budget · détail € après achat</p>
              </div>
              <Link href={`/explorer/${selectedPack.packId}`} className="btn-primary !px-3 !py-2 !text-xs">
                {COPY.viewDossier}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Liste scrollable — cartes territoire */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {filtered.map((pack, i) => (
            <motion.div
              key={pack.packId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...TRANSITION.base, delay: Math.min(i, 7) * 0.04 }}
              className={cn(
                'group relative mb-2 last:mb-0',
                selectedId === pack.packId && 'ring-2 ring-ink ring-offset-2 rounded-xl',
              )}
            >
              <button
                type="button"
                onClick={() => handleSelectPack(pack.packId)}
                className={cn(
                  'w-full rounded-xl border border-line bg-white p-3.5 text-left shadow-sm transition-all hover:border-line-strong hover:shadow-card',
                  selectedId === pack.packId && 'border-ink bg-surface-sunken',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-ink">{pack.publicName}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {pack.department.split('·')[0]?.trim()} · {formatInt(pack.batimentCount)} écoles
                    </p>
                  </div>
                  <PackBudgetLabel
                    rangeLabel={pack.budgetRange}
                    capex={pack.packCapexTotal}
                    className="shrink-0 text-right text-sm font-bold text-ink"
                  />
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} size="sm" previewOnly />
                  {pack.isHot && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-heat-soft px-1.5 py-0.5 text-[10px] font-semibold text-heat-text">
                      <Flame className="h-3 w-3" />
                      {COPY.hot}
                    </span>
                  )}
                  {pack.hasActiveTender && <ActiveTenderBadge size="sm" title={pack.tenderTitle} />}
                  {pack.isNew && <span className="badge-new">{COPY.new}</span>}
                  <PackSlotsBadge remaining={pack.slotsRemaining} max={pack.slotsMax} soldOut={pack.soldOut} />
                </div>
                <div className="mt-2"><PersonaBadgeGroup personas={pack.personas} /></div>
              </button>
              <div className="absolute bottom-3 right-3 flex gap-1 opacity-100 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                <WatchlistButton packId={pack.packId} />
                <CompareToggle
                  packId={pack.packId}
                  active={compareIds.includes(pack.packId)}
                  onToggle={() => setCompareIds(toggleCompare(pack.packId))}
                />
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              className="flex flex-col items-center px-6 py-14 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-ink-subtle">
                <MapPinOff className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-medium text-ink">Aucun territoire pour ces filtres</p>
              <p className="mt-1 text-xs text-ink-muted">
                Élargissez vos critères pour révéler plus d&apos;opportunités.
              </p>
              {filter !== 'all' && filter !== 'qualified' && filter !== 'watchlist' && (
                <p className="mt-2 max-w-xs text-xs text-ink-subtle">
                  Peu de dossiers tagués{' '}
                  <span className="font-medium text-ink-muted">
                    {PERSONA_FILTER_LABELS[filter].short}
                  </span>{' '}
                  dans la couverture actuelle — essayez « Tous » ou baissez le score minimum.
                </p>
              )}
              <button type="button" onClick={resetAllFilters} className="btn-secondary mt-5 !py-1.5 !text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser les filtres
              </button>
            </motion.div>
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
          ? 'border-ink/40 bg-ink/15 text-ink'
          : 'border-line text-ink-subtle hover:text-ink-muted',
      )}
    >
      <GitCompare className="h-3.5 w-3.5" />
    </button>
  );
}
