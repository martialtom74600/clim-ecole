'use client';

import Link from 'next/link';
import { ArrowLeft, Lock, Unlock } from 'lucide-react';
import type { MarketplacePack } from '@/lib/types';
import { decodePackId } from '@/lib/pack-id';
import { COPY } from '@/lib/copy';
import { formatEur, formatPct } from '@/lib/format';
import { PERSONAS, type ClientPersona } from '@/lib/brand';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import { ActiveTenderBadge } from '@/components/marketplace/active-tender-badge';
import { cn } from '@/lib/utils';

const PERSONA_PILL: Record<ClientPersona, string> = {
  btp: 'bg-violet-600 text-white',
  be: 'bg-sky-600 text-white',
  amo: 'bg-emerald-600 text-white',
};

export function DossierAppHeader({
  pack,
  communesLabel,
  nomEpci,
  racTotal,
}: {
  pack: MarketplacePack;
  communesLabel?: string;
  nomEpci?: string;
  racTotal: number;
}) {
  const title =
    communesLabel?.split(',')[0]?.trim() ||
    communesLabel ||
    nomEpci ||
    pack.publicName;

  const epciCode = decodePackId(pack.packId);

  const kpis = [
    { label: 'CAPEX', value: formatEur(pack.packCapexTotal, true) },
    { label: 'RAC', value: formatEur(racTotal, true), accent: 'text-orange-600' },
    { label: 'Subv.', value: formatPct(pack.subventionRatio) },
    { label: 'Gain/an', value: formatEur(pack.gainNetMairieTotal, true), accent: 'text-emerald-600' },
  ];

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/explorer"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{COPY.backToExplorer}</span>
        </Link>

        <div className="h-4 w-px shrink-0 bg-slate-200" />

        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <h1 className="truncate text-sm font-bold text-slate-900 md:text-base">{title}</h1>
          <div className="flex shrink-0 items-center gap-1">
            <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} previewOnly={false} />
            {pack.personas.map((p) => (
              <span
                key={p}
                title={PERSONAS[p].label}
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-bold',
                  PERSONA_PILL[p],
                )}
              >
                {PERSONAS[p].shortLabel}
              </span>
            ))}
            {pack.isHot && (
              <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {COPY.hot}
              </span>
            )}
            {pack.hasActiveTender && <ActiveTenderBadge size="sm" title={pack.tenderTitle} />}
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              <Unlock className="h-2.5 w-2.5" />
              {COPY.unlocked}
            </span>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-1 text-[10px] text-slate-400 lg:flex">
          {epciCode && <span className="font-mono">EPCI {epciCode}</span>}
          <span>·</span>
          <span>{pack.department}</span>
          <span>·</span>
          <span>{pack.batimentCount} écoles</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2 border-t border-slate-100 pt-2">
        {kpis.map(({ label, value, accent }) => (
          <div key={label} className="min-w-0 text-center sm:text-left">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <p className={cn('truncate text-sm font-bold tabular-nums', accent ?? 'text-slate-900')}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </header>
  );
}

/** Header réduit pour l'état verrouillé (hors SPA) */
export function DossierLockedHeader({
  pack,
  communesLabel,
  nomEpci,
}: {
  pack: MarketplacePack;
  communesLabel?: string;
  nomEpci?: string;
}) {
  const title =
    communesLabel?.split(',')[0]?.trim() ||
    communesLabel ||
    nomEpci ||
    pack.publicName;

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4">
      <Link
        href="/explorer"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {COPY.backToExplorer}
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} previewOnly />
        <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
          <Lock className="h-2.5 w-2.5" />
          {COPY.masked}
        </span>
      </div>
      <h1 className="mt-2 text-xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-xs text-slate-500">
        {pack.department} · {pack.batimentCount} écoles
      </p>
    </header>
  );
}
