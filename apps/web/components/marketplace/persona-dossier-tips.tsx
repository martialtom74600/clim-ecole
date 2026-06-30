'use client';

import { HardHat, Landmark, Leaf, Ruler, Zap } from 'lucide-react';
import { PERSONA_DOSSIER_TIPS } from '@/lib/site-guide';
import type { ClientPersona } from '@/lib/brand';
import { DOSSIER_SECTION, DOSSIER_SECTION_TITLE } from '@/lib/dossier-ui';

const ICONS = {
  btp: HardHat,
  be: Ruler,
  amo: Landmark,
  esco: Zap,
  cee: Leaf,
} as const;

const ORDER: ClientPersona[] = ['btp', 'be', 'amo', 'esco', 'cee'];

export function PersonaDossierTips({ personas }: { personas: ClientPersona[] }) {
  const ordered = ORDER.filter((p) => personas.includes(p));

  if (!ordered.length) return null;

  return (
    <section className={DOSSIER_SECTION}>
      <h2 className={DOSSIER_SECTION_TITLE}>Conseils selon votre métier</h2>
      <ul className="mt-6 divide-y divide-line rounded-lg border border-line">
        {ordered.map((persona) => {
          const block = PERSONA_DOSSIER_TIPS[persona];
          const Icon = ICONS[persona];
          return (
            <li key={persona} className="px-4 py-4">
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                <Icon className="h-4 w-4 text-ink-subtle" />
                {block.title}
              </p>
              <ul className="mt-2 space-y-1 pl-6 text-sm text-ink-muted">
                {block.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
