import { NextResponse } from 'next/server';
import { getActiveCustomerAccountId } from '@/lib/api-guard';
import { getAccount, isProActive } from '@/lib/entitlements';
import { getMarketplacePackById } from '@/lib/marketplace';

export async function GET() {
  const accountId = await getActiveCustomerAccountId();
  if (!accountId) {
    return NextResponse.json({ authenticated: false });
  }

  const account = await getAccount(accountId);
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
