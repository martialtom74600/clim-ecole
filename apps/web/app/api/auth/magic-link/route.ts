import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createMagicLinkToken, MAGIC_TTL_MS, sendMagicLinkEmail } from '@/lib/magic-link';
import {
  countRecentMagicRequests,
  createMagicLinkToken as persistMagicToken,
} from '@/lib/magic-link-store';
import { getAccountByEmail, getOrCreateAccount } from '@/lib/entitlements';
import { isEmailConfigured } from '@/lib/email';
import { appUrl } from '@/lib/stripe';

// Réponse volontairement identique quels que soient l'existence du compte et le
// statut de rate-limit → empêche l'énumération d'emails et la mesure du throttle.
const GENERIC_OK =
  'Si un compte existe pour cette adresse, un lien de connexion vient d’être envoyé.';

const WINDOW_MS = 1000 * 60 * 15;
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 12;

function clientIp(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip');
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  const ip = clientIp(request);

  // Rate-limit avant tout effet de bord : on sort en réponse générique.
  const { byEmail, byIp } = await countRecentMagicRequests({ email, ip, sinceMs: WINDOW_MS });
  if (byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP) {
    return NextResponse.json({ ok: true, message: GENERIC_OK });
  }

  // Cross-device : un email = toujours le même compte (acheteur, abonné, favoris).
  const account = (await getAccountByEmail(email)) ?? (await getOrCreateAccount(undefined, email));

  // Token single-use : on persiste un jti consommable une seule fois à la vérif.
  const jti = randomUUID();
  await persistMagicToken({
    jti,
    accountId: account.id,
    email,
    requesterIp: ip,
    expiresAt: new Date(Date.now() + MAGIC_TTL_MS).toISOString(),
    createdAt: new Date().toISOString(),
  });

  const sent = await sendMagicLinkEmail(email, account.id, jti);

  // En dev sans Resend configuré, on expose le lien pour pouvoir tester.
  if (!sent && process.env.NODE_ENV !== 'production' && !isEmailConfigured()) {
    const token = createMagicLinkToken(email, account.id, jti);
    return NextResponse.json({
      ok: true,
      message: 'Email non configuré (dev) — lien de connexion ci-dessous.',
      devLink: `${appUrl()}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`,
    });
  }

  return NextResponse.json({ ok: true, message: GENERIC_OK });
}
