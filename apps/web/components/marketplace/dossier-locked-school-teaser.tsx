'use client';

import { Lock, Mail } from 'lucide-react';
import type { MarketplaceBuilding } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { COPY } from '@/lib/copy';
import { dpeBgClass, dpeLetter } from '@/lib/dpe-colors';
import { cn } from '@/lib/utils';

const DPE_ORDER = ['G', 'F', 'E', 'D', 'C', 'B', 'A'];

function buildDpeHistogram(buildings: MarketplaceBuilding[]) {
  const counts: Record<string, number> = {};
  for (const b of buildings) {
    const letter = dpeLetter(b.classeDpe);
    if (letter === '?') continue;
    counts[letter] = (counts[letter] ?? 0) + 1;
  }
  const max = Math.max(...Object.values(counts), 1);
  return DPE_ORDER.filter((l) => counts[l]).map((letter) => ({
    letter,
    count: counts[letter] ?? 0,
    pct: ((counts[letter] ?? 0) / max) * 100,
  }));
}

export function DossierLockedSchoolTeaser({
  buildings,
  preview,
  embedded = false,
}: {
  buildings: MarketplaceBuilding[];
  preview?: TerritoryFreePreview;
  embedded?: boolean;
}) {
  const histogram = buildDpeHistogram(buildings);
  const previewRows = buildings.slice(0, embedded ? 12 : 8);

  return (
    <div
      className={cn(
        embedded ? 'flex h-full min-h-0 flex-col' : 'overflow-hidden rounded-xl border border-slate-200 bg-white',
      )}
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {buildings.length} établissement{buildings.length > 1 ? 's' : ''} scolaire
              {buildings.length > 1 ? 's' : ''}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Profil DPE visible · noms, contacts et montants après déblocage
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
            <Lock className="h-3 w-3" />
            {COPY.masked}
          </span>
        </div>

        {histogram.length > 0 && (
          <div className="mt-4 flex items-end gap-1.5">
            {histogram.map(({ letter, count, pct }) => (
              <div key={letter} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-16 w-full items-end justify-center">
                  <div
                    className={cn('w-full max-w-[2rem] rounded-t', dpeBgClass(letter))}
                    style={{ height: `${Math.max(pct, 12)}%` }}
                    title={`DPE ${letter} · ${count}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-700">{letter}</span>
                <span className="text-[10px] tabular-nums text-slate-400">{count}</span>
              </div>
            ))}
          </div>
        )}

        {preview && (
          <p className="mt-3 text-xs text-slate-500">{preview.dpeProfile.label}</p>
        )}
      </div>

      <ul className={cn('divide-y divide-slate-50', embedded && 'min-h-0 flex-1 overflow-y-auto')}>
        {previewRows.map((b, i) => (
          <li key={b.buildingId} className="flex items-center gap-3 px-5 py-3">
            <span className="w-5 text-[11px] tabular-nums text-slate-300">{i + 1}</span>
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-black text-white',
                dpeBgClass(b.classeDpe),
              )}
            >
              {dpeLetter(b.classeDpe)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs tracking-[0.2em] text-slate-300">••••••••</p>
              <p className="text-[10px] text-slate-400">{b.publicCommune}</p>
            </div>
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <span className="text-[10px] text-slate-300">CAPEX · •••</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-300">
                <Mail className="h-3 w-3" />
                Contact
              </span>
            </div>
          </li>
        ))}
      </ul>

      {buildings.length > previewRows.length && (
        <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center text-xs text-slate-500">
          + {buildings.length - previewRows.length} établissement
          {buildings.length - previewRows.length > 1 ? 's' : ''} dans le dossier complet
        </p>
      )}
    </div>
  );
}

export function DossierFreeVsUnlockedTable() {
  const rows = [
    { label: 'Score Radar & priorité', free: true },
    { label: 'Tranche budget & subventions', free: true },
    { label: 'Profil DPE du territoire', free: true },
    { label: 'Montants exacts (CAPEX, RAC, Fonds Vert)', free: false },
    { label: 'Noms des écoles & contacts mairies', free: false },
    { label: 'Simulateur financement & argumentaire MGPE', free: false },
    { label: 'Exports CSV, PDF & dossier MGPE', free: false },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Gratuit vs débloqué</h2>
        <p className="mt-1 text-xs text-slate-500">
          L&apos;aperçu gratuit suffit pour prioriser — le déblocage sert à prospecter.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="px-5 py-2.5 font-medium">Contenu</th>
              <th className="px-3 py-2.5 text-center font-medium">Gratuit</th>
              <th className="px-5 py-2.5 text-center font-medium">Débloqué</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, free }) => (
              <tr key={label} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-2.5 text-slate-600">{label}</td>
                <td className="px-3 py-2.5 text-center">
                  {free ? (
                    <span className="text-emerald-600">✓</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-5 py-2.5 text-center text-emerald-600">✓</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
