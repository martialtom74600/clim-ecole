'use client';

import { Minus, Equal } from 'lucide-react';
import { formatEur, formatPct } from '@/lib/format';
import { narrativeRoi, narrativeSubventions } from '@/lib/narrative-copy';
import { DOSSIER_BLOCK } from '@/lib/dossier-ui';
import { GlossaryTerm } from '@/components/ui/glossary-term';
import { cn } from '@/lib/utils';

export function DossierFundingWaterfall({
  capex,
  subventionsTotal,
  subventionRatio,
  racTotal,
  roiAnnees,
}: {
  capex: number;
  subventionsTotal: number;
  subventionRatio: number;
  racTotal: number;
  roiAnnees: number;
}) {
  const base = capex || 1;
  const subPct = Math.max(0, Math.min(100, (subventionsTotal / base) * 100));
  const racPct = Math.max(0, Math.min(100 - subPct, (racTotal / base) * 100));

  return (
    <div className={DOSSIER_BLOCK}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">Répartition du financement</p>
        {roiAnnees > 0 && (
          <span className="text-xs text-slate-500">{narrativeRoi(roiAnnees)}</span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500 transition-all duration-300">
        {narrativeSubventions(subventionsTotal, subventionRatio)}
      </p>

      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-200">
        {subPct > 0 && (
          <div
            className="bg-emerald-500 transition-[width] duration-500"
            style={{ width: `${subPct}%` }}
          />
        )}
        {racPct > 0 && (
          <div
            className="bg-amber-500 transition-[width] duration-500"
            style={{ width: `${racPct}%` }}
          />
        )}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-slate-400">
        <span>Aides {Math.round(subPct)} %</span>
        <span>Mairie {Math.round(racPct)} %</span>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
        <Step label="Budget travaux" value={formatEur(capex, true)} />
        <Operator icon={<Minus className="h-3 w-3" />} />
        <Step
          label={
            <>
              <GlossaryTerm term="Subventions">Aides publiques</GlossaryTerm>
            </>
          }
          value={formatEur(subventionsTotal, true)}
          sub={formatPct(subventionRatio)}
          tone="positive"
        />
        <Operator icon={<Equal className="h-3 w-3" />} />
        <Step label="Reste à financer" value={formatEur(racTotal, true)} tone="warning" />
      </div>
    </div>
  );
}

function Step({
  label,
  value,
  sub,
  tone,
}: {
  label: React.ReactNode;
  value: string;
  sub?: string;
  tone?: 'positive' | 'warning';
}) {
  return (
    <div className="text-center">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-mono text-sm font-semibold tabular-nums transition-all duration-300',
          tone === 'positive' && 'text-emerald-700',
          tone === 'warning' && 'text-amber-800',
          !tone && 'text-slate-900',
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

function Operator({ icon }: { icon: React.ReactNode }) {
  return <div className="text-slate-300">{icon}</div>;
}
