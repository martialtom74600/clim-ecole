'use client';

import { motion } from 'framer-motion';
import { SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';

export const DOSSIER_TABS = [
  { id: 'finance', label: '1. Synthèse & Finance' },
  { id: 'prospect', label: '2. Écoles & Contacts' },
  { id: 'exports', label: '3. Exports & CRM' },
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
    <nav className="flex shrink-0 gap-0.5 overflow-x-auto" aria-label="Sections du dossier">
      {DOSSIER_TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'relative shrink-0 whitespace-nowrap px-3 py-2.5 text-xs font-medium',
            'transition-colors duration-200 ease-out',
            'sm:text-sm',
            active === id ? 'text-ink' : 'text-ink-muted hover:text-ink',
          )}
        >
          {label}
          {active === id && (
            <motion.span
              layoutId="dossier-tab-underline"
              className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-ink"
              transition={SPRING}
            />
          )}
        </button>
      ))}
    </nav>
  );
}

export function isDossierTabId(value: string | null): value is DossierTabId {
  return DOSSIER_TABS.some((t) => t.id === value);
}
