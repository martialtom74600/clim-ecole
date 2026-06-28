import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';
import {
  deleteAlertSubscription,
  listAlertSubscriptions,
  upsertAlertSubscription,
} from '@/lib/entitlements';
import { sendAlertWelcomeEmail } from '@/lib/email';
import type { ClientPersona } from '@/lib/brand';

const VALID_PERSONAS = new Set<ClientPersona>(['btp', 'be', 'amo', 'esco', 'cee']);

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ subscribed: false });
  }

  const account = await import('@/lib/entitlements').then((m) => m.getAccount(session.accountId));
  if (!account?.email) {
    return NextResponse.json({ subscribed: false });
  }

  const subs = await listAlertSubscriptions(account.email);
  const sub = subs[0];
  if (!sub) {
    return NextResponse.json({ subscribed: false });
  }

  return NextResponse.json({
    subscribed: true,
    minCapex: sub.minCapex,
    personas: sub.personas,
    email: sub.email,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email: string;
    minCapex?: number;
    personas?: string[];
  };

  const email = body.email?.trim();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  const minCapex = body.minCapex ?? 400_000;
  const personas = (body.personas ?? ['btp', 'be', 'amo', 'esco', 'cee']).filter((p): p is ClientPersona =>
    VALID_PERSONAS.has(p as ClientPersona),
  );

  if (personas.length === 0) {
    return NextResponse.json({ error: 'Sélectionnez au moins un profil' }, { status: 400 });
  }

  const session = await getCustomerSession();
  const sub = await upsertAlertSubscription({
    email,
    minCapex,
    personas,
    accountId: session?.accountId,
  });

  await sendAlertWelcomeEmail(email);

  return NextResponse.json({ ok: true, id: sub.id });
}

export async function DELETE(request: Request) {
  const session = await getCustomerSession();
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 });
  }

  const norm = email.trim().toLowerCase();

  if (!session) {
    return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
  }

  const account = await import('@/lib/entitlements').then((m) => m.getAccount(session.accountId));
  if (!account?.email || account.email.trim().toLowerCase() !== norm) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  await deleteAlertSubscription(email);
  return NextResponse.json({ ok: true });
}
