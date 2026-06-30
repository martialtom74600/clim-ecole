/**
 * Client Supabase pour scripts Node (cron, sync).
 * Node < 22 n'a pas WebSocket natif — @supabase/realtime-js exige le transport `ws`.
 */
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

export function createSupabaseNodeClient(url, key) {
  const options = {
    auth: { persistSession: false, autoRefreshToken: false },
  };
  if (typeof globalThis.WebSocket === 'undefined') {
    options.realtime = { transport: ws };
  }
  return createClient(url, key, options);
}

export function getSupabaseFromEnv() {
  const url = process.env.SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) return null;
  return createSupabaseNodeClient(url, key);
}

export function requireSupabaseFromEnv() {
  const client = getSupabaseFromEnv();
  if (!client) {
    throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
  }
  return client;
}
