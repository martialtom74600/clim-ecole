import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { readCache, writeCache } from '../utils/persistentCache.js';

const CACHE_NS = 'mairie-email';
const memoryCache = new Map();

const EMAIL_PRIORITY = [/dgs@/i, /secretariat@/i, /accueil@/i, /mairie@/i];

function pickBestEmail(records) {
  const emails = records
    .map((record) => record.adresse_courriel?.trim())
    .filter(Boolean);

  if (emails.length === 0) {
    return '';
  }

  for (const pattern of EMAIL_PRIORITY) {
    const match = emails.find((email) => pattern.test(email));
    if (match) {
      return match;
    }
  }

  return emails[0];
}

export async function fetchMairieEmail(codeInsee) {
  if (memoryCache.has(codeInsee)) {
    return memoryCache.get(codeInsee);
  }

  const cached = await readCache(CACHE_NS, codeInsee);
  if (cached !== undefined) {
    memoryCache.set(codeInsee, cached);
    return cached;
  }

  const data = await api.annuaire.getJson(config.apis.annuaire, {
    params: {
      limit: 20,
      where: `code_insee_commune LIKE "${codeInsee}" and pivot LIKE "mairie"`,
      select: 'nom,adresse_courriel,pivot',
    },
    label: 'Annuaire administration',
  });

  const email = pickBestEmail(data.results ?? []);
  memoryCache.set(codeInsee, email);
  await writeCache(CACHE_NS, codeInsee, email, { ttlMs: 7 * 24 * 60 * 60 * 1000 });
  return email;
}
