import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';
import { getAccount } from '@/lib/entitlements';
import { checkPackEntitlement } from '@/lib/entitlements';
import { createShareToken } from '@/lib/share-token';
import { appUrl } from '@/lib/stripe';

export async function POST(
  _request: Request,
  context: { params: Promise<{ packId: string }> },
) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
  }

  const { packId } = await context.params;
  const account = await getAccount(session.accountId);
  if (!account) {
    return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
  }

  const entitled = await checkPackEntitlement(session.accountId, packId);
  if (!entitled && !account.proUntil) {
    return NextResponse.json({ error: 'Dossier non débloqué' }, { status: 403 });
  }

  const token = createShareToken(packId, session.accountId);
  const url = `${appUrl()}/share/${encodeURIComponent(token)}`;

  return NextResponse.json({ url, expiresInDays: 7 });
}
