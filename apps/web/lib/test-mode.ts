/**
 * Mode test : accès premium sans Stripe (local + preview Vercel uniquement).
 * CLIM_TEST_MODE=1 — jamais actif sur Vercel Production.
 */
import { loadMonorepoEnv } from './load-env';
import { serverEnv } from './env';

export function isTestMode(): boolean {
  loadMonorepoEnv();
  return serverEnv.climTestMode;
}
