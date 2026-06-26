import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { haversineKm } from '../utils/haversine.js';
import { logger } from '../utils/logger.js';
import {
  fetchTrancheEffectifEtablissement,
  isEligibleTrancheEffectif,
} from './sireneService.js';

function qualificationText(record) {
  return [
    record.nom_qualification,
    record.nom_certificat,
    record.domaine,
    record.meta_domaine,
  ]
    .filter(Boolean)
    .join(' ');
}

function hasTertiaryIndustrialQualification(record) {
  const text = qualificationText(record);
  const code = String(record.code_qualification ?? '').trim();
  const org = String(record.organisme ?? '').toLowerCase();

  if (/grandes installations/i.test(text)) {
    return true;
  }

  if (/qualifelec/i.test(org) && /tertiaire/i.test(text)) {
    return true;
  }

  const isQualibat511Or521Series = /^511/i.test(code) || /^521/i.test(code);
  if (isQualibat511Or521Series) {
    if (
      /tertiaire|supérieur à 1000|supérieur a 1000|grandes installations|collectif et tertiaire supérieur/i.test(
        text,
      )
    ) {
      return true;
    }
  }

  if (/tertiaire/i.test(text)) {
    if (
      /supérieur à 1000|supérieur a 1000|grandes installations|521[23]|523[13]|511[12]|certirenov|rénovation globale tertiaire|renovation globale tertiaire|offre globale de rénovation/i.test(
        text,
      )
    ) {
      return true;
    }
  }

  return false;
}

const TRANCHE_MIN_EMPLOYEES = {
  '00': 0,
  '01': 1,
  '02': 3,
  '03': 6,
  '11': 10,
  '12': 20,
  '21': 50,
  '22': 100,
  '31': 200,
  '32': 250,
  '41': 500,
  '42': 1000,
  '51': 2000,
  '52': 5000,
  '53': 10000,
};

const TRANCHE_LABELS = {
  '00': '0 salarié',
  '01': '1 à 2 salariés',
  '02': '3 à 5 salariés',
  '03': '6 à 9 salariés',
  '11': '10 à 19 salariés',
  '12': '20 à 49 salariés',
  '21': '50 à 99 salariés',
  '22': '100 à 199 salariés',
  '31': '200 à 249 salariés',
  '32': '250 à 499 salariés',
  '41': '500 à 999 salariés',
  '42': '1000 à 1999 salariés',
  '51': '2000 à 4999 salariés',
  '52': '5000 à 9999 salariés',
  '53': '10000 salariés et plus',
};

export function trancheToMinEmployees(tranche) {
  if (tranche == null || tranche === 'NN') {
    return 0;
  }
  const normalized = String(tranche).padStart(2, '0');
  if (TRANCHE_MIN_EMPLOYEES[normalized] != null) {
    return TRANCHE_MIN_EMPLOYEES[normalized];
  }
  const numeric = Number(tranche);
  return Number.isFinite(numeric) ? numeric : 0;
}

/** Libellé INSEE de la tranche d'effectif salarié (API SIRENE) */
export function formatTrancheEffectif(tranche) {
  if (tranche == null || tranche === '' || tranche === 'NN') {
    return { code: tranche ?? '', label: 'Non renseigné', min: 0 };
  }
  const normalized = String(tranche).padStart(2, '0');
  return {
    code: normalized,
    label: TRANCHE_LABELS[normalized] ?? `Tranche INSEE ${normalized}`,
    min: trancheToMinEmployees(tranche),
  };
}

function meetsCapacityRequirement(tranche, surfaceM2) {
  const minEmployees = trancheToMinEmployees(tranche);
  if (surfaceM2 > 5000 && minEmployees < 50) {
    return false;
  }
  if (surfaceM2 > 2000 && minEmployees < 20) {
    return false;
  }
  return true;
}

function computeSizeFitScore(minEmployees, surfaceM2) {
  if (surfaceM2 > 5000) {
    return Math.min(1, minEmployees / 100);
  }
  if (surfaceM2 > 2000) {
    return Math.min(1, minEmployees / 50);
  }
  const target = 25;
  return Math.max(0.35, 1 - Math.abs(minEmployees - target) / 60);
}

function computeArtisanMatchScore(distanceKm, tranche, surfaceM2) {
  const proximityScore = Math.max(0, 1 - distanceKm / config.artisanRayonKm);
  const sizeScore = computeSizeFitScore(trancheToMinEmployees(tranche), surfaceM2);
  return proximityScore * 0.55 + sizeScore * 0.45;
}

