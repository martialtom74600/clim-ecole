import { NextResponse } from 'next/server';
import {
  getAccountByStripeCustomerId,
  grantPackAccess,
  grantProSubscription,
  revokeProSubscription,
  updateAccount,
} from '@/lib/entitlements';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { appUrl, getStripe, isStripeConfigured } from '@/lib/stripe';

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET manquant' }, { status: 503 });
  }

  const stripe = getStripe();
  const raw = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const accountId = session.metadata?.accountId;
    const plan = session.metadata?.plan as 'dossier' | 'pro' | undefined;
    const packId = session.metadata?.packId;

    if (accountId) {
      const email = session.customer_email ?? session.customer_details?.email;
      if (email) {
        await updateAccount(accountId, { email });
      }
      if (plan === 'pro') {
        await grantProSubscription(accountId, 1, session.customer as string | undefined);
      } else if (packId) {
        await grantPackAccess(accountId, packId);
      }
      if (email) {
        const packUrl = packId ? `${appUrl()}/explorer/${packId}` : undefined;
        await sendPurchaseConfirmationEmail(email, { plan: plan ?? 'dossier', packUrl });
      }
    }
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    if (invoice.billing_reason === 'subscription_cycle' && invoice.customer) {
      const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
      const account =
        (invoice.metadata?.accountId
          ? await import('@/lib/entitlements').then((m) => m.getAccount(invoice.metadata!.accountId!))
          : null) ?? (await getAccountByStripeCustomerId(customerId));
      if (account) {
        await grantProSubscription(account.id, 1, customerId);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const accountId = sub.metadata?.accountId;
    if (accountId) {
      await revokeProSubscription(accountId);
    } else if (sub.customer) {
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const account = await getAccountByStripeCustomerId(customerId);
      if (account) await revokeProSubscription(account.id);
    }
  }

  return NextResponse.json({ received: true });
}
