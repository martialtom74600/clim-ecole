import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';
import {
  checkPackEntitlement,
  isProActive,
  waitForPackEntitlement,
  waitForProEntitlement,
  getAccount,
} from '@/lib/entitlements';
import { getStripe, isStripeConfigured } from '@/lib/stripe';

/**
 * Confirmation post-checkout — ne grant JAMAIS les droits (webhook Stripe uniquement).
 * Vérifie que le navigateur correspond à l'acheteur et attend l'activation webhook.
 */
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
  const packId = session.metadata?.packId || null;

  if (!accountId || !plan) {
    return NextResponse.json({ error: 'Métadonnées session invalides' }, { status: 400 });
  }

  const customerSession = await getCustomerSession();
  if (!customerSession || customerSession.accountId !== accountId) {
    return NextResponse.json(
      {
        error:
          'Session navigateur invalide. Rouvrez le lien de confirmation sur le même appareil que le paiement.',
        code: 'session_mismatch',
      },
      { status: 403 },
    );
  }

  let ready = false;
  if (plan === 'pro') {
    ready = await waitForProEntitlement(accountId);
  } else if (packId) {
    ready = await waitForPackEntitlement(accountId, packId);
  }

  if (!ready) {
    return NextResponse.json(
      {
        error: 'Activation en cours. Actualisez dans quelques secondes ou consultez Mon compte.',
        code: 'activation_pending',
        plan,
        packId,
      },
      { status: 202 },
    );
  }

  const account = await getAccount(accountId);
  const entitled =
    plan === 'pro'
      ? isProActive(account)
      : packId
        ? await checkPackEntitlement(accountId, packId)
        : false;

  if (!entitled) {
    return NextResponse.json({ error: 'Accès non activé' }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    plan,
    packId,
    redirect: packId ? `/explorer/${packId}` : '/compte',
  });
}
