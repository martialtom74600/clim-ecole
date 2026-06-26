import { NextResponse } from 'next/server';
import { getAdminSession, getCustomerSession } from '@/lib/auth';
import { checkPackEntitlement } from '@/lib/entitlements';

export async function requireAdminApi(): Promise<NextResponse | null> {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  return null;
}

export async function requireCustomerApi(): Promise<
  { accountId: string } | NextResponse
> {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
  }
  return { accountId: session.accountId };
}

export async function requirePackAccessApi(
  packId: string,
): Promise<{ accountId: string } | NextResponse> {
  const result = await requireCustomerApi();
  if (result instanceof NextResponse) return result;

  const allowed = await checkPackEntitlement(result.accountId, packId);
  if (!allowed) {
    return NextResponse.json({ error: 'Dossier non débloqué' }, { status: 403 });
  }
  return result;
}
