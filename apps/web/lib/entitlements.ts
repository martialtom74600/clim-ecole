import { getMaxUnlocksPerPack } from './pack-config';
import type { ClientPersona } from './brand';
import { isSupabaseConfigured } from './supabase-server';
import { isTestMode } from './test-mode';
import {
  isJsonStoreAllowed,
  jsonDeleteAlertSubscription,
  jsonGetAccount,
  jsonGetAccountByStripeCustomerId,
  jsonGetOrCreateAccount,
  jsonGetPackUnlockCount,
  jsonGrantPackAccess,
  jsonGrantProSubscription,
  jsonListAlertSubscriptions,
  jsonRevokeProSubscription,
  jsonUpdateAccount,
  jsonUpsertAlertSubscription,
  type AlertSubscription,
  type CustomerAccount,
} from './entitlements-store';
import {
  dbDeleteAlertSubscription,
  dbGetAccount,
  dbGetAccountByStripeCustomerId,
  dbGetOrCreateAccount,
  dbGetPackUnlockCount,
  dbGrantPackAccess,
  dbGrantProSubscription,
  dbIsStripeEventProcessed,
  dbListAlertSubscriptions,
  dbMarkStripeEventProcessed,
  dbRevokeProSubscription,
  dbUpdateAccount,
  dbUpsertAlertSubscription,
} from './entitlements-db';

export type { AlertSubscription, CustomerAccount };

function useDb(): boolean {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis en production pour les entitlements',
      );
    }
    if (!isJsonStoreAllowed()) {
      throw new Error('Store entitlements indisponible');
    }
    return false;
  }
  return true;
}

export async function getAccount(accountId: string): Promise<CustomerAccount | null> {
  return useDb() ? dbGetAccount(accountId) : jsonGetAccount(accountId);
}

export async function getAccountByStripeCustomerId(
  stripeCustomerId: string,
): Promise<CustomerAccount | null> {
  return useDb()
    ? dbGetAccountByStripeCustomerId(stripeCustomerId)
    : jsonGetAccountByStripeCustomerId(stripeCustomerId);
}

export async function getOrCreateAccount(
  accountId?: string,
  email?: string,
): Promise<CustomerAccount> {
  return useDb() ? dbGetOrCreateAccount(accountId, email) : jsonGetOrCreateAccount(accountId, email);
}

export async function updateAccount(
  accountId: string,
  patch: Partial<Pick<CustomerAccount, 'email' | 'proUntil' | 'packIds' | 'stripeCustomerId'>>,
): Promise<CustomerAccount | null> {
  if (useDb()) {
    const { packIds: _omit, ...dbPatch } = patch;
    return dbUpdateAccount(accountId, dbPatch);
  }
  return jsonUpdateAccount(accountId, patch);
}

export async function getPackUnlockCount(packId: string): Promise<number> {
  return useDb() ? dbGetPackUnlockCount(packId) : jsonGetPackUnlockCount(packId);
}

export interface PackAvailability {
  max: number;
  used: number;
  remaining: number;
  soldOut: boolean;
}

export async function getPackAvailability(packId: string): Promise<PackAvailability> {
  const max = getMaxUnlocksPerPack();
  const used = await getPackUnlockCount(packId);
  const remaining = Math.max(0, max - used);
  return { max, used, remaining, soldOut: remaining <= 0 };
}

export async function canPurchasePack(
  packId: string,
  accountId?: string | null,
): Promise<{ ok: boolean; availability: PackAvailability }> {
  const availability = await getPackAvailability(packId);
  if (!accountId) {
    return { ok: !availability.soldOut, availability };
  }
  const account = await getAccount(accountId);
  if (account?.packIds.includes(packId)) {
    return { ok: true, availability };
  }
  if (account && isProActive(account)) {
    return { ok: true, availability };
  }
  return { ok: !availability.soldOut, availability };
}

export async function grantPackAccess(
  accountId: string,
  packId: string,
  opts?: { codeEpci?: string; stripeSessionId?: string },
): Promise<boolean> {
  if (useDb()) {
    return dbGrantPackAccess(
      accountId,
      packId,
      opts?.codeEpci,
      opts?.stripeSessionId,
    );
  }
  return jsonGrantPackAccess(accountId, packId);
}

export async function grantProSubscription(
  accountId: string,
  months = 1,
  stripeCustomerId?: string,
): Promise<void> {
  if (useDb()) {
    await dbGrantProSubscription(accountId, months, stripeCustomerId);
    return;
  }
  await jsonGrantProSubscription(accountId, months, stripeCustomerId);
}

export async function revokeProSubscription(accountId: string): Promise<void> {
  if (useDb()) {
    await dbRevokeProSubscription(accountId);
    return;
  }
  await jsonRevokeProSubscription(accountId);
}

export function isProActive(account: CustomerAccount | null): boolean {
  if (!account?.proUntil) return false;
  return new Date(account.proUntil) > new Date();
}

export function hasPackAccess(account: CustomerAccount | null, packId: string): boolean {
  if (isTestMode()) return true;
  if (!account) return false;
  if (isProActive(account)) return true;
  return account.packIds.includes(packId);
}

export async function checkPackEntitlement(
  accountId: string | null | undefined,
  packId: string,
): Promise<boolean> {
  if (isTestMode()) return true;
  if (!accountId) return false;
  const account = await getAccount(accountId);
  return hasPackAccess(account, packId);
}

export async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  if (!useDb()) return false;
  return dbIsStripeEventProcessed(eventId);
}

export async function markStripeEventProcessed(
  eventId: string,
  eventType: string,
): Promise<void> {
  if (!useDb()) return;
  await dbMarkStripeEventProcessed(eventId, eventType);
}

export async function listAlertSubscriptions(email?: string): Promise<AlertSubscription[]> {
  return useDb() ? dbListAlertSubscriptions(email) : jsonListAlertSubscriptions(email);
}

export async function upsertAlertSubscription(input: {
  email: string;
  minCapex: number;
  personas: ClientPersona[];
  accountId?: string;
}): Promise<AlertSubscription> {
  return useDb() ? dbUpsertAlertSubscription(input) : jsonUpsertAlertSubscription(input);
}

export async function deleteAlertSubscription(email: string): Promise<boolean> {
  return useDb() ? dbDeleteAlertSubscription(email) : jsonDeleteAlertSubscription(email);
}

/** Attend que le webhook ait activé l'entitlement (success page). */
export async function waitForPackEntitlement(
  accountId: string,
  packId: string,
  maxMs = 25_000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await checkPackEntitlement(accountId, packId)) return true;
    const account = await getAccount(accountId);
    if (account && isProActive(account)) return true;
    await new Promise((r) => setTimeout(r, 800));
  }
  return checkPackEntitlement(accountId, packId);
}

export async function waitForProEntitlement(
  accountId: string,
  maxMs = 25_000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const account = await getAccount(accountId);
    if (account && isProActive(account)) return true;
    await new Promise((r) => setTimeout(r, 800));
  }
  const account = await getAccount(accountId);
  return Boolean(account && isProActive(account));
}
