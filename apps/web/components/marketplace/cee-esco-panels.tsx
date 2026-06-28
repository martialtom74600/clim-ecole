'use client';

import { CEE_FICHES } from '@/lib/cee-engine';
import { formatEur, formatInt } from '@/lib/format';

export function CeeTerritoryPanel({
  ceeEurosTotal,
  cumacKwhTotal,
  batimentCount,
  unlocked,
}: {
  ceeEurosTotal: number;
  cumacKwhTotal: number;
  batimentCount: number;
  unlocked: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 text-xs shadow-card">
      <p className="text-sm font-semibold text-ink">Module CEE / cumac</p>
      <p className="mt-0.5 text-[10px] text-ink-muted">
        Estimation indicative — non audit PNCEE. Convention avant AO requise.
      </p>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <dt className="text-ink-muted">CEE estimés</dt>
          <dd className="font-mono font-bold tabular-nums text-ink">
            {unlocked ? formatEur(ceeEurosTotal, true) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Cumac kWh</dt>
          <dd className="font-mono font-bold tabular-nums text-ink">
            {unlocked ? formatInt(cumacKwhTotal) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Écoles</dt>
          <dd className="font-mono font-bold tabular-nums text-ink">{batimentCount}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-line pt-3">
        <p className="font-medium text-ink">Fiches BAT applicables</p>
        <ul className="mt-2 space-y-1">
          {CEE_FICHES.map((f) => (
            <li key={f.code} className="flex justify-between gap-2 text-[11px] text-ink-muted">
              <span>
                <span className="font-mono font-semibold text-ink-soft">{f.code}</span> — {f.label}
              </span>
              <span className="shrink-0 font-medium text-positive-text">{f.gainPct}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function EscoMutualizationPanel({
  batimentCount,
  packCapexTotal,
  isMutualizable,
  gainNetMairieTotal,
  unlocked,
}: {
  batimentCount: number;
  packCapexTotal: number;
  isMutualizable: boolean;
  gainNetMairieTotal: number;
  unlocked: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 text-xs shadow-card">
      <p className="text-sm font-semibold text-ink">Vue ESCO — mutualisation CPE</p>
      <p className="mt-0.5 text-[10px] text-ink-muted">
        Volume critique : 5+ écoles et CAPEX &gt; 800 k€ pour un marché global viable.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            isMutualizable
              ? 'bg-positive text-white'
              : 'bg-surface-muted text-ink-muted'
          }`}
        >
          {isMutualizable ? 'Mutualisable ✓' : 'Volume insuffisant'}
        </span>
        <span className="rounded-full border border-line bg-surface-sunken px-2.5 py-1 text-[10px] font-medium text-ink-soft">
          {batimentCount} écoles
        </span>
      </div>

      {unlocked && (
        <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
          <div>
            <dt className="text-ink-muted">CAPEX parc</dt>
            <dd className="font-mono font-bold tabular-nums text-ink">{formatEur(packCapexTotal, true)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Gain net mairie/an</dt>
            <dd className="font-mono font-bold tabular-nums text-positive-text">
              {formatEur(gainNetMairieTotal, true)}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
