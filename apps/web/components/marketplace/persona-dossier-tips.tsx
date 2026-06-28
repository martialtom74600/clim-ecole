'use client';

import { HardHat, Landmark, Ruler } from 'lucide-react';
import { PERSONA_DOSSIER_TIPS } from '@/lib/site-guide';
import type { ClientPersona } from '@/lib/brand';
import { cn } from '@/lib/utils';

const ICONS = { btp: HardHat, be: Ruler, amo: Landmark } as const;

const ACCENT = {
  btp: 'border-violet-200 bg-violet-50/50',
  be: 'border-sky-200 bg-sky-50/50',
  amo: 'border-emerald-200 bg-emerald-50/50',
} as const;

export function PersonaDossierTips({ personas }: { personas: ClientPersona[] }) {
  const ordered = (['btp', 'be', 'amo'] as const).filter((p) => personas.includes(p));

  if (!ordered.length) return null;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {ordered.map((persona) => {
        const block = PERSONA_DOSSIER_TIPS[persona];
        const Icon = ICONS[persona];
        return (
          <div
            key={persona}
            className={cn('rounded-xl border p-4', ACCENT[persona])}
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Icon className="h-4 w-4" />
              {block.title}
            </p>
            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-600">
              {block.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
