import { signPayload, verifySignedPayload } from './crypto';

export interface ShareTokenPayload {
  packId: string;
  accountId: string;
  exp: number;
}

const SHARE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours

function shareSecret(): string {
  const base = process.env.AUTH_SECRET?.trim() ?? 'clim-share-dev';
  return `share:${base}`;
}

export function createShareToken(packId: string, accountId: string): string {
  return signPayload(
    { packId, accountId, exp: Date.now() + SHARE_TTL_MS } satisfies ShareTokenPayload,
    shareSecret(),
  );
}

export function verifyShareToken(token: string): ShareTokenPayload | null {
  const data = verifySignedPayload<ShareTokenPayload>(token, shareSecret());
  if (!data?.packId || !data.accountId) return null;
  if (data.exp && Date.now() > data.exp) return null;
  return data;
}
