import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';
import {
  getCustomerPreferences,
  upsertCustomerPreferences,
  ensureReferralCode,
} from '@/lib/client-preferences-db';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ watchlist: [], compareIds: [], blacklistUais: [], onboarding: null });
  }
  const prefs = await getCustomerPreferences(session.accountId);
  const referralCode = await ensureReferralCode(session.accountId);
  return NextResponse.json({ ...prefs, referralCode });
}

export async function PUT(request: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = (await request.json()) as {
    watchlist?: string[];
    compareIds?: string[];
    blacklistUais?: string[];
    onboarding?: { persona?: string; minCapex?: number; completedAt?: string };
  };

  const prefs = await upsertCustomerPreferences(session.accountId, {
    watchlist: body.watchlist,
    compareIds: body.compareIds?.slice(-3),
    blacklistUais: body.blacklistUais,
    onboarding: body.onboarding as import('@/lib/client-preferences-db').CustomerPreferences['onboarding'],
  });

  return NextResponse.json(prefs);
}
