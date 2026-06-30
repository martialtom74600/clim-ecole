'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, GraduationCap, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/lib/types';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as SearchResult[];
        setResults(data);
        setActive(0);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
      if (e.key === 'Enter' && results[active]) {
        e.preventDefault();
        go(results[active].href);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, active, go]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-start sm:px-4 sm:pt-[12vh]">
      <button
        type="button"
        aria-label="Fermer la recherche"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recherche"
        className="panel relative w-full max-w-xl overflow-hidden shadow-pop animate-fade-in sm:rounded-2xl rounded-t-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search className="h-5 w-5 shrink-0 text-ink-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une école, une commune, un territoire…"
            className="flex-1 bg-transparent py-4 text-[15px] text-ink outline-none placeholder:text-ink-subtle"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-ink-subtle hover:text-ink"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {query.length < 2 && (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">
              Tapez au moins 2 caractères · ↑↓ pour naviguer · Entrée pour ouvrir
            </p>
          )}
          {loading && query.length >= 2 && (
            <p className="px-3 py-4 text-center text-xs text-ink-subtle">Recherche…</p>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-ink-subtle">Aucun résultat</p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.id}`}
              type="button"
              onClick={() => go(r.href)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150',
                i === active ? 'bg-ink/5 text-ink' : 'text-ink-muted hover:bg-surface-sunken',
              )}
            >
              {r.type === 'epci' ? (
                <Building2 className="h-4 w-4 shrink-0 text-ink-soft" />
              ) : (
                <GraduationCap className="h-4 w-4 shrink-0 text-ink-subtle" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{r.title}</p>
                <p className="truncate text-sm text-ink-muted">{r.subtitle}</p>
              </div>
              {r.meta && (
                <span className="shrink-0 text-[10px] text-ink-subtle">{r.meta}</span>
              )}
            </button>
          ))}
        </div>

        <div className="hidden border-t border-line px-4 py-2 text-[10px] text-ink-muted sm:block">
          <kbd className="rounded border border-line bg-surface-muted px-1.5 py-0.5">⌘K</kbd>
          {' '}pour ouvrir · Esc pour fermer
        </div>
      </div>
    </div>
  );
}

export function SearchTrigger() {
  return (
    <>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface p-2.5 text-ink-muted transition-all duration-200 hover:border-line-strong hover:text-ink sm:hidden"
        aria-label="Rechercher"
      >
        <Search className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
        className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink-muted transition-all duration-200 hover:border-line-strong hover:text-ink sm:flex"
      >
        <Search className="h-3.5 w-3.5" />
        Rechercher
        <kbd className="rounded border border-line bg-surface-muted px-1 py-0.5 text-[10px]">⌘K</kbd>
      </button>
    </>
  );
}
