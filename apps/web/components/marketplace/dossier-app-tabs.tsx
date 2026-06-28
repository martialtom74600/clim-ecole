'use client';

import { cn } from '@/lib/utils';

export const DOSSIER_TABS = [
  { id: 'finance', label: 'Finance & Stratégie' },
  { id: 'prospect', label: 'Prospection' },
  { id: 'exports', label: 'Exports & CRM' },
] as const;

export type DossierTabId = (typeof DOSSIER_TABS)[number]['id'];

export function DossierAppTabs({
  active,
  onChange,
}: {
  active: DossierTabId;
  onChange: (tab: DossierTabId) => void;
}) {
  return (
    <nav
      className="flex shrink-0 gap-1 border-b border-slate-200 bg-white px-4"
      aria-label="Sections du dossier"
    >
      {DOSSIER_TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'relative px-3 py-2.5 text-sm font-medium transition-colors',
            active === id
              ? 'text-slate-900 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-slate-900'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

export function isDossierTabId(value: string | null): value is DossierTabId {
  return DOSSIER_TABS.some((t) => t.id === value);
}
