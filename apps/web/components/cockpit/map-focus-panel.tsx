'use client';

import Link from 'next/link';
import { X, MapPin, ExternalLink } from 'lucide-react';
import type { MapMarker } from '@/lib/types';
import { formatEur, formatFinancementStatut, formatInt } from '@/lib/format';
import { DpeBadge, TemperatureBadge } from '@/components/cockpit/badges';

export function MapFocusPanel({
  marker,
  onClose,
}: {
  marker: MapMarker;
  onClose: () => void;
}) {
  return (
    <aside className="panel fixed inset-x-0 bottom-16 z-[1000] flex max-h-[55vh] flex-col shadow-2xl animate-fade-in md:absolute md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:max-h-none md:w-[min(100%,380px)] lg:bottom-4">
      <header className="flex items-start justify-between gap-3 border-b border-white/[0.08] p-4 md:p-5">
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-snug text-zinc-50">{marker.nomEcole}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zen-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {marker.commune}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <DpeBadge classe={marker.dpe} />
          <TemperatureBadge label={marker.temperature} level={marker.temperatureLevel} />
        </div>

        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-600">Budget travaux</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
              {formatEur(marker.capex, true)}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-600">Reste à charge</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-zen-teal">
                {formatEur(marker.resteACharge, true)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-600">Économie/an</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-zinc-200">
                {formatEur(marker.gainNetMairie, true)}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-600">Surface</dt>
            <dd className="mt-1 text-base tabular-nums text-zinc-300">
              {formatInt(marker.surfaceM2)} m²
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-600">Financement</dt>
            <dd className="mt-1 text-sm capitalize text-zinc-400">
              {formatFinancementStatut(marker.financementStatut)}
            </dd>
          </div>
          {marker.statutDpe && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-600">Diagnostic</dt>
              <dd className="mt-1 text-sm text-zinc-400">{marker.statutDpe}</dd>
            </div>
          )}
        </dl>
      </div>

      <footer className="space-y-2 border-t border-white/[0.08] p-4 md:p-5">
        <Link
          href={`/admin/epci/${marker.codeEpci}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zen-teal py-2.5 text-sm font-semibold text-zen-bg transition-opacity hover:opacity-90"
        >
          Voir le territoire
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={`/admin/portefeuilles?focus=${marker.id}`}
          className="flex w-full items-center justify-center rounded-xl border border-white/[0.08] py-2.5 text-sm text-zen-muted transition-colors hover:text-zinc-200"
        >
          Ouvrir le suivi dossiers
        </Link>
      </footer>
    </aside>
  );
}
