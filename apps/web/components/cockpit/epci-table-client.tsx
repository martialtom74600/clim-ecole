'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { EpciSummaryRow, ClosingLevel } from '@/lib/types';
import { formatEur, formatInt } from '@/lib/format';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TemperatureBadge, StatutProjetBadge } from '@/components/cockpit/badges';
import { InfoTip } from '@/components/ui/info-tip';
import { EmptyState } from '@/components/ui/empty-state';
import { ChevronRight, Search } from 'lucide-react';

type FilterTemp = 'all' | ClosingLevel;
type FilterStatut = 'all' | 'PROJET_GLOBAL_VALIDE' | 'SOUS_SEUIL_A_CREUSER';

export function EpciTableClient({ rows }: { rows: EpciSummaryRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [temp, setTemp] = useState<FilterTemp>('all');
  const [statut, setStatut] = useState<FilterStatut>('all');
  const [megaOnly, setMegaOnly] = useState(false);

  const filtered = rows.filter((r) => {
    if (megaOnly && r.packCapexTotal <= 1_000_000) return false;
    if (temp !== 'all' && r.temperatureLevel !== temp) return false;
    if (statut !== 'all' && r.statutProjetEpci !== statut) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${r.displayName} ${r.codeEpci} ${r.communesLabel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const chips: { id: string; label: string; active: boolean; onClick: () => void }[] = [
    { id: 'all', label: 'Tous', active: temp === 'all' && !megaOnly && statut === 'all', onClick: () => { setTemp('all'); setMegaOnly(false); setStatut('all'); } },
    { id: 'chaud', label: '🔥 Priorité', active: temp === 'chaud', onClick: () => setTemp(temp === 'chaud' ? 'all' : 'chaud') },
    { id: 'mega', label: '> 1 M€ travaux', active: megaOnly, onClick: () => setMegaOnly(!megaOnly) },
    { id: 'valide', label: 'Pack prêt', active: statut === 'PROJET_GLOBAL_VALIDE', onClick: () => setStatut(statut === 'PROJET_GLOBAL_VALIDE' ? 'all' : 'PROJET_GLOBAL_VALIDE') },
  ];

  function resetFilters() {
    setQuery('');
    setTemp('all');
    setStatut('all');
    setMegaOnly(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher une commune, un territoire…"
            className="input-field pl-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={c.onClick}
              className={cn('chip', c.active && 'chip-active')}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm tabular-nums text-zinc-600">
        {filtered.length} territoire{filtered.length > 1 ? 's' : ''} sur {rows.length}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun territoire trouvé"
          description="Modifiez votre recherche ou retirez un filtre actif."
          action={
            <button type="button" onClick={resetFilters} className="chip chip-active">
              Réinitialiser
            </button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <Link
                key={row.codeEpci}
                href={`/admin/epci/${row.codeEpci}`}
                className="panel panel-hover block p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-100">{row.displayName}</p>
                    {row.communesLabel && (
                      <p className="mt-0.5 text-xs text-zinc-500">{row.communesLabel}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <TemperatureBadge label={row.temperatureGlobale} level={row.temperatureLevel} />
                  <StatutProjetBadge statut={row.statutProjetEpci} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-zinc-600">Budget travaux</p>
                    <p className="font-semibold tabular-nums text-zinc-100">
                      {formatEur(row.packCapexTotal, true)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600">Écoles</p>
                    <p className="font-semibold tabular-nums text-zinc-100">
                      {formatInt(row.batimentCount)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Card className="hidden overflow-hidden transition-all duration-200 hover:border-white/[0.12] md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>
                    <InfoTip label="Nom du regroupement de communes — ton interlocuteur public.">
                      Territoire
                    </InfoTip>
                  </TableHead>
                  <TableHead className="text-right">
                    <InfoTip label="Nombre d’écoles primaires rattachées à ce territoire.">
                      Écoles
                    </InfoTip>
                  </TableHead>
                  <TableHead className="text-right">
                    <InfoTip label="Budget total des travaux si toutes les écoles du territoire sont regroupées.">
                      Budget travaux
                    </InfoTip>
                  </TableHead>
                  <TableHead className="text-right">
                    <InfoTip label="Économie annuelle estimée pour la collectivité après rénovation.">
                      Économie/an
                    </InfoTip>
                  </TableHead>
                  <TableHead>
                    <InfoTip label="🔥 = à traiter vite · ⚡ = moyen · ❄ = moins urgent.">
                      Urgence
                    </InfoTip>
                  </TableHead>
                  <TableHead>
                    <InfoTip label="Pack prêt = assez de volume. À grouper = peut-être trop petit pour l’instant.">
                      Statut
                    </InfoTip>
                  </TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow
                    key={row.codeEpci}
                    className="group cursor-pointer"
                    onClick={() => router.push(`/admin/epci/${row.codeEpci}`)}
                  >
                    <TableCell>
                      <p className="font-medium text-zinc-100 transition-colors group-hover:text-zen-teal-dim">
                        {row.displayName}
                      </p>
                      {row.communesLabel && (
                        <p className="mt-0.5 text-[11px] text-zinc-500">{row.communesLabel}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(row.batimentCount)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-zinc-100">
                      {formatEur(row.packCapexTotal, true)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-zinc-400">
                      {formatEur(row.gainNetMairieTotal, true)}/an
                    </TableCell>
                    <TableCell>
                      <TemperatureBadge
                        label={row.temperatureGlobale}
                        level={row.temperatureLevel}
                      />
                    </TableCell>
                    <TableCell>
                      <StatutProjetBadge statut={row.statutProjetEpci} />
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-zinc-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-zen-teal-dim" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
