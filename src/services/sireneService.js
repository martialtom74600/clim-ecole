import { config } from '../config.js';
import { getSireneJson } from '../utils/sireneClient.js';
import { readCache, writeCache } from '../utils/persistentCache.js';

const ELIGIBLE_TRANCHES = new Set(['11', '12', '21', '22', '31', '32', '41', '42', '51', '52', '53']);
const CACHE_NS = 'sirene-tranche';
const memoryCache = new Map();

function extractTrancheFromResult(siret, result) {
  if (!result) {
    return null;
  }

  const matching = (result.matching_etablissements ?? []).find(
    (etablissement) => etablissement.siret === siret,
  );

  if (matching?.tranche_effectif_salarie) {
    return matching.tranche_effectif_salarie;
  }

  if (result.siege?.siret === siret) {
    return result.siege.tranche_effectif_salarie ?? null;
  }

  return null;
}

export async function fetchTrancheEffectifEtablissement(siret) {
  if (memoryCache.has(siret)) {
    return memoryCache.get(siret);
  }

  const cached = await readCache(CACHE_NS, siret);
  if (cached !== undefined) {
    memoryCache.set(siret, cached);
    return cached;
  }

  const data = await getSireneJson('/search', {
    params: {
      q: siret,
      per_page: 1,
    },
    label: 'recherche-entreprises.api.gouv.fr',
  });

  const tranche = extractTrancheFromResult(siret, data.results?.[0] ?? null);
  memoryCache.set(siret, tranche);
  await writeCache(CACHE_NS, siret, tranche, { ttlMs: 30 * 24 * 60 * 60 * 1000 });
  return tranche;
}

export function isEligibleTrancheEffectif(tranche) {
  if (!tranche || tranche === 'NN') {
    return false;
  }

  const numericTranche = Number(tranche);
  if (!Number.isNaN(numericTranche)) {
    return numericTranche >= config.minTrancheEffectif;
  }

  return ELIGIBLE_TRANCHES.has(String(tranche));
}
