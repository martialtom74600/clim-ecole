'use client';

import { Check, Lock, Sparkles, Zap } from 'lucide-react';
import type { MarketplacePack } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { COPY } from '@/lib/copy';
import { PAYWALL_INCLUDES } from '@/lib/site-guide';
import { CheckoutButton } from '@/components/marketplace/checkout-button';
import { PackSlotsBadge } from '@/components/marketplace/pack-slots-badge';
import { cn } from '@/lib/utils';

export function DossierPaywallCard({
  pack,
  freePreview,
  soldOut,
  embedded = false,
  className,
}: {
  pack: MarketplacePack;
  freePreview?: TerritoryFreePreview;
  soldOut: boolean;
  embedded?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-6',
        embedded ? 'shadow-none' : 'shadow-sm lg:sticky lg:top-20',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-slate-500">
        <Lock className="h-4 w-4" strokeWidth={1.5} />
        <span className="text-xs font-semibold uppercase tracking-wide">Accès dossier</span>
      </div>

      {freePreview && (
        <p className="mt-3 text-sm text-slate-600">
          Territoire estimé{' '}
          <strong className="font-semibold text-slate-900">{freePreview.budgetRange}</strong>
          {' · '}
          {freePreview.dpeProfile.label}
        </p>
      )}

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">290 €</span>
        <span className="text-sm text-slate-500">HT · achat unique</span>
      </div>

      {!soldOut && pack.slotsRemaining <= 2 && (
        <p className="mt-2 text-xs font-medium text-amber-700">
          Plus que {pack.slotsRemaining} place{pack.slotsRemaining > 1 ? 's' : ''} à l&apos;unité
        </p>
      )}

      <div className="mt-3">
        <PackSlotsBadge
          remaining={pack.slotsRemaining}
          max={pack.slotsMax}
          soldOut={soldOut}
          size="md"
        />
      </div>

      <ul className="mt-6 space-y-2.5">
        {PAYWALL_INCLUDES.slice(0, 4).map((item) => (
          <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-slate-600">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-2.5">
        <CheckoutButton
          plan="dossier"
          packId={pack.packId}
          disabled={soldOut}
          className="btn-primary w-full py-3.5"
        >
          <Sparkles className="h-4 w-4" />
          {soldOut ? COPY.soldOut : 'Débloquer ce territoire'}
        </CheckoutButton>
        <CheckoutButton plan="pro" className="btn-secondary w-full py-3">
          <Zap className="h-4 w-4" />
          {COPY.subscription} — 990 € HT/mois
        </CheckoutButton>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">{COPY.estimatesNote}</p>
    </div>
  );
}
