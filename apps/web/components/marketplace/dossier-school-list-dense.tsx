'use client';

import { Mail, MailX, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MarketplaceBuilding, MarketplacePack } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { COPY } from '@/lib/copy';
import { formatEur, formatInt } from '@/lib/format';
import { narrativeBudget } from '@/lib/narrative-copy';
import { dpeBgClass, dpeLetter, dpeTextClass } from '@/lib/dpe-colors';
import { GlossaryTerm } from '@/components/ui/glossary-term';
import { cn } from '@/lib/utils';
import { DossierInlinePaywall } from '@/components/marketplace/dossier-inline-paywall';
import {
  BlacklistBuildingButton,
  MairieEmailButton,
} from '@/components/marketplace/dossier-client-tools';
import { useAccountPreferences } from '@/hooks/use-account-preferences';

const FREE_PREVIEW_COUNT = 2;

function sortByCapex(a: MarketplaceBuilding, b: MarketplaceBuilding) {
  return b.capexTotal - a.capexTotal;
}

export function DossierSchoolListDense({
  buildings,
  pack,
  territoryName,
  blacklistUais: blacklistProp,
  locked = false,
  freePreview,
  paywallPack,
  paywallSoldOut,
}: {
  buildings: MarketplaceBuilding[];
  pack?: MarketplacePack;
  territoryName?: string;
  blacklistUais?: string[];
  locked?: boolean;
  freePreview?: TerritoryFreePreview;
  paywallPack?: MarketplacePack;
  paywallSoldOut?: boolean;
}) {
  const [query, setQuery] = useState('');
  const { prefs, toggleBlacklist } = useAccountPreferences();
  const blacklist = blacklistProp ?? prefs.blacklistUais;

  const sorted = useMemo(() => [...buildings].sort(sortByCapex), [buildings]);

  const filtered = useMemo(() => {
    if (locked) return sorted;
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (b) =>
        b.publicName.toLowerCase().includes(q) ||
        b.publicCommune.toLowerCase().includes(q) ||
        b.codeUai?.toLowerCase().includes(q),
    );
  }, [sorted, query, locked]);

  const visibleSchools = locked ? filtered.slice(0, FREE_PREVIEW_COUNT) : filtered;
  const hiddenSchools = locked ? filtered.slice(FREE_PREVIEW_COUNT) : [];

  return (
    <div className="flex flex-col">
      <div className="border-b border-line px-6 py-5">
        <p className="text-sm font-semibold text-ink">Écoles du territoire</p>
        <p className="text-xs text-ink-muted">
          {formatInt(filtered.length)} établissement{filtered.length > 1 ? 's' : ''}
          {territoryName ? ` · ${territoryName}` : ''}
          {locked && freePreview && ` · ${freePreview.dpeProfile.label}`}
        </p>
        {!locked && (
          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher une école ou une commune…"
              className="w-full rounded-lg border border-line bg-surface-sunken py-2 pl-8 pr-2 text-sm outline-none transition-colors focus:border-ink focus:bg-white"
            />
          </label>
        )}
        {locked && (
          <p className="mt-2 text-[11px] text-ink-muted">
            Les <GlossaryTerm term="DPE">diagnostics énergétiques</GlossaryTerm> sont visibles.
            Noms et contacts après déblocage.
          </p>
        )}
      </div>

      {/* Écoles toujours visibles (les 2 premières en mode verrouillé, toutes en mode débloqué) */}
      {filtered.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-ink-subtle">Aucun résultat</div>
      ) : (
        <ul className="divide-y divide-line">
          {visibleSchools.map((b) => (
            <SchoolCard
              key={b.buildingId}
              building={b}
              pack={pack}
              territoryName={territoryName}
              blacklisted={Boolean(b.codeUai && blacklist.includes(b.codeUai))}
              onToggleBlacklist={() => b.codeUai && toggleBlacklist(b.codeUai)}
              locked={locked}
            />
          ))}
        </ul>
      )}

      {/* Écoles restantes : floutées + overlay paywall */}
      {locked && hiddenSchools.length > 0 && (
        <div className="relative">
          <ul className="divide-y divide-line select-none">
            {hiddenSchools.map((b) => (
              <SchoolCard
                key={b.buildingId}
                building={b}
                pack={pack}
                territoryName={territoryName}
                blacklisted={false}
                onToggleBlacklist={() => undefined}
                locked={locked}
                blurred
              />
            ))}
          </ul>
          {/* Dégradé masquant les écoles floutées */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent to-white/90" />
          {paywallPack && (
            <DossierInlinePaywall
              pack={paywallPack}
              soldOut={paywallSoldOut}
              title={`Débloquez les ${filtered.length} contacts directs pour 290 €`}
              subtitle="Emails mairies, noms des écoles et budgets précis — tout ce qu'il faut pour prospecter."
            />
          )}
        </div>
      )}

      {/* Cas particulier : territoire avec seulement 1-2 écoles, toutes déjà visibles */}
      {locked && hiddenSchools.length === 0 && paywallPack && filtered.length > 0 && (
        <div className="relative min-h-[8rem]">
          <DossierInlinePaywall
            pack={paywallPack}
            soldOut={paywallSoldOut}
            title="Débloquez les contacts directs pour 290 €"
            subtitle="Emails mairies, noms des écoles et budgets précis — tout ce qu'il faut pour prospecter."
          />
        </div>
      )}
    </div>
  );
}

