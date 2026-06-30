'use client';

import { Database, Lock, Scale, ShieldCheck, Zap } from 'lucide-react';
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

/**
 * Cadenas discret — signale qu'une zone est verrouillée SANS répéter le prix,
 * le bouton ni les badges de réassurance. Le vrai CTA d'achat est unique, en bas
 * de chaque onglet (DossierPaywallCard). Objectif : supprimer le bruit cognitif
 * d'un même « 290 € · Débloquer » répété 4-6 fois sur un écran.
 */
export function DossierLockHint({
  title = 'Visible après déblocage',
  subtitle,
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center bg-white/55 p-4 backdrop-blur-[1px]',
        className,
      )}
    >
      <div className="flex max-w-xs flex-col items-center gap-2 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/90 shadow-sm">
          <Lock className="h-4 w-4 text-ink-muted" strokeWidth={1.5} />
        </span>
        <p className="text-xs font-medium text-ink">{title}</p>
        {subtitle && (
          <p className="text-[11px] leading-relaxed text-ink-muted">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Enveloppe une zone : contenu flouté + cadenas discret par-dessus.
 * N'embarque PAS de CTA — la conversion se fait au CTA unique de l'onglet.
 */
export function DossierBlurredPaywallZone({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <div className="pointer-events-none select-none blur-[3px]">{children}</div>
      <DossierLockHint title={title} subtitle={subtitle} />
    </div>
  );
}
