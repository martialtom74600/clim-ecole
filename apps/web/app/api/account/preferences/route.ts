import { NextResponse } from 'next/server';
import { getActiveCustomerAccountId } from '@/lib/api-guard';
import {
  getCustomerPreferences,
  upsertCustomerPreferences,
  ensureReferralCode,
} from '@/lib/client-preferences-db';

export async function GET() {
  const accountId = await getActiveCustomerAccountId();
  if (!accountId) {
    return NextResponse.json({
      authenticated: false,
      watchlist: [],
      compareIds: [],
      blacklistUais: [],
      removedWatchlist: [],
      onboarding: null,
    });
  }
  const prefs = await getCustomerPreferences(accountId);
  const referralCode = await ensureReferralCode(accountId);
  return NextResponse.json({ authenticated: true, ...prefs, referralCode });
}

export async function PUT(request: Request) {
  const accountId = await getActiveCustomerAccountId();
  if (!accountId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = (await request.json()) as {
    watchlist?: string[];
    compareIds?: string[];
    blacklistUais?: string[];
    onboarding?: { persona?: string; minCapex?: number; completedAt?: string };
  };

  const prefs = await upsertCustomerPreferences(accountId, {
    watchlist: body.watchlist,
    compareIds: body.compareIds?.slice(-3),
    blacklistUais: body.blacklistUais,
    onboarding: body.onboarding as import('@/lib/client-preferences-db').CustomerPreferences['onboarding'],
  });

  return NextResponse.json(prefs);
}
