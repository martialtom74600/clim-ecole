'use client';

import { CEE_FICHES } from '@/lib/cee-engine';
import { formatEur, formatInt } from '@/lib/format';
import { DOSSIER_BLOCK } from '@/lib/dossier-ui';
import { GlossaryTerm } from '@/components/ui/glossary-term';

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
    <div className={DOSSIER_BLOCK}>
      <p className="text-sm font-medium text-ink">
        <GlossaryTerm term="CEE">Primes énergie</GlossaryTerm>
      </p>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Montant estimé</dt>
          <dd className="text-ink-soft">
            {unlocked ? formatEur(ceeEurosTotal, true) : 'Après déblocage'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Cumac kWh</dt>
          <dd>{unlocked ? formatInt(cumacKwhTotal) : '—'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Écoles</dt>
          <dd>{batimentCount}</dd>
        </div>
      </dl>
      <ul className="mt-4 space-y-1 border-t border-line pt-4 text-xs text-ink-muted">
        {CEE_FICHES.map((f) => (
          <li key={f.code} className="flex justify-between">
            <span>{f.label}</span>
            <span className="text-positive-text">{f.gainPct}</span>
          </li>
        ))}
      </ul>
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
    <div className={DOSSIER_BLOCK}>
      <p className="text-sm font-medium text-ink">Regroupement multi-écoles</p>
      <p className="mt-1 text-xs text-ink-muted">
        {isMutualizable ? 'Volume suffisant pour un contrat global' : 'Volume à consolider'}
        {' · '}
        {batimentCount} écoles
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Budget travaux</dt>
          <dd>{unlocked ? formatEur(packCapexTotal, true) : 'Après déblocage'}</dd>
        </div>
        {unlocked && gainNetMairieTotal > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Gain commune / an</dt>
            <dd className="text-positive-text">{formatEur(gainNetMairieTotal, true)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
