'use client';

import { useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import type { MarketplaceBuilding } from '@/lib/types';
import { DossierSchoolCards } from '@/components/marketplace/dossier-school-cards';
import { PackSchoolMap } from '@/components/marketplace/pack-school-map';

export function DossierProspectSplit({
  buildings,
  unlocked,
}: {
  buildings: MarketplaceBuilding[];
  unlocked: boolean;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return buildings;
    return buildings.filter(
      (b) =>
        b.publicName.toLowerCase().includes(q) ||
        b.publicCommune.toLowerCase().includes(q) ||
        b.codeUai?.toLowerCase().includes(q),
    );
  }, [buildings, query]);

  const withEmail = buildings.filter((b) => b.emailMairie && !b.detailsHidden).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span>
            <strong className="font-semibold text-slate-900">{filtered.length}</strong> établissements
            {unlocked && withEmail > 0 && (
              <span className="text-slate-400"> · {withEmail} contacts</span>
            )}
          </span>
        </div>
        {unlocked && (
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une école…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
            />
          </label>
        )}
      </div>

      {/* Mobile map */}
      <div className="border-b border-slate-100 p-4 xl:hidden">
        <PackSchoolMap
          buildings={filtered}
          variant="embedded"
          className="h-56 overflow-hidden rounded-xl ring-1 ring-slate-200/80"
          showHeader={false}
        />
      </div>

      {/* Desktop split */}
      <div className="xl:grid xl:grid-cols-[minmax(0,3fr)_minmax(280px,2fr)] xl:divide-x xl:divide-slate-100">
        <div className="max-h-none p-4 md:p-5 xl:max-h-[calc(100vh-8.5rem)] xl:overflow-y-auto xl:overscroll-contain">
          <DossierSchoolCards buildings={filtered} unlocked={unlocked} />
        </div>

        <div className="hidden bg-slate-50/50 p-4 xl:block">
          <div className="sticky top-[7.5rem]">
            <PackSchoolMap
              buildings={filtered}
              variant="embedded"
              className="h-[calc(100vh-8.5rem)] overflow-hidden rounded-xl shadow-lg ring-1 ring-slate-200/80"
              showHeader={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
