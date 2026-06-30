'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { trackEvent } from '@/lib/track';
import { useToast } from '@/components/ui/toast';

interface CheckoutButtonProps {
  plan: 'dossier' | 'pro';
  packId?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function CheckoutButton({
  plan,
  packId,
  disabled,
  className,
  children,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleClick() {
    if (disabled) return;
    setLoading(true);
    trackEvent('checkout_start', { plan, packId: packId ?? '' });
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, packId }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        soldOut?: boolean;
      };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.soldOut) {
        toast(
          `Places à l'unité épuisées sur ce territoire. L'${COPY.subscription.toLowerCase()} débloque tout l'accès.`,
          'error',
        );
        return;
      }
      toast(data.error ?? 'Paiement indisponible — contact@strate.studio', 'error');
    } catch {
      toast('Connexion interrompue — réessayez dans un instant.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={className}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
