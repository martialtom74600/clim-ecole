'use client';

import { formatEur } from '@/lib/format';
import { narrativeGain } from '@/lib/narrative-copy';
import { DOSSIER_BLOCK } from '@/lib/dossier-ui';
import { GlossaryTerm } from '@/components/ui/glossary-term';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { RangeSlider } from '@/components/ui/range-slider';

export function MgpeInteractiveSimulator({
  loyer,
  redevance,
  gainNet,
  dureeAns,
  loyerFactor,
  onDureeChange,
  onLoyerFactorChange,
}: {
  loyer: number;
  redevance: number;
  gainNet: number;
  dureeAns: number;
  loyerFactor: number;
  onDureeChange: (n: number) => void;
  onLoyerFactorChange: (n: number) => void;
}) {
  return (
    <div className={DOSSIER_BLOCK}>
      <p className="text-sm font-medium text-ink">
        <GlossaryTerm term="Montage en tiers-financement">Montage zéro avance</GlossaryTerm>
      </p>

      <div className="mt-5 space-y-4">
        <label className="block text-sm text-ink-muted">
          Durée du contrat — {dureeAns} ans
          <RangeSlider
            min={10}
            max={25}
            value={dureeAns}
            onChange={onDureeChange}
            ariaLabel="Durée du contrat en années"
            className="mt-2"
          />
        </label>
        <label className="block text-sm text-ink-muted">
          Ajustement loyer — ×{loyerFactor.toFixed(2)}
          <RangeSlider
            min={80}
            max={120}
            value={loyerFactor * 100}
            onChange={(v) => onLoyerFactorChange(v / 100)}
            ariaLabel="Ajustement du loyer"
            className="mt-2"
          />
        </label>
      </div>

      <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-ink-muted">Loyer / an</dt>
          <dd className="mt-1">
            <AnimatedNumber
              value={loyer}
              format={(v) => formatEur(v, true)}
              className="block font-mono font-semibold tabular-nums text-ink"
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Redevance / an</dt>
          <dd className="mt-1">
            <AnimatedNumber
              value={redevance}
              format={(v) => formatEur(v, true)}
              className="block font-mono font-semibold tabular-nums text-ink"
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Bilan commune</dt>
          <dd className="mt-1 text-sm text-positive-text transition-all duration-300">
            {gainNet > 0 ? narrativeGain(gainNet) : 'Équilibre sur la durée'}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function FinanceScenariosCompare({
  capex,
  subventionsPess,
  subventionsOpt,
  racPess,
  racOpt,
  activeSubRate,
}: {
  capex: number;
  subventionsPess: number;
  subventionsOpt: number;
  racPess: number;
  racOpt: number;
  activeSubRate: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-line px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
          Prudent (−12 pts vs {activeSubRate} %)
        </p>
        <p className="mt-2 text-sm text-ink-muted">Aides {formatEur(subventionsPess, true)}</p>
        <p className="text-sm font-medium text-warning-text">Reste {formatEur(racPess, true)}</p>
      </div>
      <div className="rounded-lg border border-line px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
          Optimiste (+10 pts vs {activeSubRate} %)
        </p>
        <p className="mt-2 text-sm text-ink-muted">Aides {formatEur(subventionsOpt, true)}</p>
        <p className="text-sm font-medium text-positive-text">Reste {formatEur(racOpt, true)}</p>
      </div>
      <p className="col-span-full text-xs text-ink-subtle">
        Budget travaux : {formatEur(capex, true)}
      </p>
    </div>
  );
}
