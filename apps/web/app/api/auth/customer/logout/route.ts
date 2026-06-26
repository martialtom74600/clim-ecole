import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CUSTOMER_COOKIE } from '@/lib/auth';

export async function POST() {
  const jar = await cookies();
  jar.delete(CUSTOMER_COOKIE);
  return NextResponse.json({ ok: true });
}
