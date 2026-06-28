'use client';

import { Mail, MailX, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MarketplaceBuilding, MarketplacePack } from '@/lib/types';
import { COPY } from '@/lib/copy';
import { formatEur } from '@/lib/format';
import { dpeBgClass, dpeLetter } from '@/lib/dpe-colors';
import { cn } from '@/lib/utils';
import {
  BlacklistBuildingButton,
  MairieEmailButton,
} from '@/components/marketplace/dossier-client-tools';
import { useAccountPreferences } from '@/hooks/use-account-preferences';

function sortByClosing(a: MarketplaceBuilding, b: MarketplaceBuilding) {
  return (b.scoreEligibiliteClosing ?? 0) - (a.scoreEligibiliteClosing ?? 0);
}

export function DossierSchoolListDense({
  buildings,
  pack,
  territoryName,
  blacklistUais: blacklistProp,
}: {
  buildings: MarketplaceBuilding[];
  pack?: MarketplacePack;
  territoryName?: string;
  blacklistUais?: string[];
}) {
  const [query, setQuery] = useState('');
  const { prefs, toggleBlacklist } = useAccountPreferences();
  const blacklist = blacklistProp ?? prefs.blacklistUais;

  const sorted = useMemo(() => [...buildings].sort(sortByClosing), [buildings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (b) =>
        b.publicName.toLowerCase().includes(q) ||
        b.publicCommune.toLowerCase().includes(q) ||
        b.codeUai?.toLowerCase().includes(q),
    );
  }, [sorted, query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-line px-3 py-2">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-lg border border-line bg-surface-sunken py-1.5 pl-8 pr-2 text-xs outline-none transition-colors focus:border-ink focus:bg-white"
          />
        </label>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {filtered.length === 0 ? (
          <li className="px-4 py-8 text-center text-xs text-ink-subtle">Aucun résultat</li>
        ) : (
          filtered.map((b, i) => (
            <SchoolRow
              key={b.buildingId}
              building={b}
              rank={i + 1}
              pack={pack}
              territoryName={territoryName}
              blacklisted={Boolean(b.codeUai && blacklist.includes(b.codeUai))}
              onToggleBlacklist={() => b.codeUai && toggleBlacklist(b.codeUai)}
            />
          ))
        )}
      </ul>
    </div>
  );
}

function SchoolRow({
  building: b,
  rank,
  pack,
  territoryName,
  blacklisted,
  onToggleBlacklist,
}: {
  building: MarketplaceBuilding;
  rank: number;
  pack?: MarketplacePack;
  territoryName?: string;
  blacklisted: boolean;
  onToggleBlacklist: () => void;
}) {
  const letter = dpeLetter(b.classeDpe);
  const persona = pack?.personas?.[0] ?? 'btp';

  if (b.detailsHidden) {
    return (
      <li className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="w-4 text-[10px] tabular-nums text-ink-faint">{rank}</span>
        <span className="text-xs tracking-widest text-ink-faint">{b.publicName}</span>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-2 border-b border-line px-3 py-2 text-sm hover:bg-surface-sunken">
      <span className="w-4 shrink-0 text-[10px] tabular-nums text-ink-subtle">{rank}</span>

      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded text-[11px] font-black text-white',
          dpeBgClass(b.classeDpe),
        )}
        title={`DPE ${letter}`}
      >
        {letter}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink">{b.publicName}</p>
        <p className="truncate text-[10px] text-ink-muted">
          {b.publicCommune}
          {b.scoreEligibiliteClosing ? ` · Score ${b.scoreEligibiliteClosing}` : ''}
        </p>
      </div>

      <p className="hidden shrink-0 font-mono text-xs font-semibold tabular-nums text-ink-soft sm:block">
        {formatEur(b.capexTotal, true)}
      </p>

      <div className="flex shrink-0 items-center gap-1">
        {pack && territoryName ? (
          <MairieEmailButton
            building={b}
            territoryName={territoryName}
            packCapexTotal={pack.packCapexTotal}
            gainNetMairieTotal={pack.gainNetMairieTotal}
            persona={persona}
          />
        ) : b.emailMairie ? (
          <a
            href={`mailto:${b.emailMairie}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line bg-white px-2 py-1 text-[11px] font-medium text-ink-soft hover:bg-surface-muted"
          >
            <Mail className="h-3 w-3" />
            <span className="hidden md:inline">Email</span>
          </a>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-ink-subtle" title={COPY.emailMissing}>
            <MailX className="h-3 w-3" />
          </span>
        )}
        <BlacklistBuildingButton
          codeUai={b.codeUai}
          blacklisted={blacklisted}
          onToggle={onToggleBlacklist}
        />
      </div>
    </li>
  );
}
