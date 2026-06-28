'use client';

import { HardHat, Landmark, Leaf, Ruler, Zap } from 'lucide-react';
import { PERSONA_DOSSIER_TIPS } from '@/lib/site-guide';
import type { ClientPersona } from '@/lib/brand';

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
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
      {ordered.map((persona) => {
        const block = PERSONA_DOSSIER_TIPS[persona];
        const Icon = ICONS[persona];
        return (
          <div key={persona} className="rounded-xl border border-line bg-white p-4 shadow-card">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-muted text-ink-soft">
                <Icon className="h-4 w-4" />
              </span>
              {block.title}
            </p>
            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-muted">
              {block.tips.map((tip) => (
                <li key={tip} className="flex gap-1.5">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-ink-subtle" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
