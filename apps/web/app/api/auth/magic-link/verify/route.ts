import { NextResponse } from 'next/server';
import { verifyMagicLinkToken } from '@/lib/magic-link';
import { createCustomerToken, CUSTOMER_COOKIE } from '@/lib/auth';
import { dbGetOrCreateAccount } from '@/lib/entitlements-db';
import { newAccountId } from '@/lib/crypto';
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

  await dbGetOrCreateAccount(payload.accountId, payload.email);

  const response = NextResponse.redirect(`${appUrl()}/compte`);
  response.cookies.set(CUSTOMER_COOKIE, createCustomerToken(payload.accountId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
