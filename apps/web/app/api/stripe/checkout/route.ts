import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CUSTOMER_COOKIE, createCustomerToken, getCustomerSession } from '@/lib/auth';
import { canPurchasePack, getOrCreateAccount } from '@/lib/entitlements';
import { appUrl, getStripe, isStripeConfigured } from '@/lib/stripe';

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe non configuré. Définissez STRIPE_SECRET_KEY et les price IDs.' },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    plan: 'dossier' | 'pro';
    packId?: string;
    email?: string;
  };

  if (body.plan === 'dossier' && !body.packId) {
    return NextResponse.json({ error: 'packId requis pour un achat unitaire' }, { status: 400 });
  }

  const existing = await getCustomerSession();
  const account = await getOrCreateAccount(existing?.accountId, body.email);

  if (body.plan === 'dossier' && body.packId) {
    const purchase = await canPurchasePack(body.packId, account.id);
    if (!purchase.ok) {
      return NextResponse.json(
        {
          error: 'Ce territoire a atteint le quota d\'accès unitaires. Essayez l\'abonnement Régional.',
          soldOut: true,
          availability: purchase.availability,
        },
        { status: 409 },
      );
    }
  }

  const stripe = getStripe();
  const priceId =
    body.plan === 'pro'
      ? process.env.STRIPE_PRICE_PRO!
      : process.env.STRIPE_PRICE_DOSSIER!;

  const session = await stripe.checkout.sessions.create({
    mode: body.plan === 'pro' ? 'subscription' : 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/compte/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/tarifs?cancelled=1`,
    customer_email: body.email || account.email || undefined,
    metadata: {
      accountId: account.id,
      plan: body.plan,
      packId: body.packId ?? '',
    },
    ...(body.plan === 'pro' && {
      subscription_data: {
        metadata: { accountId: account.id },
      },
    }),
  });

  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, createCustomerToken(account.id, account.sessionVersion), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ url: session.url });
}
