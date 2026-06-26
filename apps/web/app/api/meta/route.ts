import { NextResponse } from 'next/server';
import { getCsvSyncMeta } from '@/lib/data';

export async function GET() {
  const meta = await getCsvSyncMeta();
  return NextResponse.json(meta);
}
