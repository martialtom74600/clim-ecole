/**
 * Déblocage dev — désactivé en production.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CUSTOMER_COOKIE, createCustomerToken } from '@/lib/auth';
import { getOrCreateAccount, grantPackAccess, grantProSubscription } from '@/lib/entitlements';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Indisponible' }, { status: 404 });
  }

  const key = request.headers.get('x-dev-key');
  const expected = process.env.DEV_UNLOCK_KEY ?? 'dev-unlock';
  if (key !== expected) {
    return NextResponse.json({ error: 'Clé invalide' }, { status: 401 });
  }

  const body = (await request.json()) as { packId?: string; pro?: boolean };
  const account = await getOrCreateAccount();

  if (body.pro) await grantProSubscription(account.id, 1);
  if (body.packId) await grantPackAccess(account.id, body.packId);

  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, createCustomerToken(account.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}
