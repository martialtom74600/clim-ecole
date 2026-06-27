import { NextResponse } from 'next/server';
import {
  getAccount,
  getAccountByStripeCustomerId,
  grantPackAccess,
  grantProSubscription,
  isStripeEventProcessed,
  markStripeEventProcessed,
  revokeProSubscription,
  updateAccount,
} from '@/lib/entitlements';
import { decodePackId } from '@/lib/marketplace';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { appUrl, getStripe, isStripeConfigured } from '@/lib/stripe';
import { validateCheckoutSession } from '@/lib/stripe-webhook';

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

  if (await isStripeEventProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const accountId = session.metadata?.accountId;
    const plan = session.metadata?.plan as 'dossier' | 'pro' | undefined;
    const packId = session.metadata?.packId || undefined;

    if (!accountId || !plan) {
      console.error('[stripe/webhook] metadata invalides', session.id);
      await markStripeEventProcessed(event.id, event.type);
      return NextResponse.json({ received: true, skipped: true });
    }

    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    });

    const validation = validateCheckoutSession(fullSession, plan);
    if (!validation.ok) {
      console.error('[stripe/webhook] session rejetée:', validation.reason, session.id);
      await markStripeEventProcessed(event.id, event.type);
      return NextResponse.json({ received: true, rejected: validation.reason });
    }

    const email = session.customer_email ?? session.customer_details?.email;
    if (email) {
      await updateAccount(accountId, { email });
    }

    let grantOk = true;

    if (plan === 'pro') {
      await grantProSubscription(accountId, 1, session.customer as string | undefined);
    } else if (packId) {
      const codeEpci = decodePackId(packId);
      grantOk = await grantPackAccess(accountId, packId, {
        codeEpci: codeEpci ?? undefined,
        stripeSessionId: session.id,
      });
      if (!grantOk) {
        console.error('[stripe/webhook] GRANT_FAILED quota pack', packId, accountId, session.id);
      }
    }

    if (email && grantOk) {
      const packUrl = packId ? `${appUrl()}/explorer/${packId}` : undefined;
      await sendPurchaseConfirmationEmail(email, { plan, packUrl });
    }

    await markStripeEventProcessed(event.id, event.type);
    return NextResponse.json({ received: true, grantOk });
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    if (invoice.billing_reason === 'subscription_cycle' && invoice.customer) {
      const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
      const account =
        (invoice.metadata?.accountId
          ? await getAccount(invoice.metadata.accountId)
          : null) ?? (await getAccountByStripeCustomerId(customerId));
      if (account) {
        await grantProSubscription(account.id, 1, customerId);
      }
    }
    await markStripeEventProcessed(event.id, event.type);
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
    await markStripeEventProcessed(event.id, event.type);
  }

  return NextResponse.json({ received: true });
}
