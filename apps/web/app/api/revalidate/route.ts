import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { PROSPECTION_CACHE_TAG } from '@/lib/data';

/** Invalide le cache prospection après sync Supabase (pipeline). */
export async function POST(request: Request) {
  const secret =
    request.headers.get('x-revalidate-secret') ??
    new URL(request.url).searchParams.get('secret');

  const expected = process.env.REVALIDATE_SECRET?.trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidateTag(PROSPECTION_CACHE_TAG);
  return NextResponse.json({ revalidated: true, tag: PROSPECTION_CACHE_TAG });
}
