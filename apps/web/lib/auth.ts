import { cookies } from 'next/headers';
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

export function createCustomerToken(accountId: string): string {
  return signAuthToken({ role: 'customer', accountId });
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return process.env.NODE_ENV === 'development' && password === 'admin';
  }
  return password === expected;
}
