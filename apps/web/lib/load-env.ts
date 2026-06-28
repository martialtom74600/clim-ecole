import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnvConfig } from '@next/env';

/** Racine du package Next (`apps/web`). */
export const WEB_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Racine du monorepo. */
export const REPO_ROOT = path.join(WEB_ROOT, '..', '..');

/**
 * Charge `.env*` depuis la racine monorepo puis `apps/web`.
 * Idempotent — safe à rappeler (Next charge config + instrumentation).
 */
export function loadMonorepoEnv(): void {
  loadEnvConfig(REPO_ROOT);
  loadEnvConfig(WEB_ROOT);
}

/** Pour next.config.ts — chemins basés sur le dossier du fichier config. */
export function loadMonorepoEnvFromConfigDir(configDir: string): void {
  const webRoot = path.resolve(configDir);
  const repoRoot = path.resolve(webRoot, '..', '..');
  loadEnvConfig(repoRoot);
  loadEnvConfig(webRoot);
}
