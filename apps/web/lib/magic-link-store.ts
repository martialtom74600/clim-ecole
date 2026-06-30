/**
 * Persistance des tokens magic-link — socle du single-use et du rate-limiting.
 * Supabase en prod, fichier JSON local en dev (jamais en production).
 */
import fs from 'fs/promises';
import path from 'path';
import { getSupabaseServer, isSupabaseConfigured } from './supabase-server';

export interface MagicLinkRecord {
  jti: string;
  accountId: string;
  email: string;
  requesterIp: string | null;
  expiresAt: string;
  consumedAt?: string | null;
  createdAt: string;
}

interface MagicLinkStoreFile {
  tokens: MagicLinkRecord[];
}

const STORE_PATH = path.join(process.cwd(), 'data', 'magic-links.json');

function useDb(): boolean {
  if (isSupabaseConfigured()) return true;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SUPABASE requis en production pour les magic-link tokens');
  }
  return false;
}

async function readStore(): Promise<MagicLinkStoreFile> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<MagicLinkStoreFile>;
    return { tokens: parsed.tokens ?? [] };
  } catch {
    return { tokens: [] };
  }
}

async function writeStore(store: MagicLinkStoreFile): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  // On purge au passage les tokens trop vieux pour éviter une croissance infinie en dev.
  const cutoff = Date.now() - 1000 * 60 * 60 * 24;
  store.tokens = store.tokens.filter((t) => new Date(t.createdAt).getTime() > cutoff);
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

export async function createMagicLinkToken(record: MagicLinkRecord): Promise<void> {
  if (useDb()) {
    const sb = getSupabaseServer();
    await sb.from('magic_link_tokens').insert({
      jti: record.jti,
      account_id: record.accountId,
      email: record.email,
      requester_ip: record.requesterIp,
      expires_at: record.expiresAt,
      created_at: record.createdAt,
    });
    return;
  }
  const store = await readStore();
  store.tokens.push(record);
  await writeStore(store);
}

/**
 * Consomme un token : ne réussit qu'une seule fois (single-use) et seulement si
 * le token n'est ni expiré ni déjà utilisé. Renvoie le compte ciblé, sinon null.
 */
export async function consumeMagicLinkToken(
  jti: string,
): Promise<{ accountId: string; email: string } | null> {
  const now = new Date().toISOString();

  if (useDb()) {
    const sb = getSupabaseServer();
    // Update conditionnel atomique : on ne marque consommé que si pas déjà consommé
    // et pas expiré → empêche le rejeu même en cas de double-clic concurrent.
    const { data } = await sb
      .from('magic_link_tokens')
      .update({ consumed_at: now })
      .eq('jti', jti)
      .is('consumed_at', null)
      .gt('expires_at', now)
      .select('account_id, email')
      .maybeSingle();
    if (!data) return null;
    return { accountId: data.account_id as string, email: data.email as string };
  }

  const store = await readStore();
  const token = store.tokens.find((t) => t.jti === jti);
  if (!token) return null;
  if (token.consumedAt) return null;
  if (new Date(token.expiresAt).getTime() < Date.now()) return null;
  token.consumedAt = now;
  await writeStore(store);
  return { accountId: token.accountId, email: token.email };
}

/** Nombre de demandes récentes pour un email et une IP (fenêtre glissante). */
export async function countRecentMagicRequests(opts: {
  email: string;
  ip: string | null;
  sinceMs: number;
}): Promise<{ byEmail: number; byIp: number }> {
  const since = new Date(Date.now() - opts.sinceMs).toISOString();
  const email = opts.email.trim().toLowerCase();

  if (useDb()) {
    const sb = getSupabaseServer();
    const emailQuery = await sb
      .from('magic_link_tokens')
      .select('jti', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', since);
    let byIp = 0;
    if (opts.ip) {
      const ipQuery = await sb
        .from('magic_link_tokens')
        .select('jti', { count: 'exact', head: true })
        .eq('requester_ip', opts.ip)
        .gte('created_at', since);
      byIp = ipQuery.count ?? 0;
    }
    return { byEmail: emailQuery.count ?? 0, byIp };
  }

  const store = await readStore();
  const recent = store.tokens.filter((t) => t.createdAt >= since);
  return {
    byEmail: recent.filter((t) => t.email.trim().toLowerCase() === email).length,
    byIp: opts.ip ? recent.filter((t) => t.requesterIp === opts.ip).length : 0,
  };
}
