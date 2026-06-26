'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CommandPalette, SearchTrigger } from '@/components/layout/command-palette';

function formatSyncTime(mtimeMs: number): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(mtimeMs));
}

export function AppChrome() {
  const pathname = usePathname();
  const [meta, setMeta] = useState<{ rowCount: number; fileMtimeMs: number } | null>(null);
  const [metaError, setMetaError] = useState(false);

  useEffect(() => {
    fetch('/api/meta')
      .then((r) => {
        if (!r.ok) throw new Error('meta fetch failed');
        return r.json();
      })
      .then((data) => {
        setMeta(data);
        setMetaError(false);
      })
      .catch(() => setMetaError(true));
  }, []);

  const isAdminHome = pathname === '/admin';

  return (
    <>
      <CommandPalette />
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-white/[0.08] bg-zen-bg/90 px-4 backdrop-blur-xl md:px-6 lg:px-8">
        <div className="min-w-0 flex-1 md:hidden">
          {!isAdminHome && (
            <p className="truncate text-sm font-medium text-zinc-400">
              {pathname.startsWith('/admin/epci/') ? 'Fiche territoire' : 'Cockpit admin'}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <SearchTrigger />
          <div
            className="flex max-w-[min(100%,280px)] items-center gap-2 rounded-xl border border-white/[0.08] bg-zen-panel px-2.5 py-2 sm:max-w-none sm:px-3.5"
            title={metaError ? 'Impossible de lire le fichier CSV' : undefined}
          >
            <span
              className={`relative flex h-2.5 w-2.5 shrink-0 ${metaError ? 'opacity-50' : ''}`}
            >
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  metaError ? 'bg-zinc-600' : 'bg-emerald-400'
                }`}
              />
            </span>
            <span className="hidden text-sm text-zen-muted sm:inline">
              {metaError ? 'CSV indisponible' : 'CSV à jour'}
            </span>
            {meta && !metaError && (
              <span className="truncate tabular-nums text-xs text-zinc-600 sm:text-sm">
                {meta.rowCount} lignes · {formatSyncTime(meta.fileMtimeMs)}
              </span>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
