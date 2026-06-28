'use client';

import Link from 'next/link';
import { ArrowLeft, GitCompare, Lock, Unlock } from 'lucide-react';
import type { MarketplacePack } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { decodePackId } from '@/lib/pack-id';
import { COPY, SCORE_GRADES } from '@/lib/copy';
import { formatEur, formatPct, formatDateFr } from '@/lib/format';
import { PERSONAS } from '@/lib/brand';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import { ActiveTenderBadge } from '@/components/marketplace/active-tender-badge';
import { PackSlotsBadge } from '@/components/marketplace/pack-slots-badge';
import { WatchlistButton } from '@/components/marketplace/watchlist-button';
import { useAccountPreferences } from '@/hooks/use-account-preferences';
import { cn } from '@/lib/utils';

const PERSONA_PILL =
  'border border-line bg-surface-muted text-ink-soft';

export function DossierAppHeader({
  pack,
  unlocked,
  communesLabel,
  nomEpci,
  racTotal,
  freePreview,
  dataLoadedAt,
}: {
  pack: MarketplacePack;
  unlocked: boolean;
  communesLabel?: string;
  nomEpci?: string;
  racTotal: number;
  freePreview?: TerritoryFreePreview;
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

  const kpis = unlocked
    ? [
        { label: 'CAPEX', value: formatEur(pack.packCapexTotal, true) },
        { label: 'RAC', value: formatEur(racTotal, true), accent: 'text-warning-text' },
        { label: 'Subv.', value: formatPct(pack.subventionRatio) },
        {
          label: 'Gain/an',
          value: formatEur(pack.gainNetMairieTotal, true),
          accent: 'text-positive-text',
        },
      ]
    : freePreview
      ? [
          { label: 'Budget', value: freePreview.budgetRange },
          { label: 'Subv.', value: freePreview.subventionLevel },
          { label: 'DPE', value: freePreview.dpeProfile.worstClass },
          {
            label: 'Radar',
            value: `${pack.radarGrade} · ${pack.radarScore}`,
          },
        ]
      : [
          { label: 'Budget', value: pack.budgetRange },
          { label: 'Subv.', value: pack.subventionLevelLabel },
          { label: COPY.ecoles, value: String(pack.batimentCount) },
          {
            label: 'Radar',
            value: `${pack.radarGrade} · ${pack.radarScore}`,
          },
        ];

  const kpiHints = unlocked
    ? undefined
    : freePreview
      ? [
          COPY.budgetRangeHint,
          'Niveau estimé',
          freePreview.dpeProfile.label,
          SCORE_GRADES[pack.radarGrade],
        ]
      : [COPY.budgetRangeHint, 'Niveau estimé', undefined, SCORE_GRADES[pack.radarGrade]];

  return (
    <header className="shrink-0 border-b border-line bg-white px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/explorer"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{COPY.backToExplorer}</span>
        </Link>

        <div className="h-4 w-px shrink-0 bg-line" />

        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <h1 className="truncate text-sm font-bold text-ink md:text-base">{title}</h1>
          <div className="flex shrink-0 items-center gap-1">
            <RadarScoreBadge
              score={pack.radarScore}
              grade={pack.radarGrade}
              previewOnly={!unlocked}
            />
            {pack.personas.map((p) => (
              <span
                key={p}
                title={PERSONAS[p].label}
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                  PERSONA_PILL,
                )}
              >
                {PERSONAS[p].shortLabel}
              </span>
            ))}
            {pack.isHot && (
              <span className="rounded-md bg-heat px-1.5 py-0.5 text-[10px] font-bold text-white">
                {COPY.hot}
              </span>
            )}
            {pack.hasActiveTender && <ActiveTenderBadge size="sm" title={pack.tenderTitle} />}
            {dataLoadedAt && (
              <span
                className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-muted"
                title={COPY.dataFreshness}
              >
                {formatDateFr(dataLoadedAt)}
              </span>
            )}
            {unlocked ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-positive px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Unlock className="h-2.5 w-2.5" />
                {COPY.unlocked}
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] font-bold text-ink-muted">
                <Lock className="h-2.5 w-2.5" />
                Aperçu
              </span>
            )}
            {!unlocked && (
              <PackSlotsBadge
                remaining={pack.slotsRemaining}
                max={pack.slotsMax}
                soldOut={pack.soldOut}
                size="sm"
              />
            )}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 text-[10px] text-ink-subtle lg:flex">
          {epciCode && <span className="font-mono">EPCI {epciCode}</span>}
          <span>·</span>
          <span>{pack.department}</span>
          <span>·</span>
          <span>{pack.batimentCount} écoles</span>
        </div>

        <WatchlistButton packId={pack.packId} />
        <button
          type="button"
          title={COPY.compare}
          aria-label={COPY.compare}
          onClick={() => toggleCompare(pack.packId)}
          className={cn(
            'rounded-lg border p-2 transition-colors',
            inCompare
              ? 'border-ink bg-ink text-white'
              : 'border-line text-ink-subtle hover:text-ink',
          )}
        >
          <GitCompare className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-2 sm:grid-cols-4">
        {kpis.map(({ label, value, accent }, i) => (
          <div key={label} className="min-w-0">
            <p className="label-caps">{label}</p>
            <p
              className={cn(
                'font-mono text-sm font-bold leading-tight tabular-nums [overflow-wrap:anywhere]',
                accent ?? 'text-ink',
              )}
              title={kpiHints?.[i]}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </header>
  );
}
