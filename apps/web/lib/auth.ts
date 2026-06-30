import { cookies } from 'next/headers';
import { timingSafeEqual } from 'crypto';
import { signAuthToken, verifyAuthToken } from './crypto';

export const ADMIN_COOKIE = 'clim_admin';
export const CUSTOMER_COOKIE = 'clim_access';

interface AdminSession {
  role: 'admin';
  exp?: number;
}

interface CustomerSession {
  role: 'customer';
  accountId: string;
  /** Version de session — comparée à customer_accounts.session_version pour révocation. */
  v?: number;
  exp?: number;
}

export async function getAdminSession(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const session = verifyAuthToken<AdminSession>(token);
  return session?.role === 'admin';
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const session = verifyAuthToken<CustomerSession>(token);
  return session?.role === 'customer' ? session : null;
}

export function createAdminToken(): string {
  return signAuthToken({ role: 'admin' });
}

export function createCustomerToken(accountId: string, sessionVersion = 1): string {
  return signAuthToken({ role: 'customer', accountId, v: sessionVersion });
}

function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) {
    if (process.env.NODE_ENV === 'development' && password === 'admin') {
      return true;
    }
    return false;
  }
  return safeEqualString(password, expected);
}

/** Autorise uniquement les chemins relatifs internes admin/explorer. */
export function sanitizeInternalRedirect(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }
  if (next.includes('://') || next.includes('\\')) {
    return fallback;
  }
  return next;
}
