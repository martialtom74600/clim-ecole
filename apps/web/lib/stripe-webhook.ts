import type Stripe from 'stripe';
import { decodePackId } from './marketplace';

export function validateCheckoutSession(
  session: Stripe.Checkout.Session,
  plan: 'dossier' | 'pro',
): { ok: true } | { ok: false; reason: string } {
  const expectedPrice =
    plan === 'pro' ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_DOSSIER;

  if (!expectedPrice) {
    return { ok: false, reason: 'price_env_missing' };
  }

  if (session.amount_total !== null && session.amount_total <= 0) {
    return { ok: false, reason: 'zero_amount' };
  }

  const linePrice = session.line_items?.data?.[0]?.price?.id;
  if (linePrice && linePrice !== expectedPrice) {
    return { ok: false, reason: 'price_mismatch' };
  }

  if (plan === 'dossier') {
    const packId = session.metadata?.packId;
    if (!packId || !decodePackId(packId)) {
      return { ok: false, reason: 'invalid_pack_id' };
    }
  }

  return { ok: true };
}
