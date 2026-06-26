'use client';

/** Événements produit — branchable sur Plausible / PostHog via env */
export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;

  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (plausibleDomain && 'plausible' in window) {
    (window as Window & { plausible?: (n: string, o?: { props: Record<string, unknown> }) => void }).plausible?.(
      name,
      props ? { props } : undefined,
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', name, props);
  }
}
