'use client';

import { Check, Lock, Sparkles, Zap } from 'lucide-react';
import type { MarketplacePack } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { COPY } from '@/lib/copy';
import { PRICING, priceLabel } from '@/lib/pricing';
import { PAYWALL_INCLUDES } from '@/lib/site-guide';
import { CheckoutButton } from '@/components/marketplace/checkout-button';
import { PackSlotsBadge } from '@/components/marketplace/pack-slots-badge';
import { PaywallTrust } from '@/components/marketplace/dossier-inline-paywall';
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
        'rounded-2xl border border-line bg-white p-5',
        embedded ? 'shadow-card' : 'shadow-raised lg:sticky lg:top-20',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-ink-muted">
        <Lock className="h-4 w-4" strokeWidth={1.5} />
        <span className="text-[11px] font-semibold uppercase tracking-wide">Passer à l&apos;action</span>
      </div>

      {freePreview && (
        <p className="mt-3 text-sm text-ink-muted">
          Territoire estimé{' '}
          <strong className="font-semibold text-ink">{freePreview.budgetRange}</strong>
          {' · '}
          {freePreview.dpeProfile.label}
        </p>
      )}

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-bold tracking-tight text-ink">{priceLabel(PRICING.dossier)}</span>
        <span className="text-sm text-ink-muted">HT · un territoire · 30 jours</span>
      </div>

      {!soldOut && pack.slotsRemaining <= 2 && (
        <p className="mt-2 text-xs font-medium text-warning-text">
          Plus que {pack.slotsRemaining} place{pack.slotsRemaining > 1 ? 's' : ''} à l&apos;unité
        </p>
      )}

      <div className="mt-2">
        <PackSlotsBadge
          remaining={pack.slotsRemaining}
          max={pack.slotsMax}
          soldOut={soldOut}
          size="md"
        />
      </div>

      <ul className="mt-5 space-y-2.5">
        {PAYWALL_INCLUDES.slice(0, 4).map((item) => (
          <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-ink-muted">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 space-y-2.5">
        <CheckoutButton
          plan="dossier"
          packId={pack.packId}
          disabled={soldOut}
          className="btn-primary w-full py-3.5"
        >
          <Sparkles className="h-4 w-4" />
          {soldOut ? COPY.soldOut : 'Débloquer ce territoire'}
        </CheckoutButton>
        <p className="pt-1 text-center text-[11px] text-ink-subtle">
          Vous visez 4+ territoires&nbsp;? L&apos;abonnement devient rentable.
        </p>
        <CheckoutButton plan="pro" className="btn-secondary w-full py-3">
          <Zap className="h-4 w-4" />
          Tous les territoires — {priceLabel(PRICING.pro)} HT/mois
        </CheckoutButton>
      </div>

      <PaywallTrust className="mt-5 border-t border-line pt-4" />

      <p className="mt-4 text-[11px] leading-relaxed text-ink-subtle">{COPY.estimatesNote}</p>
    </div>
  );
}
