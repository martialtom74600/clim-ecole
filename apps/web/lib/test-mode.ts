/**
 * Mode test : accès premium sans Stripe (local + preview Vercel uniquement).
 * CLIM_TEST_MODE=1 dans `.env` (racine) — jamais actif sur Vercel Production.
 */
import path from 'path';
import { loadEnvConfig } from '@next/env';

let rootEnvLoaded = false;

function ensureRootEnv(): void {
  if (rootEnvLoaded || process.env.CLIM_TEST_MODE) return;
  rootEnvLoaded = true;
  loadEnvConfig(path.join(process.cwd(), '../..'));
}

export function isTestMode(): boolean {
  ensureRootEnv();
  const raw = process.env.CLIM_TEST_MODE?.trim().toLowerCase();
  if (raw !== '1' && raw !== 'true' && raw !== 'yes') return false;

  if (process.env.VERCEL_ENV === 'production') return false;
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
    return false;
  }

  return true;
}
