import { NextResponse } from 'next/server';
import { getAdminSession, getCustomerSession } from '@/lib/auth';
import { checkPackEntitlement, getAccount } from '@/lib/entitlements';
import { isPublicDemoPack } from '@/lib/pack-access';
import { isTestMode } from '@/lib/test-mode';

export async function requireAdminApi(): Promise<NextResponse | null> {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  return null;
}

/**
 * Renvoie l'accountId d'une session client *valide et non révoquée*, sinon null.
 * La vérification de session_version permet le "logout all devices" : bumper la
 * version côté compte invalide instantanément tous les cookies déjà émis.
 * Les anciens cookies sans `v` sont tolérés (rétrocompat) — ils seront réémis
 * avec une version à la prochaine connexion.
 */
export async function getActiveCustomerAccountId(): Promise<string | null> {
  const session = await getCustomerSession();
  if (!session) return null;
  if (session.v === undefined) return session.accountId;
  const account = await getAccount(session.accountId);
  if (!account) return null;
  if ((account.sessionVersion ?? 1) !== session.v) return null;
  return session.accountId;
}

export async function requireCustomerApi(): Promise<
  { accountId: string } | NextResponse
> {
  const accountId = await getActiveCustomerAccountId();
  if (!accountId) {
    return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
  }
  return { accountId };
}

export async function requirePackAccessApi(
  packId: string,
): Promise<{ accountId: string } | NextResponse> {
  if (isTestMode()) {
    return { accountId: 'test-mode' };
  }

  if (await isPublicDemoPack(packId)) {
    return { accountId: 'demo' };
  }

  const result = await requireCustomerApi();
  if (result instanceof NextResponse) return result;

  const allowed = await checkPackEntitlement(result.accountId, packId);
  if (!allowed) {
    return NextResponse.json({ error: 'Dossier non débloqué' }, { status: 403 });
  }
  return result;
}
