/**
 * Store JSON local — fallback dev uniquement si Supabase non configuré.
 * Ne pas utiliser en production.
 */
import fs from 'fs/promises';
import path from 'path';
import { newAccountId } from './crypto';
import { getMaxUnlocksPerPack } from './pack-config';
import type { ClientPersona } from './brand';

export interface CustomerAccount {
  id: string;
  email: string;
  proUntil: string | null;
  packIds: string[];
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertSubscription {
  id: string;
  email: string;
  accountId?: string;
  minCapex: number;
  personas: ClientPersona[];
  createdAt: string;
}

interface EntitlementsStore {
  accounts: Record<string, CustomerAccount>;
  alerts: AlertSubscription[];
}

const STORE_PATH = path.join(process.cwd(), 'data', 'entitlements.json');

async function readStore(): Promise<EntitlementsStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<EntitlementsStore>;
    return {
      accounts: parsed.accounts ?? {},
      alerts: parsed.alerts ?? [],
    };
  } catch {
    return { accounts: {}, alerts: [] };
  }
}

async function writeStore(store: EntitlementsStore): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

export function isJsonStoreAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export async function jsonGetAccount(accountId: string): Promise<CustomerAccount | null> {
  const store = await readStore();
  return store.accounts[accountId] ?? null;
}

export async function jsonGetAccountByStripeCustomerId(
  stripeCustomerId: string,
): Promise<CustomerAccount | null> {
  const store = await readStore();
  return (
    Object.values(store.accounts).find((a) => a.stripeCustomerId === stripeCustomerId) ?? null
  );
}

export async function jsonGetOrCreateAccount(
  accountId?: string,
  email?: string,
): Promise<CustomerAccount> {
  const store = await readStore();
  const id = accountId ?? newAccountId();
  const existing = store.accounts[id];
  if (existing) return existing;

  const now = new Date().toISOString();
  const account: CustomerAccount = {
    id,
    email: email ?? '',
    proUntil: null,
    packIds: [],
    createdAt: now,
    updatedAt: now,
  };
  store.accounts[id] = account;
  await writeStore(store);
  return account;
}

export async function jsonUpdateAccount(
  accountId: string,
  patch: Partial<Pick<CustomerAccount, 'email' | 'proUntil' | 'packIds' | 'stripeCustomerId'>>,
): Promise<CustomerAccount | null> {
  const store = await readStore();
  const account = store.accounts[accountId];
  if (!account) return null;

  Object.assign(account, patch, { updatedAt: new Date().toISOString() });
  store.accounts[accountId] = account;
  await writeStore(store);
  return account;
}

export async function jsonGetPackUnlockCount(packId: string): Promise<number> {
  const store = await readStore();
  let count = 0;
  for (const account of Object.values(store.accounts)) {
    if (account.packIds.includes(packId)) count++;
  }
  return count;
}

export async function jsonGrantPackAccess(accountId: string, packId: string): Promise<boolean> {
  const account = await jsonGetAccount(accountId);
  if (!account) return false;
  if (account.packIds.includes(packId)) return true;

  const max = getMaxUnlocksPerPack();
  const used = await jsonGetPackUnlockCount(packId);
  const proActive =
    account.proUntil !== null && new Date(account.proUntil) > new Date();

  if (!proActive && used >= max) return false;

  await jsonUpdateAccount(accountId, { packIds: [...account.packIds, packId] });
  return true;
}

export async function jsonGrantProSubscription(
  accountId: string,
  months = 1,
  stripeCustomerId?: string,
): Promise<void> {
  const account = await jsonGetAccount(accountId);
  if (!account) return;
  const base =
    account.proUntil && new Date(account.proUntil) > new Date()
      ? new Date(account.proUntil)
      : new Date();
  base.setMonth(base.getMonth() + months);
  await jsonUpdateAccount(accountId, {
    proUntil: base.toISOString(),
    stripeCustomerId: stripeCustomerId ?? account.stripeCustomerId,
  });
}

export async function jsonRevokeProSubscription(accountId: string): Promise<void> {
  await jsonUpdateAccount(accountId, { proUntil: new Date().toISOString() });
}

export async function jsonListAlertSubscriptions(email?: string): Promise<AlertSubscription[]> {
  const store = await readStore();
  if (!email) return store.alerts;
  const norm = email.trim().toLowerCase();
  return store.alerts.filter((a) => a.email.toLowerCase() === norm);
}

export async function jsonUpsertAlertSubscription(input: {
  email: string;
  minCapex: number;
  personas: ClientPersona[];
  accountId?: string;
}): Promise<AlertSubscription> {
  const store = await readStore();
  const norm = input.email.trim().toLowerCase();
  const existing = store.alerts.find((a) => a.email.toLowerCase() === norm);

  if (existing) {
    existing.minCapex = input.minCapex;
    existing.personas = input.personas;
    existing.accountId = input.accountId ?? existing.accountId;
    await writeStore(store);
    return existing;
  }

  const sub: AlertSubscription = {
    id: newAccountId(),
    email: input.email.trim(),
    accountId: input.accountId,
    minCapex: input.minCapex,
    personas: input.personas,
    createdAt: new Date().toISOString(),
  };
  store.alerts.push(sub);
  await writeStore(store);
  return sub;
}

export async function jsonDeleteAlertSubscription(email: string): Promise<boolean> {
  const store = await readStore();
  const norm = email.trim().toLowerCase();
  const before = store.alerts.length;
  store.alerts = store.alerts.filter((a) => a.email.toLowerCase() !== norm);
  if (store.alerts.length === before) return false;
  await writeStore(store);
  return true;
}
