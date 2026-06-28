'use client';

import { useState } from 'react';
import type { MarketplaceMgpeSummary } from '@/lib/types';
import { formatEur } from '@/lib/format';

export function MgpeInteractiveSimulator({ base }: { base: MarketplaceMgpeSummary }) {
  const [duree, setDuree] = useState(base.dureeContratAns || 15);
  const [loyerFactor, setLoyerFactor] = useState(1);

  const loyer = (base.loyerLtEuros || 0) * loyerFactor;
  const redevance = base.redevanceFtEuros || 0;
  const gain = (base.gainNetContractuelEuros || 0) * (duree / Math.max(base.dureeContratAns || 15, 1));

  return (
    <div className="rounded-xl border border-line bg-white p-4 text-xs shadow-card">
      <p className="text-sm font-semibold text-ink">Simulateur MGPE interactif</p>
      <p className="mt-0.5 text-[11px] text-ink-muted">Ajustez la durée et le loyer pour votre pitch</p>
      <div className="mt-3 space-y-3 text-ink-soft">
        <label className="block">
          Durée contrat ({duree} ans)
          <input
            type="range"
            min={10}
            max={25}
            value={duree}
            onChange={(e) => setDuree(Number(e.target.value))}
            className="mt-1 w-full accent-ink"
          />
        </label>
        <label className="block">
          Loyer LT (×{loyerFactor.toFixed(2)})
          <input
            type="range"
            min={80}
            max={120}
            value={loyerFactor * 100}
            onChange={(e) => setLoyerFactor(Number(e.target.value) / 100)}
            className="mt-1 w-full accent-ink"
          />
        </label>
        <dl className="grid grid-cols-3 gap-2 border-t border-line pt-2.5">
          <div>
            <dt className="text-ink-muted">Loyer/an</dt>
            <dd className="font-mono font-bold tabular-nums text-ink">{formatEur(loyer, true)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Redevance/an</dt>
            <dd className="font-mono font-bold tabular-nums text-ink">{formatEur(redevance, true)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Gain net estimé</dt>
            <dd className="font-mono font-bold tabular-nums text-positive-text">{formatEur(gain, true)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function FinanceScenariosCompare({
  capex,
  subventionsPess,
  subventionsOpt,
  racPess,
  racOpt,
}: {
  capex: number;
  subventionsPess: number;
  subventionsOpt: number;
  racPess: number;
  racOpt: number;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-card">
      <p className="text-sm font-semibold text-ink">Scénarios finance</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-warning-border bg-warning-soft p-3">
          <p className="font-semibold text-warning-text">Pessimiste</p>
          <p className="mt-1 tabular-nums text-ink-soft">Subv. {formatEur(subventionsPess, true)}</p>
          <p className="font-mono font-bold tabular-nums text-warning-text">RAC {formatEur(racPess, true)}</p>
        </div>
        <div className="rounded-lg border border-positive-border bg-positive-soft p-3">
          <p className="font-semibold text-positive-text">Optimiste</p>
          <p className="mt-1 tabular-nums text-ink-soft">Subv. {formatEur(subventionsOpt, true)}</p>
          <p className="font-mono font-bold tabular-nums text-positive-text">RAC {formatEur(racOpt, true)}</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-ink-subtle">CAPEX total {formatEur(capex, true)} — fourchettes indicatives</p>
    </div>
  );
}