function formatArtisanMatch(artisan, distanceKm, score) {
  const effectif = formatTrancheEffectif(artisan.trancheEffectif);
  return {
    nom: artisan.nom_entreprise,
    email: artisan.email ?? '',
    distanceKm: Math.round(distanceKm * 10) / 10,
    trancheEffectif: effectif.code,
    effectifLabel: effectif.label,
    effectifMin: effectif.min,
    siret: artisan.siret,
    latitude: artisan.latitude,
    longitude: artisan.longitude,
    matchScore: Math.round(score * 1000) / 1000,
  };
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function mergeArtisanRecord(existing, incoming) {
  if (!existing) {
    return incoming;
  }

  return {
    ...existing,
    email: existing.email || incoming.email,
    qualifications: [...new Set([...(existing.qualifications ?? []), incoming.nom_qualification])],
  };
}

async function enrichAndFilterByEffectif(candidatesBySiret) {
  const eligible = [];
  let rejectedEffectif = 0;

  for (const artisan of candidatesBySiret.values()) {
    let tranche;
    try {
      tranche = await fetchTrancheEffectifEtablissement(artisan.siret);
    } catch (error) {
      logger.warn(`SIRENE indisponible pour ${artisan.siret} (${artisan.nom_entreprise})`);
      rejectedEffectif += 1;
      continue;
    }

    if (!isEligibleTrancheEffectif(tranche)) {
      rejectedEffectif += 1;
      continue;
    }

    eligible.push({
      ...artisan,
      trancheEffectif: tranche,
    });
  }

  logger.info(
    `${rejectedEffectif} entreprises écartées (TPE / effectif < ${config.minTrancheEffectif} ou non renseigné)`,
  );

  return eligible;
}

export async function loadArtisansIndex(postalCodes) {
  const uniquePostalCodes = [...new Set(postalCodes)].filter(Boolean);
  const chunks = chunkArray(uniquePostalCodes, 80);
  const candidatesBySiret = new Map();
  let rejectedQualification = 0;

  for (const chunk of chunks) {
    let nextUrl = `${config.apis.rge}?size=100&select=nom_entreprise,email,latitude,longitude,nom_qualification,nom_certificat,domaine,meta_domaine,organisme,code_qualification,siret,code_postal&code_postal_in=${chunk.join(',')}`;

    while (nextUrl) {
      const data = await api.ademe.getJson(nextUrl, { label: 'ADEME RGE' });
      const rows = data.results ?? [];

      for (const row of rows) {
        if (!hasTertiaryIndustrialQualification(row)) {
          rejectedQualification += 1;
          continue;
        }

        if (row.latitude == null || row.longitude == null || !row.siret) {
          continue;
        }

        const merged = mergeArtisanRecord(candidatesBySiret.get(row.siret), {
          ...row,
          qualifications: [row.nom_qualification],
        });
        candidatesBySiret.set(row.siret, merged);
      }

      nextUrl = data.next ?? null;
    }
  }

  logger.info(
    `${candidatesBySiret.size} entreprises avec qualification tertiaire / grandes installations avant filtre effectif`,
  );
  logger.info(`${rejectedQualification} lignes RGE écartées (qualification non tertiaire industrielle)`);

  const artisans = await enrichAndFilterByEffectif(candidatesBySiret);

  logger.success(
    `${artisans.length} artisans RGE éligibles indexés (≥${config.minTrancheEffectif} salariés, segment tertiaire / grandes installations)`,
  );

  return artisans;
}

export function findBestArtisan(school, artisans, surfaceM2) {
  const ranked = artisans
    .map((artisan) => ({
      artisan,
      distanceKm: haversineKm(
        school.latitude,
        school.longitude,
        artisan.latitude,
        artisan.longitude,
      ),
    }))
    .filter((candidate) => candidate.distanceKm <= config.artisanRayonKm)
    .filter((candidate) => meetsCapacityRequirement(candidate.artisan.trancheEffectif, surfaceM2))
    .map((candidate) => ({
      ...candidate,
      score: computeArtisanMatchScore(
        candidate.distanceKm,
        candidate.artisan.trancheEffectif,
        surfaceM2,
      ),
    }))
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);

  const match = ranked[0];
  if (!match) {
    return null;
  }

  return formatArtisanMatch(match.artisan, match.distanceKm, match.score);
}

export function findNearestArtisan(school, artisans, surfaceM2 = 0) {
  return findBestArtisan(school, artisans, surfaceM2);
}
