'use client';

import { useEffect, useRef, useState } from 'react';
import { CornerDownLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { MarketplacePack } from '@/lib/types';
import { DURATION, EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';

type SearchHit = {
  packId: string;
  name: string;
  department: string;
  budgetRange: string;
  radarGrade: string;
};

export function ExplorerSearchBar({
  onSelect,
  className,
}: {
  onSelect?: (packId: string) => void;
  className?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  /* ⌘K / Ctrl+K — focus instantané sur la recherche (façon Spotlight). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/explorer/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        setHits(await res.json());
        setActive(0);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function go(hit: SearchHit) {
    onSelect?.(hit.packId);
    setOpen(false);
    setQuery('');
    router.push(`/explorer/${hit.packId}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!hits.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === 'Enter' && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    }
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder="Rechercher un territoire…"
        className="w-full rounded-lg border border-line bg-white py-2 pl-8 pr-12 text-sm text-ink outline-none transition-shadow placeholder:text-ink-subtle focus:border-ink focus:shadow-focus"
      />
      {!query && (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-subtle">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      )}
      <AnimatePresence>
        {open && hits.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: DURATION.fast, ease: EASE.out }}
            className="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-line bg-white/95 p-1 shadow-overlay backdrop-blur-md backdrop-saturate-150"
          >
            {hits.map((h, i) => (
              <li key={h.packId}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(h);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    i === active ? 'bg-surface-muted' : 'hover:bg-surface-muted',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{h.name}</span>
                    <span className="block truncate text-xs text-ink-muted">
                      {h.department} · {h.budgetRange} · {h.radarGrade}
                    </span>
                  </span>
                  {i === active && (
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Panneau coulissant des filtres avancés — glisse depuis la droite,
 * réduisant la charge visuelle du panneau principal de l'explorateur.
 */
export function ExplorerFilterSheet({
  open,
  onClose,
  activeCount = 0,
  children,
}: {
  open: boolean;
  onClose: () => void;
  activeCount?: number;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE.out }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-sm"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Filtres avancés"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: DURATION.base, ease: EASE.out }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-sm flex-col border-l border-line bg-white shadow-overlay"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-ink" />
                <h2 className="text-sm font-semibold text-ink">Filtres avancés</h2>
                {activeCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-bold text-white">
                    {activeCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function ExplorerAdvancedFilters({
  minCapex,
  minGrade,
  aoOnly,
  mutualizableOnly,
  minCeeEuros,
  onMinCapexChange,
  onMinGradeChange,
  onAoOnlyChange,
  onMutualizableOnlyChange,
  onMinCeeEurosChange,
}: {
  minCapex: number;
  minGrade: 'A' | 'B' | 'C' | 'D' | 'all';
  aoOnly: boolean;
  mutualizableOnly: boolean;
  minCeeEuros: number;
  onMinCapexChange: (v: number) => void;
  onMinGradeChange: (v: 'A' | 'B' | 'C' | 'D' | 'all') => void;
  onAoOnlyChange: (v: boolean) => void;
  onMutualizableOnlyChange: (v: boolean) => void;
  onMinCeeEurosChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-line bg-surface-sunken/50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Filtres avancés</p>
      <label className="block text-xs">
        <span className="text-ink-muted">Budget min. (€)</span>
        <input
          type="number"
          step={50000}
          value={minCapex || ''}
          onChange={(e) => onMinCapexChange(Number(e.target.value) || 0)}
          className="input-field mt-1 !py-1.5 !text-xs"
          placeholder="400000"
        />
      </label>
      <label className="block text-xs">
        <span className="text-ink-muted">Score min.</span>
        <select
          value={minGrade}
          onChange={(e) => onMinGradeChange(e.target.value as typeof minGrade)}
          className="input-field mt-1 !py-1.5 !text-xs"
        >
          <option value="all">Tous</option>
          <option value="A">A minimum</option>
          <option value="B">B minimum</option>
          <option value="C">C minimum</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs text-ink-muted">
        <input type="checkbox" checked={aoOnly} onChange={(e) => onAoOnlyChange(e.target.checked)} />
        AO actif uniquement
      </label>
      <label className="flex items-center gap-2 text-xs text-ink-muted">
        <input
          type="checkbox"
          checked={mutualizableOnly}
          onChange={(e) => onMutualizableOnlyChange(e.target.checked)}
        />
        Mutualisable ESCO (5+ écoles)
      </label>
      <label className="block text-xs">
        <span className="text-ink-muted">CEE min. (€)</span>
        <input
          type="number"
          step={5000}
          value={minCeeEuros || ''}
          onChange={(e) => onMinCeeEurosChange(Number(e.target.value) || 0)}
          className="input-field mt-1 !py-1.5 !text-xs"
          placeholder="25000"
        />
      </label>
    </div>
  );
}

export function ExplorerCoveragePanel({ packs }: { packs: MarketplacePack[] }) {
  const deptSet = new Set(packs.map((p) => p.department.split('·')[0]?.trim()).filter(Boolean));
  return (
    <details className="rounded-lg border border-line bg-white/90">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink-muted">
        Couverture · {deptSet.size} départements · {packs.length} territoires
      </summary>
      <p className="border-t border-line px-3 py-2 text-[11px] leading-relaxed text-ink-subtle">
        Extension progressive dept par dept. Les départements sans pastille seront ajoutés au fil des
        synchronisations pipeline.
      </p>
    </details>
  );
}

export function OnboardingModal({
  open,
  onComplete,
  onSkip,
}: {
  open: boolean;
  onComplete: (persona: 'btp' | 'be' | 'amo' | 'esco' | 'cee', minCapex: number) => void;
  onSkip: () => void;
}) {
  const [persona, setPersona] = useState<'btp' | 'be' | 'amo' | 'esco' | 'cee'>('btp');
  const [minCapex, setMinCapex] = useState(400000);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onSkip]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onSkip}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Personnaliser l'explorateur"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-pop"
      >
        <button
          type="button"
          onClick={onSkip}
          aria-label="Fermer"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold text-ink">Bienvenue sur Clim École</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Personnalisez votre explorateur en 2 clics — ou explorez librement.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-ink-muted">Votre métier</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['btp', 'be', 'amo', 'esco', 'cee'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPersona(p)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase transition-colors ${
                    persona === p
                      ? 'border-ink bg-ink text-white'
                      : 'border-line text-ink-soft hover:border-line-strong'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-xs font-medium text-ink-muted">
            Budget cible minimum (€)
            <input
              type="number"
              step={50000}
              value={minCapex}
              onChange={(e) => setMinCapex(Number(e.target.value))}
              className="input-field mt-1.5"
            />
          </label>
        </div>
        <button
          type="button"
          className="btn-primary mt-6 w-full"
          onClick={() => onComplete(persona, minCapex)}
        >
          Commencer
        </button>
        <button
          type="button"
          className="mt-2 w-full text-center text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          onClick={onSkip}
        >
          Explorer sans filtrer
        </button>
      </div>
    </div>
  );
}
