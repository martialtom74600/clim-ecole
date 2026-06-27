/**
 * Applique supabase/migrations/20260627000000_entitlements_security.sql
 *
 * Méthodes (dans l'ordre) :
 * 1. DATABASE_URL
 * 2. SUPABASE_DB_PASSWORD + pooler/direct Postgres
 * 3. SUPABASE_ACCESS_TOKEN → Management API POST /database/query
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MIGRATION = path.join(
  root,
  'supabase/migrations/20260627000000_entitlements_security.sql',
);

const EXTRA_SQL = `
-- pipeline_jobs : pas d'accès anon (aligné schema.sql)
revoke select on public.pipeline_jobs from anon;

notify pgrst, 'reload schema';
`;

function projectRef() {
  const url = process.env.SUPABASE_URL?.trim() ?? '';
  return url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;
}

function getConnectionCandidates() {
  if (process.env.DATABASE_URL?.trim()) return [process.env.DATABASE_URL.trim()];
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const ref = projectRef();
  if (!password || !ref) return [];
  const enc = encodeURIComponent(password);
  const region = process.env.SUPABASE_REGION?.trim() || 'eu-west-3';
  return [
    `postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`,
  ];
}

async function applyViaPostgres(sql) {
  const candidates = getConnectionCandidates();
  if (!candidates.length) return { ok: false, reason: 'no_postgres_credentials' };

  let lastError;
  for (const conn of candidates) {
    const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      await client.query(sql);
      await client.end();
      return { ok: true, method: 'postgres' };
    } catch (err) {
      lastError = err;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }

  return { ok: false, reason: 'postgres_failed', error: lastError?.message };
}

async function applyViaManagementApi(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const ref = projectRef();
  if (!token || !ref) return { ok: false, reason: 'no_management_token' };

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, reason: 'management_api_failed', error: `${res.status} ${body.slice(0, 200)}` };
  }

  return { ok: true, method: 'management_api' };
}

async function verify() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return { rpc: false, tables: false };

  const sb = createClient(url, key);
  const tables = ['customer_accounts', 'pack_unlocks', 'alert_subscriptions', 'stripe_events'];
  let tablesOk = true;
  for (const t of tables) {
    const { error } = await sb.from(t).select('*', { head: true });
    if (error) {
      tablesOk = false;
      break;
    }
  }

  const { error: rpcErr } = await sb.rpc('grant_pack_unlock', {
    p_account_id: '00000000-0000-0000-0000-000000000000',
    p_pack_id: '__probe__',
    p_code_epci: null,
    p_max_unlocks: 3,
    p_stripe_session_id: null,
  });

  const rpcOk = !rpcErr || !rpcErr.message.includes('Could not find the function');
  return { tables: tablesOk, rpc: rpcOk, rpcError: rpcErr?.message };
}

async function main() {
  const checkBefore = await verify();
  if (checkBefore.tables && checkBefore.rpc) {
    console.log('[db] Migration déjà appliquée (tables + RPC grant_pack_unlock OK)');
    console.log('[db] Vérification:', checkBefore);
    return;
  }

  const sql = (await fs.readFile(MIGRATION, 'utf-8')) + EXTRA_SQL;

  let result = await applyViaPostgres(sql);
  if (!result.ok) {
    result = await applyViaManagementApi(sql);
  }

  if (!result.ok) {
    console.error('[db] Impossible d\'appliquer la migration automatiquement.');
    if (result.error) console.error('[db]', result.error);
    console.error('');
    console.error('Options :');
    console.error('  1. Reset le mot de passe DB Supabase → mets-le dans SUPABASE_DB_PASSWORD (.env)');
    console.error('  2. Ou ajoute SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)');
    console.error('  3. Ou colle le SQL dans le SQL Editor :');
    console.error(`     https://supabase.com/dashboard/project/${projectRef() ?? 'REF'}/sql/new`);
    console.error(`     Fichier : ${MIGRATION}`);
    process.exit(1);
  }

  console.log(`[db] Migration appliquée via ${result.method}`);

  const check = await verify();
  console.log('[db] Vérification:', check);

  if (!check.rpc) {
    console.error('[db] RPC grant_pack_unlock introuvable — relance notify pgrst ou réapplique la migration');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[db] Échec:', err.message);
  process.exit(1);
});
