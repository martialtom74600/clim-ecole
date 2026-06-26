'use client';

import { Lock, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { COPY } from '@/lib/copy';
import { CheckoutButton } from '@/components/marketplace/checkout-button';

interface PaywallOverlayProps {
  title?: string;
  subtitle?: string;
  buildingCount?: number;
  capex?: string;
  packId?: string;
  soldOut?: boolean;
  slotsRemaining?: number;
  children: React.ReactNode;
  className?: string;
}

export function PaywallOverlay({
  title = COPY.paywallTitle,
  subtitle,
  buildingCount,
  capex,
  packId,
  soldOut,
  slotsRemaining,
  children,
  className,
}: PaywallOverlayProps) {
  const desc =
    subtitle ??
    (buildingCount
      ? `${buildingCount} écoles · noms et communes · contacts mairies · export PDF`
      : COPY.paywallDesc);

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <div aria-hidden className="pointer-events-none select-none opacity-25 blur-[3px]">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-white/75 p-4 backdrop-blur-md">
        <div className="w-full max-w-lg rounded-xl border border-slate-200/80 bg-white/90 p-8 text-center shadow-lg backdrop-blur-sm md:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <Lock className="h-6 w-6 text-slate-700" strokeWidth={1.5} />
          </div>

          {capex && (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {COPY.budgetTravaux} · {capex}
            </p>
          )}

          {typeof slotsRemaining === 'number' && !soldOut && slotsRemaining <= 2 && (
            <p className="mb-3 text-sm font-medium text-amber-700">
              Plus que {slotsRemaining} achat{slotsRemaining > 1 ? 's' : ''} à l&apos;unité sur ce territoire
            </p>
          )}

          <h3 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
            {soldOut ? COPY.soldOut : title}
          </h3>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
            {soldOut
              ? `Limite d'achats à l'unité atteinte. L'${COPY.subscription.toLowerCase()} débloque tous les territoires.`
              : desc}
          </p>

          <div className="mt-8 space-y-3">
            {packId ? (
              <CheckoutButton
                plan="dossier"
                packId={packId}
                disabled={soldOut}
                className="btn-primary w-full py-4"
              >
                <Sparkles className="h-4 w-4" />
                {soldOut ? 'Indisponible à l\'unité' : 'Acheter ce territoire — 290 € HT'}
              </CheckoutButton>
            ) : (
              <Link href="/tarifs?plan=dossier" className="btn-primary w-full py-4">
                Acheter ce territoire — 290 € HT
              </Link>
            )}
            <CheckoutButton plan="pro" className="btn-secondary w-full py-4">
              <Zap className="h-4 w-4" />
              {COPY.subscription} — 990 € HT/mois
            </CheckoutButton>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-slate-400">
            {COPY.estimatesNote}
          </p>
        </div>
      </div>
    </div>
  );
}
