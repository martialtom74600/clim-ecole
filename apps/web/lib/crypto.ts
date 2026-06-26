import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

export function signPayload(payload: object, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySignedPayload<T>(token: string, secret: string): T | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', secret).update(data).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export function newAccountId(): string {
  return randomUUID();
}

function authSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.ADMIN_PASSWORD ||
    'clim-ecole-dev-secret-change-me'
  );
}

export function signAuthToken(payload: object): string {
  return signPayload({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }, authSecret());
}

export function verifyAuthToken<T extends object>(token: string): (T & { exp?: number }) | null {
  const data = verifySignedPayload<T & { exp?: number }>(token, authSecret());
  if (!data) return null;
  if (data.exp && Date.now() > data.exp) return null;
  return data;
}
