'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { formatEur } from '@/lib/format';
import { COPY } from '@/lib/copy';

export function RacSimulator({
  capex,
  baseSubventionRatio,
}: {
  capex: number;
  baseSubventionRatio: number;
}) {
  const [ratio, setRatio] = useState(Math.round(baseSubventionRatio * 100));

  const { subventions, rac } = useMemo(() => {
    const r = ratio / 100;
    const sub = capex * r;
    return { subventions: sub, rac: capex - sub };
  }, [capex, ratio]);

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm xl:sticky xl:top-[7.5rem]">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <SlidersHorizontal className="h-4 w-4 text-slate-400" />
        Simulateur RAC
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Faites varier le taux de subvention pour estimer le reste à charge collectivité.
      </p>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Part subventions</span>
          <span className="font-bold tabular-nums text-slate-900">{ratio} %</span>
        </div>
        <input
          type="range"
          min={10}
          max={70}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
          className="mt-2 w-full accent-slate-900"
        />
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-[11px] text-slate-500">{COPY.subventions}</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
            {formatEur(subventions, true)}
          </p>
        </div>
        <div className="rounded-lg bg-orange-50 px-4 py-3">
          <p className="text-[11px] text-orange-600/80">{COPY.resteAChargeAfterSubs}</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-orange-700">
            {formatEur(rac, true)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-slate-400">
        Estimation indicative — non contractuelle.
      </p>
    </div>
  );
}
