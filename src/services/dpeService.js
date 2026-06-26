import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { readCache, writeCache } from '../utils/persistentCache.js';
import { logger } from '../utils/logger.js';
import {
  computeProspectionEnergyEconomics,
  resolveConsoSpecifiqueFromDpe,
  resolveConsoSpecifiqueKwhM2,
  formatStatutDpeDisplay,
  CONSO_FALLBACK_KWH_M2,
} from '../finance/energyEconomics.js';
import { evaluateEetSemanticFilter } from './patrimoineFilter.js';

const CACHE_NS = 'dpe-tertiaire';
const SELECT_FIELDS = [
  'numero_dpe',
  'classe_consommation_energie',
  'consommation_energie',
  'date_etablissement_dpe',
  '_geopoint',
  'secteur_activite',
  'surface_utile',
  'geo_adresse',
  'est_efface',
].join(',');

function extractYear(dateValue) {
  if (!dateValue) {
    return null;
  }
  const match = String(dateValue).match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function parsePositiveNumber(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function extractConsumptionKwhM2(record) {
  if (!record) {
    return null;
  }

  return parsePositiveNumber(record.consommation_energie);
}

export function extractFactureAnnuelleAdeme(record) {
  // Le jeu ADEME DPE tertiaire ne publie pas de frais annuels unitaires.
  return null;
}

function buildDpePayload(record) {
  if (!record) {
    return {
      numeroDpe: null,
      grade: null,
      consommationM2: null,
      factureAnnuelleAdeme: null,
      isConsoFallback: true,
      annee: null,
      statutDpe: 'Absent',
      anneeDpe: null,
      geoDistanceM: null,
    };
  }

  const grade = String(record.classe_consommation_energie ?? '').trim().toUpperCase();
  const consommationM2 = extractConsumptionKwhM2(record);
  const consoCorrigeeM2 = resolveConsoSpecifiqueKwhM2({ rawConsoKwhM2: consommationM2 });
  const factureAnnuelleAdeme = extractFactureAnnuelleAdeme(record);

  return {
    numeroDpe: record.numero_dpe,
    grade: grade || null,
    consommationM2,
    consoCorrigeeM2,
    factureAnnuelleAdeme,
    isConsoFallback: consommationM2 == null || consommationM2 > 400,
    annee: extractYear(record.date_etablissement_dpe),
    statutDpe: formatStatutDpeDisplay({
      grade,
      rawConsoKwhM2: consommationM2,
      usedConsoKwhM2: consoCorrigeeM2,
    }),
    anneeDpe: extractYear(record.date_etablissement_dpe),
    geoDistanceM: record._geo_distance ?? null,
  };
}

export function resolveConsoDpeM2(dpe) {
  return resolveConsoSpecifiqueFromDpe(dpe);
}

export function computeProspectionEconomics(surfaceM2, dpe) {
  return computeProspectionEnergyEconomics(surfaceM2, dpe);
}

function isValidDpeRecord(record) {
  if (record.est_efface === true) {
    return false;
  }

  const grade = String(record.classe_consommation_energie ?? '').trim().toUpperCase();
  if (grade === 'N' || grade === '' || grade === '\\N') {
    return false;
  }

  return true;
}

function isPatrimoineSector(record) {
  return evaluateEetSemanticFilter({
    secteurActivite: record.secteur_activite,
    adresse: record.geo_adresse,
  }).pass;
}

function addressMatchesAsset(record, asset) {
  const address = String(record.geo_adresse ?? '').toLowerCase();
  const assetAddress = String(asset.adresse_uai ?? '').toLowerCase();
  if (!address || !assetAddress) {
    return false;
  }

  const tokens = assetAddress
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9àâäéèêëïîôùûüç-]/gi, ''))
    .filter((token) => token.length > 3);

  return tokens.some((token) => address.includes(token));
}

/** @deprecated */
function isEducationSector(record) {
  return isPatrimoineSector(record);
}

/** @deprecated */
function addressMatchesSchool(record, school) {
  return addressMatchesAsset(record, school);
}

function scoreDpeRecord(record, asset) {
  let score = 0;

  if (record._geo_distance != null) {
    score += Math.max(0, 500 - record._geo_distance);
  }

  if (isPatrimoineSector(record)) {
    score += 200;
  }

  if (addressMatchesAsset(record, asset)) {
    score += 150;
  }

  const year = extractYear(record.date_etablissement_dpe);
  if (year) {
    score += year / 100;
  }

  return score;
}

