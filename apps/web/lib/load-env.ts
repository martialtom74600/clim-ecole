import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnvConfig } from '@next/env';

/** Racine du package Next (`apps/web`). */
export const WEB_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Racine du monorepo. */
export const REPO_ROOT = path.join(WEB_ROOT, '..', '..');

let loaded = false;

/**
 * Charge `.env*` depuis la racine monorepo puis `apps/web`.
 * Sur Vercel : variables injectées par le dashboard (aucun fichier requis).
 */
export function loadMonorepoEnv(): void {
  if (loaded) return;
  loaded = true;
  loadEnvConfig(REPO_ROOT);
  loadEnvConfig(WEB_ROOT);
}

/** Pour next.config.ts (CJS, chemins fiables après compilation). */
export function loadMonorepoEnvFromDir(webRoot: string): void {
  if (loaded) return;
  loaded = true;
  const repoRoot = path.join(webRoot, '..', '..');
  loadEnvConfig(repoRoot);
  loadEnvConfig(webRoot);
}
