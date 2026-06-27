import { getSupabaseServer, isSupabaseConfigured } from './supabase-server';
import { getMaxUnlocksPerPack } from './pack-config';
import { newAccountId } from './crypto';
import type { ClientPersona } from './brand';
import type { AlertSubscription, CustomerAccount } from './entitlements-store';

export { isSupabaseConfigured as isEntitlementsDbConfigured };

function rowToAccount(row: {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  pro_until: string | null;
  created_at: string;
  updated_at: string;
}): CustomerAccount {
  return {
    id: row.id,
    email: row.email ?? '',
    proUntil: row.pro_until,
    packIds: [],
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadPackIds(accountId: string): Promise<string[]> {
  const sb = getSupabaseServer();
  const { data } = await sb
    .from('pack_unlocks')
    .select('pack_id')
    .eq('account_id', accountId);
  return (data ?? []).map((r) => r.pack_id as string);
}

async function hydrateAccount(
  row: Parameters<typeof rowToAccount>[0],
): Promise<CustomerAccount> {
  const account = rowToAccount(row);
  account.packIds = await loadPackIds(account.id);
  return account;
}

export async function dbGetAccount(accountId: string): Promise<CustomerAccount | null> {
  const sb = getSupabaseServer();
  const { data } = await sb
    .from('customer_accounts')
    .select('*')
    .eq('id', accountId)
    .maybeSingle();
  if (!data) return null;
  return hydrateAccount(data);
}

export async function dbGetAccountByStripeCustomerId(
  stripeCustomerId: string,
): Promise<CustomerAccount | null> {
  const sb = getSupabaseServer();
  const { data } = await sb
    .from('customer_accounts')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  if (!data) return null;
  return hydrateAccount(data);
}

export async function dbGetOrCreateAccount(
  accountId?: string,
  email?: string,
): Promise<CustomerAccount> {
  const sb = getSupabaseServer();
  const id = accountId ?? newAccountId();

  if (accountId) {
    const existing = await dbGetAccount(accountId);
    if (existing) return existing;
  }

  const { data, error } = await sb
    .from('customer_accounts')
    .insert({
      id,
      email: email ?? '',
    })
    .select('*')
    .single();

  if (error) {
    const fallback = await dbGetAccount(id);
    if (fallback) return fallback;
    throw error;
  }

  return rowToAccount(data);
}

export async function dbUpdateAccount(
  accountId: string,
  patch: Partial<Pick<CustomerAccount, 'email' | 'proUntil' | 'stripeCustomerId'>>,
): Promise<CustomerAccount | null> {
  const sb = getSupabaseServer();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.email !== undefined) update.email = patch.email;
  if (patch.proUntil !== undefined) update.pro_until = patch.proUntil;
  if (patch.stripeCustomerId !== undefined) update.stripe_customer_id = patch.stripeCustomerId;

  const { data, error } = await sb
    .from('customer_accounts')
    .update(update)
    .eq('id', accountId)
    .select('*')
    .maybeSingle();

  if (error || !data) return null;
  return hydrateAccount(data);
}

export async function dbGetPackUnlockCount(packId: string): Promise<number> {
  const sb = getSupabaseServer();
  const { count } = await sb
    .from('pack_unlocks')
    .select('*', { count: 'exact', head: true })
    .eq('pack_id', packId);
  return count ?? 0;
}

export async function dbGrantPackAccess(
  accountId: string,
  packId: string,
  codeEpci?: string | null,
  stripeSessionId?: string | null,
): Promise<boolean> {
  const sb = getSupabaseServer();
  const { data, error } = await sb.rpc('grant_pack_unlock', {
    p_account_id: accountId,
    p_pack_id: packId,
    p_code_epci: codeEpci ?? null,
    p_max_unlocks: getMaxUnlocksPerPack(),
    p_stripe_session_id: stripeSessionId ?? null,
  });

  if (error) {
    console.error('[entitlements] grant_pack_unlock error:', error.message);
    return false;
  }

  const result = data as { ok?: boolean } | null;
  return Boolean(result?.ok);
}

export async function dbGrantProSubscription(
  accountId: string,
  months = 1,
  stripeCustomerId?: string,
): Promise<void> {
  const account = await dbGetAccount(accountId);
  if (!account) return;

  const base =
    account.proUntil && new Date(account.proUntil) > new Date()
      ? new Date(account.proUntil)
      : new Date();
  base.setMonth(base.getMonth() + months);

  await dbUpdateAccount(accountId, {
    proUntil: base.toISOString(),
    stripeCustomerId: stripeCustomerId ?? account.stripeCustomerId,
  });
}

export async function dbRevokeProSubscription(accountId: string): Promise<void> {
  await dbUpdateAccount(accountId, { proUntil: new Date().toISOString() });
}

export async function dbIsStripeEventProcessed(eventId: string): Promise<boolean> {
  const sb = getSupabaseServer();
  const { data } = await sb
    .from('stripe_events')
    .select('event_id')
    .eq('event_id', eventId)
    .maybeSingle();
  return Boolean(data);
}

export async function dbMarkStripeEventProcessed(
  eventId: string,
  eventType: string,
): Promise<void> {
  const sb = getSupabaseServer();
  await sb.from('stripe_events').upsert({
    event_id: eventId,
    event_type: eventType,
    processed_at: new Date().toISOString(),
  });
}

export async function dbListAlertSubscriptions(email?: string): Promise<AlertSubscription[]> {
  const sb = getSupabaseServer();
  let query = sb.from('alert_subscriptions').select('*');
  if (email) {
    query = query.ilike('email', email.trim());
  }
  const { data } = await query;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    email: r.email as string,
    accountId: (r.account_id as string | null) ?? undefined,
    minCapex: r.min_capex as number,
    personas: (r.personas as ClientPersona[]) ?? [],
    createdAt: r.created_at as string,
  }));
}

export async function dbUpsertAlertSubscription(input: {
  email: string;
  minCapex: number;
  personas: ClientPersona[];
  accountId?: string;
}): Promise<AlertSubscription> {
  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from('alert_subscriptions')
    .upsert(
      {
        email: input.email.trim(),
        min_capex: input.minCapex,
        personas: input.personas,
        account_id: input.accountId ?? null,
      },
      { onConflict: 'email' },
    )
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id as string,
    email: data.email as string,
    accountId: (data.account_id as string | null) ?? undefined,
    minCapex: data.min_capex as number,
    personas: (data.personas as ClientPersona[]) ?? [],
    createdAt: data.created_at as string,
  };
}

export async function dbDeleteAlertSubscription(email: string): Promise<boolean> {
  const sb = getSupabaseServer();
  const { count } = await sb
    .from('alert_subscriptions')
    .delete({ count: 'exact' })
    .ilike('email', email.trim());
  return (count ?? 0) > 0;
}
