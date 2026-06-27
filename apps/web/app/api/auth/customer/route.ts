import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';
import { getAccount, isProActive } from '@/lib/entitlements';
import { getMarketplacePackById } from '@/lib/marketplace';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const account = await getAccount(session.accountId);
  if (!account) {
    return NextResponse.json({ authenticated: false });
  }

  const packSummaries = await Promise.all(
    account.packIds.map(async (packId) => {
      const detail = await getMarketplacePackById(packId, account.id);
      return {
        packId,
        name: detail?.pack.publicName ?? 'Dossier débloqué',
        department: detail?.pack.department,
        capex: detail?.pack.packCapexTotal,
      };
    }),
  );

  return NextResponse.json({
    authenticated: true,
    email: account.email,
    pro: isProActive(account),
    proUntil: account.proUntil,
    packCount: account.packIds.length,
    packs: packSummaries,
  });
}
