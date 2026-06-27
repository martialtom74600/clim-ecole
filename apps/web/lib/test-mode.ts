/**
 * Mode test : accès premium sans Stripe (local + preview Vercel uniquement).
 * CLIM_TEST_MODE=1 dans .env.local — jamais actif sur Vercel Production.
 */
export function isTestMode(): boolean {
  const raw = process.env.CLIM_TEST_MODE?.trim().toLowerCase();
  if (raw !== '1' && raw !== 'true' && raw !== 'yes') return false;

  if (process.env.VERCEL_ENV === 'production') return false;
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
    return false;
  }

  return true;
}
