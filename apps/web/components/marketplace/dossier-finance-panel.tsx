import { Leaf, PiggyBank, TrendingUp } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { formatEur, formatPct } from '@/lib/format';
import { GlossaryTerm } from '@/components/ui/glossary-term';
import { cn } from '@/lib/utils';

export function DossierFinancePanel({
  packCapexTotal,
  subventionsTotal,
  subventionRatio,
  racTotal,
  resteAChargeTotal,
  gainNetMairieTotal,
  fondsVertPotential,
  roiAnnees,
}: {
  packCapexTotal: number;
  subventionsTotal: number;
  subventionRatio: number;
  racTotal: number;
  resteAChargeTotal: number;
  gainNetMairieTotal: number;
  fondsVertPotential: number;
  roiAnnees: number;
}) {
  const subPct = Math.min(100, subventionRatio * 100);
  const racPct = Math.min(100 - subPct, (racTotal / (packCapexTotal || 1)) * 100);

  return (
    <div className="space-y-4">
      {/* Hero amounts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AmountCard
          label={COPY.budgetTravaux}
          value={formatEur(packCapexTotal, true)}
          gradient="from-slate-900 to-slate-800"
          textLight
        />
        <AmountCard
          label={COPY.resteAChargeAfterSubs}
          value={formatEur(racTotal, true)}
          gradient="from-orange-500 to-orange-600"
          textLight
        />
      </div>

      {/* Funding bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">Répartition financement</p>
          {roiAnnees > 0 && (
            <span className="text-xs font-semibold text-emerald-600">
              ROI Fonds Vert · {roiAnnees.toFixed(1)} ans
            </span>
          )}
        </div>

        <div className="mt-4 flex h-10 overflow-hidden rounded-lg">
          {subPct > 0 && (
            <div
              className="relative flex min-w-[4rem] items-center justify-center bg-emerald-600"
              style={{ width: `${subPct}%` }}
            >
              {subPct >= 10 && (
                <span className="px-2 text-xs font-bold text-white">{Math.round(subPct)}%</span>
              )}
            </div>
          )}
          {racPct > 0 && (
            <div
              className="relative flex flex-1 items-center justify-center bg-orange-500"
              style={{ width: `${racPct}%` }}
            >
              {racPct >= 10 && (
                <span className="px-2 text-xs font-bold text-white">{Math.round(racPct)}% RAC</span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Stat
            label={<GlossaryTerm term="Subventions">{COPY.subventions}</GlossaryTerm>}
            value={formatEur(subventionsTotal, true)}
            sub={formatPct(subventionRatio)}
          />
          <Stat
            label={<GlossaryTerm term="Reste à charge (RAC)">{COPY.resteAChargeAfterSubs}</GlossaryTerm>}
            value={formatEur(racTotal, true)}
          />
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={Leaf} label={COPY.partFondsVert} value={formatEur(resteAChargeTotal, true)} />
        <Metric
          icon={TrendingUp}
          label={COPY.gainNetMairie}
          value={`${formatEur(gainNetMairieTotal, true)}/an`}
          accent
        />
        <Metric icon={PiggyBank} label={COPY.fondsVert} value={formatEur(fondsVertPotential, true)} />
      </div>
    </div>
  );
}

function AmountCard({
  label,
  value,
  gradient,
  textLight,
}: {
  label: string;
  value: string;
  gradient: string;
  textLight?: boolean;
}) {
  return (
    <div className={cn('rounded-xl bg-gradient-to-br p-6 md:p-7', gradient, textLight && 'text-white')}>
      <p className={cn('text-xs font-medium uppercase tracking-wide', textLight ? 'text-white/70' : 'text-slate-500')}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight md:text-4xl">{value}</p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: React.ReactNode; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums text-slate-900">
        {value}
        {sub && <span className="ml-1 text-sm font-normal text-slate-500">({sub})</span>}
      </p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Leaf;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5">
      <Icon className={cn('h-4 w-4 shrink-0', accent ? 'text-emerald-600' : 'text-slate-400')} />
      <div className="min-w-0">
        <p className="truncate text-[11px] text-slate-500">{label}</p>
        <p className={cn('font-semibold tabular-nums', accent ? 'text-emerald-700' : 'text-slate-900')}>
          {value}
        </p>
      </div>
    </div>
  );
}
