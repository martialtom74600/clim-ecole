import { NextResponse } from 'next/server';
import { getCsvSyncMeta } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/supabase-server';

export async function GET() {
  const meta = await getCsvSyncMeta();
  return NextResponse.json({
    ...meta,
    source: isSupabaseConfigured() ? 'supabase' : 'csv',
  });
}
