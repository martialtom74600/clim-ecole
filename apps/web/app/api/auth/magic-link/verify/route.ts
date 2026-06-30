import { NextResponse } from 'next/server';
import { verifyMagicLinkToken } from '@/lib/magic-link';
import { consumeMagicLinkToken } from '@/lib/magic-link-store';
import { createCustomerToken, CUSTOMER_COOKIE } from '@/lib/auth';
import { getOrCreateAccount } from '@/lib/entitlements';
import { appUrl } from '@/lib/stripe';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
  }

  const payload = verifyMagicLinkToken(token);
  if (!payload) {
    return NextResponse.redirect(`${appUrl()}/compte?error=magic_expired`);
  }

  // Single-use : on consomme le jti. Tout rejeu (lien déjà cliqué, préfetch du
  // client mail, interception) échoue ici même si la signature reste valide.
  const consumed = await consumeMagicLinkToken(payload.jti);
  if (!consumed) {
    return NextResponse.redirect(`${appUrl()}/compte?error=magic_expired`);
  }

  // Le compte a été résolu (et dédupliqué par email) à l'envoi du lien.
  const account = await getOrCreateAccount(consumed.accountId, consumed.email);

  const response = NextResponse.redirect(`${appUrl()}/compte?synced=1`);
  response.cookies.set(CUSTOMER_COOKIE, createCustomerToken(account.id, account.sessionVersion), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
