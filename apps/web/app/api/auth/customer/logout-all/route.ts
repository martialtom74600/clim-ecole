import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CUSTOMER_COOKIE } from '@/lib/auth';
import { getActiveCustomerAccountId } from '@/lib/api-guard';
import { bumpSessionVersion } from '@/lib/entitlements';

/**
 * Déconnexion de tous les appareils : bumper session_version invalide
 * instantanément tous les cookies déjà émis (vérifiés via getActiveCustomerAccountId).
 */
export async function POST() {
  const accountId = await getActiveCustomerAccountId();
  if (accountId) {
    await bumpSessionVersion(accountId);
  }
  const jar = await cookies();
  jar.delete(CUSTOMER_COOKIE);
  return NextResponse.json({ ok: true });
}
