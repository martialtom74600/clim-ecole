'use client';

import { useMemo, useState } from 'react';
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
    <div className="card p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-radar-subtle">Simulateur</p>
      <h2 className="mt-2 text-lg font-semibold">
        Et si le taux de subvention change ?
      </h2>
      <p className="mt-2 text-sm text-radar-muted">
        Faites varier le pourcentage d&apos;aides publiques pour estimer ce que la collectivité devra financer.
        Estimation indicative — non contractuelle.
      </p>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-radar-muted">Part subventions</span>
          <span className="font-bold tabular-nums">{ratio} %</span>
        </div>
        <input
          type="range"
          min={10}
          max={70}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
          className="mt-2 w-full accent-radar-text"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-radar-border bg-radar-canvas p-4">
          <p className="text-xs font-medium text-radar-muted">{COPY.subventions}</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {formatEur(subventions, true)}
          </p>
        </div>
        <div className="rounded-xl border border-radar-border bg-radar-canvas p-4">
          <p className="text-xs font-medium text-radar-muted">{COPY.resteAChargeAfterSubs}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-radar-signal">
            {formatEur(rac, true)}
          </p>
        </div>
      </div>
    </div>
  );
}