function pickBestDpe(records, asset) {
  const valid = records.filter(isValidDpeRecord);
  if (valid.length === 0) {
    return null;
  }

  return valid.sort((a, b) => scoreDpeRecord(b, asset) - scoreDpeRecord(a, asset))[0];
}

function shouldExcludeDpe(record) {
  if (!record) {
    return { exclude: false, reason: null };
  }

  const grade = String(record.classe_consommation_energie ?? '').trim().toUpperCase();
  if (config.dpe.excludeGrades.has(grade)) {
    return { exclude: true, reason: 'grade_abc' };
  }

  const year = extractYear(record.date_etablissement_dpe);
  const consumption = extractConsumptionKwhM2(record);

  if (
    year != null &&
    year > config.dpe.postYearThreshold &&
    consumption != null &&
    consumption <= config.dpe.lowConsumptionMax
  ) {
    return { exclude: true, reason: 'recent_low_consumption' };
  }

  return { exclude: false, reason: null };
}

async function queryDpe(params) {
  return api.dpe.getJson(config.apis.dpeTertiaire, {
    params: {
      size: 25,
      select: SELECT_FIELDS,
      ...params,
    },
    label: 'ADEME DPE tertiaire',
  });
}

async function searchByGeo(asset) {
  if (asset.longitude == null || asset.latitude == null) {
    return [];
  }

  const data = await queryDpe({
    geo_distance: `${asset.longitude}:${asset.latitude}:${config.dpe.geoRadiusM}`,
  });

  return (data.results ?? []).sort(
    (a, b) => (a._geo_distance ?? Infinity) - (b._geo_distance ?? Infinity),
  );
}

async function searchByCommune(asset) {
  const data = await queryDpe({
    code_insee_commune_actualise_eq: asset.code_commune,
  });

  return data.results ?? [];
}

async function searchByAddress(asset) {
  const query = [asset.adresse_uai, asset.libelle_commune, asset.code_postal_uai]
    .filter(Boolean)
    .join(' ');

  if (!query.trim()) {
    return [];
  }

  const data = await queryDpe({ q: query });
  return data.results ?? [];
}

async function fetchDpeCandidates(asset) {
  if (asset._importDpeRecord) {
    return { records: [asset._importDpeRecord], source: 'import' };
  }

  const byGeo = await searchByGeo(asset);
  if (byGeo.length > 0) {
    return { records: byGeo, source: 'gps' };
  }

  const byCommune = await searchByCommune(asset);
  const communeMatches = byCommune.filter(
    (record) => addressMatchesAsset(record, asset) || isPatrimoineSector(record),
  );
  if (communeMatches.length > 0) {
    return { records: communeMatches, source: 'commune' };
  }

  const byAddress = await searchByAddress(asset);
  if (byAddress.length > 0) {
    return { records: byAddress, source: 'adresse' };
  }

  return { records: [], source: 'none' };
}

export async function evaluateSchoolDpe(asset) {
  const cacheKey = `v3:${asset.numero_uai}:${asset.latitude?.toFixed(5)},${asset.longitude?.toFixed(5)}`;
  const cached = await readCache(CACHE_NS, cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const { records, source } = await fetchDpeCandidates(asset);
    const best = pickBestDpe(records, asset);
    const exclusion = shouldExcludeDpe(best);

    const result = {
      status: 'ok',
      source,
      dpe: buildDpePayload(best),
      shouldExclude: exclusion.exclude,
      excludeReason: exclusion.reason,
    };

    await writeCache(CACHE_NS, cacheKey, result, { ttlMs: 30 * 24 * 60 * 60 * 1000 });
    return result;
  } catch (error) {
    logger.warn(`DPE tertiaire indisponible pour ${asset.numero_uai} — fallback ${CONSO_FALLBACK_KWH_M2} kWh/m²/an`);
    const fallback = {
      status: 'ok',
      source: 'none',
      dpe: buildDpePayload(null),
      shouldExclude: false,
      excludeReason: null,
    };
    await writeCache(CACHE_NS, cacheKey, fallback, { ttlMs: 60 * 60 * 1000 });
    return fallback;
  }
}

export function isDpeDuplicate(checkpoint, numeroDpe) {
  if (!numeroDpe) {
    return false;
  }

  return checkpoint.results.some((row) => row._numero_dpe === numeroDpe);
}
