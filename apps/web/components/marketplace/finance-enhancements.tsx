'use client';

import { formatEur } from '@/lib/format';
import { narrativeGain } from '@/lib/narrative-copy';
import { DOSSIER_BLOCK } from '@/lib/dossier-ui';
import { GlossaryTerm } from '@/components/ui/glossary-term';

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
      <p className="text-sm font-medium text-slate-900">
        <GlossaryTerm term="Montage en tiers-financement">Montage zéro avance</GlossaryTerm>
      </p>

      <div className="mt-5 space-y-4">
        <label className="block text-sm text-slate-600">
          Durée du contrat — {dureeAns} ans
          <input
            type="range"
            min={10}
            max={25}
            value={dureeAns}
            onChange={(e) => onDureeChange(Number(e.target.value))}
            className="mt-2 h-1.5 w-full accent-slate-900"
          />
        </label>
        <label className="block text-sm text-slate-600">
          Ajustement loyer — ×{loyerFactor.toFixed(2)}
          <input
            type="range"
            min={80}
            max={120}
            value={loyerFactor * 100}
            onChange={(e) => onLoyerFactorChange(Number(e.target.value) / 100)}
            className="mt-2 h-1.5 w-full accent-slate-900"
          />
        </label>
      </div>

      <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-500">Loyer / an</dt>
          <dd className="mt-1 font-mono font-semibold tabular-nums text-slate-900 transition-all duration-300">
            {formatEur(loyer, true)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Redevance / an</dt>
          <dd className="mt-1 font-mono font-semibold tabular-nums text-slate-900">
            {formatEur(redevance, true)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Bilan commune</dt>
          <dd className="mt-1 text-sm text-emerald-700 transition-all duration-300">
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
      <div className="rounded-lg border border-slate-200 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Prudent (−12 pts vs {activeSubRate} %)
        </p>
        <p className="mt-2 text-sm text-slate-600">Aides {formatEur(subventionsPess, true)}</p>
        <p className="text-sm font-medium text-amber-800">Reste {formatEur(racPess, true)}</p>
      </div>
      <div className="rounded-lg border border-slate-200 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Optimiste (+10 pts vs {activeSubRate} %)
        </p>
        <p className="mt-2 text-sm text-slate-600">Aides {formatEur(subventionsOpt, true)}</p>
        <p className="text-sm font-medium text-emerald-700">Reste {formatEur(racOpt, true)}</p>
      </div>
      <p className="col-span-full text-xs text-slate-400">
        Budget travaux : {formatEur(capex, true)}
      </p>
    </div>
  );
}
