'use client';

import { formatEur } from '@/lib/format';
import { narrativeRac } from '@/lib/narrative-copy';
import { DOSSIER_BLOCK } from '@/lib/dossier-ui';
import { GlossaryTerm } from '@/components/ui/glossary-term';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { RangeSlider } from '@/components/ui/range-slider';

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
        <span className="text-sm text-ink-muted">
          <GlossaryTerm term="Subventions">Aides publiques</GlossaryTerm>
        </span>
        <span className="font-mono text-lg font-semibold tabular-nums text-ink transition-all duration-300">
          {subRatePct} %
        </span>
      </div>
      <RangeSlider
        min={10}
        max={70}
        value={subRatePct}
        onChange={onSubRateChange}
        ariaLabel="Taux d'aides publiques"
        className="mt-3"
      />

      <div className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
        <p className="text-ink-muted">
          Aides estimées :{' '}
          <AnimatedNumber
            value={subventions}
            format={(v) => formatEur(v, true)}
            className="font-semibold text-ink"
          />
          {' '}sur {formatEur(capex, true)}
        </p>
        <p className="font-medium text-warning-text transition-all duration-300">
          {narrativeRac(rac, subventionRatio)}
        </p>
      </div>
    </div>
  );
}
