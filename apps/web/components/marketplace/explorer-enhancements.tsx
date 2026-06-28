'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import type { MarketplacePack } from '@/lib/types';

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
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/explorer/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) setHits(await res.json());
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className={`relative ${className ?? ''}`}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-radar-muted" />
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Rechercher un territoire…"
        className="w-full rounded-lg border border-radar-border bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-radar-text"
      />
      {open && hits.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-radar-border bg-white py-1 shadow-lg">
          {hits.map((h) => (
            <li key={h.packId}>
              <Link
                href={`/explorer/${h.packId}`}
                onClick={() => {
                  onSelect?.(h.packId);
                  setOpen(false);
                  setQuery('');
                }}
                className="block px-3 py-2 text-sm hover:bg-radar-canvas"
              >
                <span className="font-medium">{h.name}</span>
                <span className="ml-2 text-xs text-radar-muted">
                  {h.department} · {h.budgetRange} · {h.radarGrade}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
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
    <div className="space-y-2 rounded-lg border border-radar-border bg-radar-canvas/50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-radar-subtle">Filtres avancés</p>
      <label className="block text-xs">
        <span className="text-radar-muted">Budget min. (€)</span>
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
        <span className="text-radar-muted">Score min.</span>
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
      <label className="flex items-center gap-2 text-xs text-radar-muted">
        <input type="checkbox" checked={aoOnly} onChange={(e) => onAoOnlyChange(e.target.checked)} />
        AO actif uniquement
      </label>
      <label className="flex items-center gap-2 text-xs text-radar-muted">
        <input
          type="checkbox"
          checked={mutualizableOnly}
          onChange={(e) => onMutualizableOnlyChange(e.target.checked)}
        />
        Mutualisable ESCO (5+ écoles)
      </label>
      <label className="block text-xs">
        <span className="text-radar-muted">CEE min. (€)</span>
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
    <details className="rounded-lg border border-radar-border bg-white/90">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-radar-muted">
        Couverture · {deptSet.size} départements · {packs.length} territoires
      </summary>
      <p className="border-t border-radar-border px-3 py-2 text-[11px] leading-relaxed text-radar-subtle">
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
