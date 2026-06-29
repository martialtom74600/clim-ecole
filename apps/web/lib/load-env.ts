import fs from 'fs';
import path from 'path';
import { loadEnvConfig } from '@next/env';

/**
 * Racine du package Next (`apps/web`).
 * `process.cwd()` est fiable en dev/build ; évite `import.meta.url` qui pointe
 * vers `.next/server/chunks` après bundling et casse le chargement du `.env` racine.
 */
export const WEB_ROOT = process.cwd();

/** Racine du monorepo (`clim-ecole`). */
export const REPO_ROOT = path.resolve(WEB_ROOT, '..', '..');

/** Repli si @next/env n'injecte pas le .env racine en runtime RSC. */
function loadEnvFileFallback(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

/**
 * Charge `.env*` depuis la racine monorepo puis `apps/web`.
 * Idempotent — safe à rappeler (Next charge config + instrumentation).
 */
export function loadMonorepoEnv(): void {
  loadEnvConfig(REPO_ROOT);
  loadEnvConfig(WEB_ROOT);
  loadEnvFileFallback(path.join(REPO_ROOT, '.env'));
  loadEnvFileFallback(path.join(WEB_ROOT, '.env.local'));
}

/** Pour next.config.ts — chemins basés sur le dossier du fichier config. */
export function loadMonorepoEnvFromConfigDir(configDir: string): void {
  const webRoot = path.resolve(configDir);
  const repoRoot = path.resolve(webRoot, '..', '..');
  loadEnvConfig(repoRoot);
  loadEnvConfig(webRoot);
}
