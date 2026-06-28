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
    <div className={embedded ? 'rounded-lg border border-slate-200 bg-white p-4' : 'rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm'}>
      <p className="text-xs font-semibold text-slate-900">Simulateur RAC</p>
      <p className="mt-0.5 text-[11px] text-slate-500">Variez le taux de subvention</p>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Subventions</span>
          <span className="font-bold tabular-nums">{ratio} %</span>
        </div>
        <input
          type="range"
          min={10}
          max={70}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
          className="mt-1.5 w-full accent-slate-900"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-slate-50 px-2.5 py-2">
          <p className="text-[10px] text-slate-500">{COPY.subventions}</p>
          <p className="text-sm font-bold tabular-nums">{formatEur(subventions, true)}</p>
        </div>
        <div className="rounded-md bg-orange-50 px-2.5 py-2">
          <p className="text-[10px] text-orange-600/80">{COPY.resteAChargeAfterSubs}</p>
          <p className="text-sm font-bold tabular-nums text-orange-700">{formatEur(rac, true)}</p>
        </div>
      </div>
    </div>
  );
}
