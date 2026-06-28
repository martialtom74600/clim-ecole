/**
 * Encode / decode packId — isomorphe (serveur Node + navigateur).
 *
 * Important : `Buffer` n'existe pas dans le navigateur. Utiliser `Buffer`
 * uniquement côté client renvoyait `null`, ce qui provoquait un mismatch
 * d'hydratation (le serveur affichait le code EPCI, le client non). On utilise
 * donc `Buffer` quand il est disponible (serveur) et `atob`/`btoa` sinon
 * (navigateur) — les deux produisent un résultat identique pour notre contenu
 * ASCII, donc plus aucun écart serveur/client.
 */

const PREFIX = 'clim-pack:';

function toBase64Url(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  return b64 + '='.repeat((4 - (b64.length % 4)) % 4);
}

// `atob`/`btoa` sont globaux côté serveur (Node ≥ 18) ET navigateur, et
// produisent un résultat identique pour notre contenu ASCII. On évite `Buffer`
// dont le polyfill client ne supporte pas l'encodage `base64url`.
export function encodePackId(codeEpci: string): string {
  return toBase64Url(btoa(`${PREFIX}${codeEpci}`));
}

export function decodePackId(packId: string): string | null {
  try {
    const raw = atob(fromBase64Url(packId));
    if (!raw.startsWith(PREFIX)) return null;
    return raw.slice(PREFIX.length) || null;
  } catch {
    return null;
  }
}
