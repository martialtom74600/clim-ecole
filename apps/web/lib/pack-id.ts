/** Encode / decode packId — utilitaire pur, safe côté client */

const PREFIX = 'clim-pack:';

export function encodePackId(codeEpci: string): string {
  return Buffer.from(`${PREFIX}${codeEpci}`, 'utf8').toString('base64url');
}

export function decodePackId(packId: string): string | null {
  try {
    const raw = Buffer.from(packId, 'base64url').toString('utf8');
    if (!raw.startsWith(PREFIX)) return null;
    return raw.slice(PREFIX.length) || null;
  } catch {
    return null;
  }
}
