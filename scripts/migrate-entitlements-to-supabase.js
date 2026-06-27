#!/usr/bin/env node
/**
 * Migre data/entitlements.json → Supabase (customer_accounts, pack_unlocks, alert_subscriptions).
 * Usage: node scripts/migrate-entitlements-to-supabase.js
 * Requiert: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const storePath = path.join(root, 'apps/web/data/entitlements.json');

async function main() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
    process.exit(1);
  }

  let store = { accounts: {}, alerts: [] };
  try {
    const raw = await fs.readFile(storePath, 'utf-8');
    store = JSON.parse(raw);
  } catch {
    console.log('Aucun entitlements.json — rien à migrer');
    return;
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  for (const account of Object.values(store.accounts ?? {})) {
    const { error: accErr } = await sb.from('customer_accounts').upsert({
      id: account.id,
      email: account.email ?? '',
      stripe_customer_id: account.stripeCustomerId ?? null,
      pro_until: account.proUntil,
      created_at: account.createdAt,
      updated_at: account.updatedAt,
    });
    if (accErr) {
      console.error('account', account.id, accErr.message);
      continue;
    }

    for (const packId of account.packIds ?? []) {
      const { error: puErr } = await sb.from('pack_unlocks').upsert(
        { account_id: account.id, pack_id: packId },
        { onConflict: 'account_id,pack_id' },
      );
      if (puErr) console.error('pack_unlock', packId, puErr.message);
    }
  }

  for (const alert of store.alerts ?? []) {
    const { error } = await sb.from('alert_subscriptions').upsert(
      {
        id: alert.id,
        email: alert.email,
        account_id: alert.accountId ?? null,
        min_capex: alert.minCapex,
        personas: alert.personas,
        created_at: alert.createdAt,
      },
      { onConflict: 'email' },
    );
    if (error) console.error('alert', alert.email, error.message);
  }

  console.log('Migration terminée.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
