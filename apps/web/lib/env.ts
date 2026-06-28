/**
 * Variables d'environnement du site Next.js.
 * - Secrets serveur : jamais préfixés NEXT_PUBLIC_
 * - Public : NEXT_PUBLIC_* (exposées au navigateur)
 *
 * Local : `/.env` (monorepo) ou `apps/web/.env.local`
 * Vercel : Settings → Environment Variables
 */

const isProd = process.env.NODE_ENV === 'production';
const isVercel = Boolean(process.env.VERCEL);

export const serverEnv = {
  get supabaseUrl() {
    return process.env.SUPABASE_URL?.trim() ?? '';
  },
  get supabaseServiceKey() {
    return (
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
      process.env.SUPABASE_SECRET_KEY?.trim() ??
      ''
    );
  },
  get authSecret() {
    return process.env.AUTH_SECRET?.trim() ?? '';
  },
  get adminPassword() {
    return process.env.ADMIN_PASSWORD?.trim() ?? '';
  },
  get stripeSecretKey() {
    return process.env.STRIPE_SECRET_KEY?.trim() ?? '';
  },
  get stripeWebhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? '';
  },
  get stripePriceDossier() {
    return process.env.STRIPE_PRICE_DOSSIER?.trim() ?? '';
  },
  get stripePricePro() {
    return process.env.STRIPE_PRICE_PRO?.trim() ?? '';
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY?.trim() ?? '';
  },
  get emailFrom() {
    return process.env.EMAIL_FROM?.trim() ?? '';
  },
  get climCsvPath() {
    return process.env.CLIM_CSV_PATH?.trim() ?? '';
  },
  get climTestMode() {
    const raw = process.env.CLIM_TEST_MODE?.trim().toLowerCase();
    if (raw !== '1' && raw !== 'true' && raw !== 'yes') return false;
    if (process.env.VERCEL_ENV === 'production') return false;
    if (isProd && !isVercel) return false;
    return true;
  },
} as const;

export const clientEnv = {
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3001';
  },
  get plausibleDomain() {
    return process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() ?? '';
  },
} as const;

export function isSupabaseEnvConfigured(): boolean {
  return Boolean(serverEnv.supabaseUrl && serverEnv.supabaseServiceKey);
}

export function isStripeEnvConfigured(): boolean {
  return Boolean(
    serverEnv.stripeSecretKey &&
      serverEnv.stripePriceDossier &&
      serverEnv.stripePricePro,
  );
}

/** Valide les variables obligatoires en production (build + runtime). */
export function validateProductionEnv(): void {
  if (!isProd) return;

  const missing: string[] = [];

  if (!isSupabaseEnvConfigured()) {
    if (!serverEnv.supabaseUrl) missing.push('SUPABASE_URL');
    if (!serverEnv.supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }

  // AUTH_SECRET requis pour les sessions (admin + client) — warning explicite au build
  if (!serverEnv.authSecret) missing.push('AUTH_SECRET');

  if (missing.length > 0) {
    const hint = isVercel
      ? 'Ajoutez-les dans Vercel → Settings → Environment Variables (Production).'
      : 'Définissez-les dans apps/web/.env.local ou /.env à la racine du monorepo.';
    throw new Error(
      `[clim-ecole/web] Variables d'environnement manquantes en production : ${missing.join(', ')}. ${hint}`,
    );
  }
}
