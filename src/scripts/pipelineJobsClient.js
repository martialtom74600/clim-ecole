/**
 * Client Supabase — pipeline_jobs pour priorité refresh.
 */
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

function getSupabase() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    ?? process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) return null;
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  if (typeof globalThis.WebSocket === 'undefined') {
    options.realtime = { transport: ws };
  }
  return createClient(url, key, options);
}

export async function fetchPipelineJobs() {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pipeline_jobs')
    .select('department_code, status, row_count, last_sync_at, csv_sha');
  if (error) {
    console.warn(`[jobs] Supabase pipeline_jobs: ${error.message}`);
    return [];
  }
  return data ?? [];
}
