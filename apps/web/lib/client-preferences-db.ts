import { getSupabaseServer, isSupabaseConfigured } from './supabase-server';
import type { ClientPersona } from './brand';

export interface CustomerPreferences {
  watchlist: string[];
  compareIds: string[];
  blacklistUais: string[];
  onboarding?: {
    persona?: ClientPersona;
    minCapex?: number;
    completedAt?: string;
  };
  referralCode?: string;
}

const EMPTY: CustomerPreferences = {
  watchlist: [],
  compareIds: [],
  blacklistUais: [],
};

export async function getCustomerPreferences(accountId: string): Promise<CustomerPreferences> {
  if (!isSupabaseConfigured()) return { ...EMPTY };
  const sb = getSupabaseServer();
  const { data } = await sb
    .from('customer_preferences')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle();

  if (!data) return { ...EMPTY };

  return {
    watchlist: (data.watchlist as string[]) ?? [],
    compareIds: (data.compare_ids as string[]) ?? [],
    blacklistUais: (data.blacklist_uais as string[]) ?? [],
    onboarding: (data.onboarding as CustomerPreferences['onboarding']) ?? undefined,
    referralCode: (data.referral_code as string) ?? undefined,
  };
}

export async function upsertCustomerPreferences(
  accountId: string,
  patch: Partial<CustomerPreferences>,
): Promise<CustomerPreferences> {
  const current = await getCustomerPreferences(accountId);
  const next: CustomerPreferences = {
    watchlist: patch.watchlist ?? current.watchlist,
    compareIds: patch.compareIds ?? current.compareIds,
    blacklistUais: patch.blacklistUais ?? current.blacklistUais,
    onboarding: patch.onboarding ?? current.onboarding,
    referralCode: patch.referralCode ?? current.referralCode,
  };

  if (!isSupabaseConfigured()) return next;

  const sb = getSupabaseServer();
  await sb.from('customer_preferences').upsert(
    {
      account_id: accountId,
      watchlist: next.watchlist,
      compare_ids: next.compareIds.slice(-3),
      blacklist_uais: next.blacklistUais,
      onboarding: next.onboarding ?? null,
      referral_code: next.referralCode ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'account_id' },
  );

  return next;
}

export async function updatePackNote(
  accountId: string,
  packId: string,
  note: string | null,
  nextFollowUp: string | null,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const sb = getSupabaseServer();
  const { error } = await sb
    .from('pack_unlocks')
    .update({
      note: note?.trim() || null,
      next_follow_up: nextFollowUp || null,
      pipeline_updated_at: new Date().toISOString(),
    })
    .eq('account_id', accountId)
    .eq('pack_id', packId);
  return !error;
}

export async function loadPackNotes(
  accountId: string,
): Promise<Record<string, { note?: string; nextFollowUp?: string }>> {
  if (!isSupabaseConfigured()) return {};
  const sb = getSupabaseServer();
  const { data } = await sb
    .from('pack_unlocks')
    .select('pack_id, note, next_follow_up')
    .eq('account_id', accountId);

  const out: Record<string, { note?: string; nextFollowUp?: string }> = {};
  for (const row of data ?? []) {
    out[row.pack_id as string] = {
      note: (row.note as string) ?? undefined,
      nextFollowUp: (row.next_follow_up as string) ?? undefined,
    };
  }
  return out;
}

export async function logAlertDispatch(
  subscriptionId: string,
  packId: string,
  dispatchType = 'new_territory',
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabaseServer();
  await sb.from('alert_dispatch_log').upsert(
    {
      subscription_id: subscriptionId,
      pack_id: packId,
      dispatch_type: dispatchType,
      sent_at: new Date().toISOString(),
    },
    { onConflict: 'subscription_id,pack_id,dispatch_type' },
  );
}

export async function wasAlertSent(subscriptionId: string, packId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const sb = getSupabaseServer();
  const { data } = await sb
    .from('alert_dispatch_log')
    .select('id')
    .eq('subscription_id', subscriptionId)
    .eq('pack_id', packId)
    .maybeSingle();
  return Boolean(data);
}

function randomReferralCode(): string {
  return `CLIM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function ensureReferralCode(accountId: string): Promise<string> {
  const prefs = await getCustomerPreferences(accountId);
  if (prefs.referralCode) return prefs.referralCode;
  const code = randomReferralCode();
  await upsertCustomerPreferences(accountId, { referralCode: code });
  return code;
}
