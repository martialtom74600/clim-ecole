/**
 * Hook Next.js — validation env au démarrage serveur (production).
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { loadMonorepoEnv } = await import('./lib/load-env');
    const { validateProductionEnv } = await import('./lib/env');
    loadMonorepoEnv();
    validateProductionEnv();
  }
}
