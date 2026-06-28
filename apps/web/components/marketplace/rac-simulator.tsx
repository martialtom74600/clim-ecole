'use client';

import { useMemo, useState } from 'react';
import { formatEur } from '@/lib/format';
import { COPY } from '@/lib/copy';

export function RacSimulator({
  capex,
  baseSubventionRatio,
  embedded,
}: {
  capex: number;
  baseSubventionRatio: number;
  embedded?: boolean;
}) {
  const [ratio, setRatio] = useState(Math.round(baseSubventionRatio * 100));

  const { subventions, rac } = useMemo(() => {
    const r = ratio / 100;
    const sub = capex * r;
    return { subventions: sub, rac: capex - sub };
  }, [capex, ratio]);

  return (
    <div className={embedded ? 'rounded-xl border border-line bg-white p-4 shadow-card' : 'rounded-xl border border-line bg-white p-5 shadow-raised'}>
      <p className="text-sm font-semibold text-ink">Simulateur RAC</p>
      <p className="mt-0.5 text-[11px] text-ink-muted">Variez le taux de subvention</p>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-muted">Subventions</span>
          <span className="font-mono font-bold tabular-nums text-ink">{ratio} %</span>
        </div>
        <input
          type="range"
          min={10}
          max={70}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
          className="mt-1.5 w-full accent-ink"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-surface-sunken px-2.5 py-2">
          <p className="text-[10px] text-ink-muted">{COPY.subventions}</p>
          <p className="font-mono text-sm font-bold tabular-nums text-ink">{formatEur(subventions, true)}</p>
        </div>
        <div className="rounded-lg bg-warning-soft px-2.5 py-2">
          <p className="text-[10px] text-warning-text">{COPY.resteAChargeAfterSubs}</p>
          <p className="font-mono text-sm font-bold tabular-nums text-warning-text">{formatEur(rac, true)}</p>
        </div>
      </div>
    </div>
  );
}
