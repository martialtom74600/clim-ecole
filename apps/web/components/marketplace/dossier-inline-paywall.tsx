'use client';

import { Database, Lock, Scale, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import type { MarketplacePack } from '@/lib/types';
import { CheckoutButton } from '@/components/marketplace/checkout-button';
import { cn } from '@/lib/utils';

/**
 * Bandeau de réassurance affiché au point de paiement — traite les objections
 * invisibles (accès, sécurité, source, légalité) qui bloquent un achat à 290 €.
 * Partagé entre l'overlay inline et la carte paywall.
 */
const PAYWALL_TRUST = [
  { icon: Zap, label: 'Accès immédiat · 30 jours' },
  { icon: ShieldCheck, label: 'Paiement sécurisé Stripe' },
  { icon: Database, label: 'Données publiques officielles' },
  { icon: Scale, label: 'Sourcing légal (R2111-1)' },
] as const;

export function PaywallTrust({ className }: { className?: string }) {
  return (
    <ul className={cn('grid grid-cols-2 gap-x-3 gap-y-1.5 text-left', className)}>
      {PAYWALL_TRUST.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-1.5 text-[11px] leading-tight text-ink-muted">
          <Icon className="h-3 w-3 shrink-0 text-ink-subtle" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

/** Overlay compact posé sur une zone floutée — conclusion logique du freemium */
export function DossierInlinePaywall({
  pack,
  soldOut,
  title = 'Débloquez les contacts directs et les montants financiers exacts',
  subtitle = 'Accédez aux emails mairies, coordonnées GPS et chiffres précis pour prospecter ce territoire.',
  className,
}: {
  pack: MarketplacePack;
  soldOut?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center bg-white/80 p-4 backdrop-blur-[2px]',
        className,
      )}
    >
      <div className="w-full max-w-sm rounded-xl border border-line bg-white p-5 text-center shadow-raised">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-sunken">
          <Lock className="h-4 w-4 text-ink-muted" strokeWidth={1.5} />
        </div>
        <p className="mt-3 text-sm font-semibold leading-snug text-ink">{title}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{subtitle}</p>
        <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-ink">
          290 € <span className="text-sm font-normal text-ink-muted">HT</span>
        </p>
        {!soldOut && pack.slotsRemaining <= 2 && (
          <p className="mt-1 text-[11px] font-medium text-warning-text">
            Plus que {pack.slotsRemaining} place{pack.slotsRemaining > 1 ? 's' : ''} à l&apos;unité
          </p>
        )}
        <CheckoutButton
          plan="dossier"
          packId={pack.packId}
          disabled={soldOut}
          className="btn-primary mt-4 w-full py-3"
        >
          <Sparkles className="h-4 w-4" />
          {soldOut ? 'Places épuisées' : 'Débloquer ce territoire'}
        </CheckoutButton>
        <PaywallTrust className="mt-4 border-t border-line pt-3" />
      </div>
    </div>
  );
}

/**
 * Enveloppe une zone : contenu flouté + overlay paywall par-dessus.
 * Utilise rounded-xl pour rester cohérent avec le border-radius des blocs de contenu.
 */
export function DossierBlurredPaywallZone({
  pack,
  soldOut,
  title,
  subtitle,
  children,
  className,
}: {
  pack: MarketplacePack;
  soldOut?: boolean;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <div className="pointer-events-none select-none blur-[3px]">{children}</div>
      <DossierInlinePaywall pack={pack} soldOut={soldOut} title={title} subtitle={subtitle} />
    </div>
  );
}