function SchoolCard({
  building: b,
  pack,
  territoryName,
  blacklisted,
  onToggleBlacklist,
  locked,
  blurred = false,
}: {
  building: MarketplaceBuilding;
  pack?: MarketplacePack;
  territoryName?: string;
  blacklisted: boolean;
  onToggleBlacklist: () => void;
  locked: boolean;
  blurred?: boolean;
}) {
  const letter = dpeLetter(b.classeDpe);
  const persona = pack?.personas?.[0] ?? 'btp';

  const displayName = locked || b.detailsHidden ? '████████' : b.publicName;
  const displayCommune = locked || b.detailsHidden ? 'Commune masquée' : b.publicCommune;

  return (
    <li
      className={cn(
        'flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start',
        blacklisted && 'opacity-50',
        blurred && 'blur-sm',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black',
            dpeBgClass(b.classeDpe),
            dpeTextClass(b.classeDpe),
          )}
          title={`Diagnostic énergétique : ${letter}`}
        >
          {letter}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-ink">{displayName}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{displayCommune}</p>
        </div>
      </div>

      {!locked && !b.detailsHidden && (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <div className="col-span-2">
              <dt className="text-ink-subtle">Budget travaux estimé</dt>
              <dd className="text-xs leading-relaxed text-ink">
                {pack
                  ? narrativeBudget(b.capexTotal, 1).replace('Les travaux sur 1 école représentent environ ', 'Environ ')
                  : formatEur(b.capexTotal, true)}
              </dd>
            </div>
            {b.surfaceM2 > 0 && (
              <div>
                <dt className="text-ink-subtle">Surface</dt>
                <dd className="font-mono tabular-nums text-ink">{formatInt(b.surfaceM2)} m²</dd>
              </div>
            )}
          </dl>

          <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-2.5">
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
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-line bg-surface-sunken px-2 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted"
              >
                <Mail className="h-3.5 w-3.5" />
                Contacter la mairie
              </a>
            ) : (
              <span
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-dashed border-line px-2 py-1.5 text-xs text-ink-subtle"
                title={COPY.emailMissing}
              >
                <MailX className="h-3.5 w-3.5" />
                Email non trouvé
              </span>
            )}
            <BlacklistBuildingButton
              codeUai={b.codeUai}
              blacklisted={blacklisted}
              onToggle={onToggleBlacklist}
            />
          </div>
        </>
      )}

      {locked && (
        <p className="mt-3 text-[10px] text-ink-subtle">
          Budget et contact mairie — après déblocage
        </p>
      )}
    </li>
  );
}
