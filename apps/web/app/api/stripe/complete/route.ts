import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CUSTOMER_COOKIE, createCustomerToken } from '@/lib/auth';
import {
  grantPackAccess,
  grantProSubscription,
  updateAccount,
} from '@/lib/entitlements';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { appUrl, getStripe, isStripeConfigured } from '@/lib/stripe';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id manquant' }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 402 });
  }

  const accountId = session.metadata?.accountId;
  const plan = session.metadata?.plan as 'dossier' | 'pro' | undefined;
  const packId = session.metadata?.packId;

  if (!accountId || !plan) {
    return NextResponse.json({ error: 'Métadonnées session invalides' }, { status: 400 });
  }

  const email = session.customer_email ?? session.customer_details?.email ?? undefined;
  if (email) {
    await updateAccount(accountId, { email });
  }

  if (plan === 'pro') {
    await grantProSubscription(accountId, 1, session.customer as string | undefined);
  } else if (packId) {
    const granted = await grantPackAccess(accountId, packId);
    if (!granted) {
      return NextResponse.json(
        { error: 'Quota d\'accès atteint pour ce territoire. Contactez support@strate.studio.' },
        { status: 409 },
      );
    }
  }

  if (email) {
    const packUrl = packId ? `${appUrl()}/explorer/${packId}` : undefined;
    await sendPurchaseConfirmationEmail(email, { plan, packUrl });
  }

  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, createCustomerToken(accountId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({
    ok: true,
    plan,
    packId: packId || null,
    redirect: packId ? `/explorer/${packId}` : '/compte',
  });
}
