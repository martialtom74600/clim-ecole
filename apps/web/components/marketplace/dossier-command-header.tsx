import { Lock, Unlock } from 'lucide-react';
import type { MarketplacePack } from '@/lib/types';
import { decodePackId } from '@/lib/marketplace';
import { COPY, SCORE_GRADES } from '@/lib/copy';
import { formatEur, formatPct } from '@/lib/format';
import { PERSONAS, type ClientPersona } from '@/lib/brand';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import { WatchlistButton } from '@/components/marketplace/watchlist-button';
import { PackSlotsBadge } from '@/components/marketplace/pack-slots-badge';
import { ActiveTenderBadge } from '@/components/marketplace/active-tender-badge';
import { PackExportActions } from '@/components/marketplace/pack-export-actions';
import { cn } from '@/lib/utils';

const PERSONA_PILL: Record<ClientPersona, string> = {
  btp: 'bg-violet-600 text-white ring-violet-700/30',
  be: 'bg-sky-600 text-white ring-sky-700/30',
  amo: 'bg-emerald-600 text-white ring-emerald-700/30',
};

function Pill({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DossierCommandHeader({
  pack,
  unlocked,
  communesLabel,
  nomEpci,
  racTotal,
  scoreClosingMax,
  radarFactors,
}: {
  pack: MarketplacePack;
  unlocked: boolean;
  communesLabel?: string;
  nomEpci?: string;
  racTotal: number;
  scoreClosingMax?: number;
  radarFactors?: string[];
}) {
  const territoryTitle =
    communesLabel?.split(',')[0]?.trim() ||
    communesLabel ||
    nomEpci ||
    `Territoire · ${pack.department.split('·')[0]?.trim() ?? pack.department}`;

  const epciCode = decodePackId(pack.packId) ?? (nomEpci?.match(/^\d+$/) ? nomEpci : undefined);
  const gradeHint = SCORE_GRADES[pack.radarGrade] ?? '';

  return (
    <header className="space-y-6">
      {/* Title row */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} previewOnly={!unlocked} />
            {pack.personas.map((p) => (
              <Pill
                key={p}
                className={PERSONA_PILL[p]}
                title={`${PERSONAS[p].label} — ${PERSONAS[p].description}`}
              >
                {PERSONAS[p].shortLabel}
              </Pill>
            ))}
            {pack.isHot && (
              <Pill className="bg-orange-500 text-white ring-orange-600/30">{COPY.hot}</Pill>
            )}
            {pack.hasActiveTender && <ActiveTenderBadge title={pack.tenderTitle} />}
            {unlocked ? (
              <Pill className="bg-emerald-600 text-white ring-emerald-700/30">
                <Unlock className="h-3 w-3" />
                {COPY.unlocked}
              </Pill>
            ) : (
              <Pill className="bg-slate-200 text-slate-600 ring-slate-300/50">
                <Lock className="h-3 w-3" />
                {COPY.masked}
              </Pill>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl lg:text-4xl">
            {territoryTitle}
          </h1>

          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span>{pack.department}</span>
            {epciCode && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                EPCI {epciCode}
              </span>
            )}
            <span>
              {pack.batimentCount} école{pack.batimentCount > 1 ? 's' : ''}
            </span>
            {!unlocked && (
              <PackSlotsBadge
                remaining={pack.slotsRemaining}
                max={pack.slotsMax}
                soldOut={pack.soldOut}
                size="sm"
              />
            )}
          </p>

          {unlocked && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
              {pack.batimentCount} établissement{pack.batimentCount > 1 ? 's' : ''} à rénover — budget{' '}
              <strong className="font-semibold text-slate-900">
                {formatEur(pack.packCapexTotal, true)}
              </strong>
              , {formatPct(pack.subventionRatio)} subventionné, gain mairie estimé{' '}
              <strong className="font-semibold text-emerald-700">
                {formatEur(pack.gainNetMairieTotal, true)}/an
              </strong>
              .
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end">
          <WatchlistButton packId={pack.packId} />
          {unlocked && <PackExportActions packId={pack.packId} compact />}
        </div>
      </div>

      {/* KPI strip — unlocked only */}
      {unlocked && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200/80 bg-slate-200/80 shadow-sm lg:grid-cols-4">
          <KpiCell
            label={COPY.budgetTravaux}
            value={formatEur(pack.packCapexTotal, true)}
            hint={COPY.budgetTravauxHint}
          />
          <KpiCell
            label={COPY.resteAChargeAfterSubs}
            value={formatEur(racTotal, true)}
            hint={COPY.resteAChargeAfterSubsHint}
            accent="text-orange-600"
          />
          <KpiCell
            label={COPY.subventions}
            value={formatPct(pack.subventionRatio)}
            hint={`${formatEur(pack.subventionsTotal, true)} estimés`}
          />
          <KpiCell
            label={`Radar ${pack.radarGrade}`}
            value={`${pack.radarScore}/100`}
            hint={
              scoreClosingMax && scoreClosingMax > 0
                ? `${COPY.scoreClosing} max ${scoreClosingMax} · ${gradeHint}`
                : gradeHint
            }
            accent="text-violet-600"
          />
        </div>
      )}

      {/* Signals row */}
      {unlocked && (radarFactors?.length || pack.statutProjetEpci) && (
        <div className="flex flex-wrap gap-2">
          {pack.statutProjetEpci && (
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
              {pack.statutProjetEpci.replace(/_/g, ' ')}
            </span>
          )}
          {radarFactors?.slice(0, 4).map((f) => (
            <span
              key={f}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}

function KpiCell({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white px-4 py-4 md:px-5 md:py-5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn('mt-1 text-xl font-bold tabular-nums tracking-tight md:text-2xl', accent ?? 'text-slate-900')}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] leading-snug text-slate-400">{hint}</p>}
    </div>
  );
}
