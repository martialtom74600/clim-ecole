'use client';

import { CheckCircle2, Kanban, Mail, Star, X } from 'lucide-react';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { SALES_PLAYBOOK } from '@/lib/gtm';
import { PackExportActions } from '@/components/marketplace/pack-export-actions';

const STEPS = [
  {
    n: 1,
    title: 'Sourcing (R2111-1)',
    body: 'Consultation préalable mairie — one-pager RAC + MGPE joint. Pas encore d\'AO.',
    href: '#prospecter',
  },
  {
    n: 2,
    title: 'Montage financier',
    body: 'Empilez Fonds Vert + DETR + CEE. Simulateur RAC et scénarios pessimiste/optimiste.',
    href: '?tab=finance',
  },
  {
    n: 3,
    title: 'Closing & pipeline',
    body: 'RDV conseil municipal avec note PDF. Pipeline Contacté → RDV → Gagné.',
    href: '/compte',
  },
];

export function PostPurchaseChecklist({
  packId,
  onDismiss,
}: {
  packId: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3 md:px-6">
        <CheckCircle2 className="h-4 w-4 text-positive" />
        <span className="text-sm font-semibold text-ink">{COPY.unlocked} — playbook commercial</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            Masquer
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid gap-px bg-line md:grid-cols-3">
        {STEPS.map(({ n, title, body, href }) => (
          <div key={n} className="bg-white px-5 py-3.5 md:px-6">
            <div className="flex items-baseline gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-bold text-ink-muted">
                {n}
              </span>
              <p className="font-semibold text-ink">{title}</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{body}</p>
            {href.startsWith('/') ? (
              <Link href={href} className="mt-2 inline-block text-xs font-medium text-ink-soft underline underline-offset-2 hover:text-ink">
                Voir →
              </Link>
            ) : (
              <a href={href} className="mt-2 inline-block text-xs font-medium text-ink-soft underline underline-offset-2 hover:text-ink">
                Voir →
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-px border-t border-line bg-line lg:grid-cols-[3fr_2fr]">
        <div className="bg-white px-5 py-4 md:px-6">
          <p className="mb-3 label-caps">Téléchargements</p>
          <PackExportActions packId={packId} />
        </div>
        <div className="flex flex-col justify-center gap-2 bg-white px-5 py-4 md:px-6">
          <div className="flex flex-wrap gap-2">
            <Link href="/compte" className="btn-secondary !py-1.5 text-sm">
              <Kanban className="h-4 w-4" />
              Pipeline
            </Link>
            <Link href={`/explorer/${packId}/one-pager`} className="btn-secondary !py-1.5 text-sm">
              One-pager mairie
            </Link>
            <Link href="/explorer" className="btn-ghost !py-1.5 text-sm">
              <Star className="h-4 w-4" />
              Autres territoires
            </Link>
            <a href="#prospecter" className="btn-ghost !py-1.5 text-sm">
              <Mail className="h-4 w-4" />
              Contacts
            </a>
          </div>
        </div>
      </div>

      <details className="border-t border-line px-5 py-3 md:px-6">
        <summary className="cursor-pointer label-caps hover:text-ink">
          Playbook GTM complet ({SALES_PLAYBOOK.length} phases)
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SALES_PLAYBOOK.map((phase) => (
            <div key={phase.phase} className="rounded-lg border border-line bg-surface-sunken p-3">
              <p className="text-sm font-semibold text-ink">{phase.phase}</p>
              <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                {phase.steps.map((s) => (
                  <li key={s} className="flex gap-1.5">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-ink-subtle" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
