'use client';

import { formatEur } from '@/lib/format';
import { narrativeRac } from '@/lib/narrative-copy';
import { DOSSIER_BLOCK } from '@/lib/dossier-ui';
import { GlossaryTerm } from '@/components/ui/glossary-term';

export function RacSimulator({
  capex,
  subRatePct,
  onSubRateChange,
  subventions,
  rac,
  subventionRatio,
}: {
  capex: number;
  subRatePct: number;
  onSubRateChange: (pct: number) => void;
  subventions: number;
  rac: number;
  subventionRatio: number;
}) {
  return (
    <div className={DOSSIER_BLOCK}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-600">
          <GlossaryTerm term="Subventions">Aides publiques</GlossaryTerm>
        </span>
        <span className="font-mono text-lg font-semibold tabular-nums text-slate-900 transition-all duration-300">
          {subRatePct} %
        </span>
      </div>
      <input
        type="range"
        min={10}
        max={70}
        value={subRatePct}
        onChange={(e) => onSubRateChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
        aria-label="Taux d'aides publiques"
      />

      <div className="mt-5 space-y-2 border-t border-slate-200 pt-5 text-sm">
        <p className="text-slate-600">
          Aides estimées :{' '}
          <strong className="font-semibold text-slate-900">{formatEur(subventions, true)}</strong>
          {' '}sur {formatEur(capex, true)}
        </p>
        <p className="font-medium text-amber-800 transition-all duration-300">
          {narrativeRac(rac, subventionRatio)}
        </p>
      </div>
    </div>
  );
}
