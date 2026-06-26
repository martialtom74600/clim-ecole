import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, createAdminToken, verifyAdminPassword } from '@/lib/auth';

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  if (!verifyAdminPassword(body.password ?? '')) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
