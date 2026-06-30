'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** Sections du dossier — ordre narratif : verdict → terrain → financement → action. */
export const DOSSIER_SECTIONS = [
  { id: 'verdict', label: 'Verdict' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'financement', label: 'Financement' },
  { id: 'action', label: 'Action' },
] as const;

export type DossierSectionId = (typeof DOSSIER_SECTIONS)[number]['id'];

/** Rétrocompat URL ?tab=finance|prospect|exports */
const LEGACY_TAB_MAP: Record<string, DossierSectionId> = {
  finance: 'financement',
  prospect: 'terrain',
  exports: 'action',
};

export function legacyTabToSection(tab: string | null): DossierSectionId | null {
  if (!tab) return null;
  if (DOSSIER_SECTIONS.some((s) => s.id === tab)) return tab as DossierSectionId;
  return LEGACY_TAB_MAP[tab] ?? null;
}

export function isDossierSectionId(value: string | null): value is DossierSectionId {
  return DOSSIER_SECTIONS.some((s) => s.id === value);
}

export function scrollToDossierSection(id: DossierSectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 160;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

export function DossierSectionNav({
  active,
  onChange,
}: {
  active: DossierSectionId;
  onChange: (id: DossierSectionId) => void;
}) {
  return (
    <nav className="flex shrink-0 gap-0.5 overflow-x-auto" aria-label="Sections du dossier">
      {DOSSIER_SECTIONS.map(({ id, label }) => (
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
              layoutId="dossier-section-underline"
              className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-ink"
              transition={SPRING}
            />
          )}
        </button>
      ))}
    </nav>
  );
}

/** Scroll-spy — met à jour la section active au fil du défilement. */
export function useDossierSectionSpy(defaultSection: DossierSectionId = 'verdict') {
  const [active, setActive] = useState<DossierSectionId>(defaultSection);

  useEffect(() => {
    const ids = DOSSIER_SECTIONS.map((s) => s.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id && isDossierSectionId(visible[0].target.id)) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const navigate = useCallback((id: DossierSectionId) => {
    setActive(id);
    scrollToDossierSection(id);
  }, []);

  return { active, setActive, navigate };
}

/** @deprecated Utiliser DossierSectionNav — conservé pour rétrocompat imports. */
export const DOSSIER_TABS = DOSSIER_SECTIONS.map((s, i) => ({
  id: s.id === 'financement' ? 'finance' : s.id === 'terrain' ? 'prospect' : s.id === 'action' ? 'exports' : s.id,
  label: `${i + 1}. ${s.label}`,
})) as unknown as { id: string; label: string }[];

export const DossierAppTabs = DossierSectionNav;
export type DossierTabId = DossierSectionId;
export function isDossierTabId(value: string | null): value is DossierTabId {
  return isDossierSectionId(value) || legacyTabToSection(value) != null;
}
