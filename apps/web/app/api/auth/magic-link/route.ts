import { NextResponse } from 'next/server';
import { sendMagicLinkEmail } from '@/lib/magic-link';
import { dbGetOrCreateAccount } from '@/lib/entitlements-db';
import { newAccountId } from '@/lib/crypto';

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  const account = await dbGetOrCreateAccount(newAccountId(), email);
  const sent = await sendMagicLinkEmail(email, account.id);

  return NextResponse.json({
    ok: true,
    message: sent
      ? 'Lien de connexion envoyé — vérifiez votre boîte mail.'
      : 'Email non configuré (RESEND_API_KEY) — utilisez le cookie après achat.',
  });
}
