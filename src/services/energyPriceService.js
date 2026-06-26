import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { logger } from '../utils/logger.js';

const SDES_PRICE_FIELDS = [
  'PX_ELE_I_IC',
  'PX_ELE_I_IB',
  'PX_ELE_I_TRANCHES_IA_IF',
  'PX_ELE_I_TTES_TRANCHES',
];

/** Majoration TURPE + CSPE + taxes d'acheminement (Tarif Jaune/Vert collectivités). */
const RESEAU_MAJORATION_COEFFICIENT = 1.2;
const PRIX_KWH_TTC_MIN = 0.18;
const PRIX_KWH_TTC_MAX = 0.26;

function parsePositiveNumber(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function convertSdesEurPer100kWhHtToKwhTtc(eurPer100kWhHt) {
  return (eurPer100kWhHt / 100) * (1 + config.cpe.tvaCollectivites);
}

function applyCollectiviteNetworkMarkup(prixCalculeTtc) {
  const prixFinalTtc = prixCalculeTtc * RESEAU_MAJORATION_COEFFICIENT;
  const inRange = prixFinalTtc >= PRIX_KWH_TTC_MIN && prixFinalTtc <= PRIX_KWH_TTC_MAX;

  return {
    prixCalculeTtc,
    prixFinalTtc: Math.round(prixFinalTtc * 10000) / 10000,
    inRange,
  };
}

function setFallbackPrice(fallback, reason) {
  config.cpe.prixKwhMoyenTertiaire = fallback;
  config.cpe.prixKwhSource = 'fallback';
  config.cpe.prixKwhPeriod = null;
  logger.warn(`${reason} — fallback de secours : ${fallback} €/kWh TTC`);
  return fallback;
}

function finalizeDynamicPrice({ prixCalculeTtc, source, period, field, details = '' }) {
  const { prixFinalTtc, inRange } = applyCollectiviteNetworkMarkup(prixCalculeTtc);

  if (!inRange) {
    return setFallbackPrice(
      config.cpe.prixKwhMoyenTertiaireFallback,
      `Prix kWh hors fourchette [${PRIX_KWH_TTC_MIN}–${PRIX_KWH_TTC_MAX}] après majoration réseau (+20 %) : ${prixFinalTtc} €/kWh TTC`,
    );
  }

  config.cpe.prixKwhMoyenTertiaire = prixFinalTtc;
  config.cpe.prixKwhSource = source;
  config.cpe.prixKwhPeriod = period;
  logger.success(
    `Prix kWh tertiaire (${source.toUpperCase()} ${period}${field ? `, ${field}` : ''}) : ${prixFinalTtc} €/kWh TTC ` +
      `(calculé ${Math.round(prixCalculeTtc * 10000) / 10000} × ${RESEAU_MAJORATION_COEFFICIENT} TURPE/CSPE${details ? ` — ${details}` : ''})`,
  );
  return prixFinalTtc;
}

function pickLatestPriceRow(rows) {
  const validRows = rows
    .map((row) => {
      for (const field of SDES_PRICE_FIELDS) {
        const value = parsePositiveNumber(row[field]);
        if (value != null) {
          return {
            period: row.PERIODE,
            field,
            eurPer100kWhHt: value,
          };
        }
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => String(b.period).localeCompare(String(a.period)));

  return validRows[0] ?? null;
}

async function fetchSdesTertiaryKwhPrice() {
  const { sdesDido, sdesIndustrialElectricityRid } = config.apis;

  const meta = await api.sdes.getJson(`${sdesDido}/v1/datafiles/${sdesIndustrialElectricityRid}`, {
    timeoutMs: 15000,
    label: 'SDES DiDo (métadonnées prix électricité)',
  });

  const millesime = meta.millesime;
  if (!millesime) {
    throw new Error('Millésime SDES introuvable');
  }

  const millesimeYear = Number(millesime.slice(0, 4));
  const filterYear = Math.max(2007, millesimeYear - 1);
  const rows = await api.sdes.getJson(`${sdesDido}/v1/datafiles/${sdesIndustrialElectricityRid}/json`, {
    params: {
      millesime,
      PERIODE: `gte:${filterYear}-01`,
    },
    timeoutMs: 20000,
    label: 'SDES DiDo (prix électricité industrielle)',
  });

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Aucune donnée de prix SDES retournée');
  }

  const latest = pickLatestPriceRow(rows);
  if (!latest) {
    throw new Error('Aucun prix kWh valide dans la réponse SDES');
  }

  const priceKwhTtc = convertSdesEurPer100kWhHtToKwhTtc(latest.eurPer100kWhHt);

  return {
    source: 'sdes',
    priceKwhTtc,
    period: latest.period,
    field: latest.field,
    eurPer100kWhHt: latest.eurPer100kWhHt,
    millesime,
  };
}

async function fetchEnedisTertiaryKwhPrice() {
  // Enedis Open Data ne publie pas de tarif kWh unitaire — tentative rapide puis abandon.
  await api.default.getJson('https://data.enedis.fr/api/explore/v2.1/catalog/datasets', {
    params: { limit: 1 },
    maxAttempts: 1,
    timeoutMs: 5000,
    label: 'Enedis Open Data',
  });

  return null;
}

export async function initPrixKwhMoyenTertiaire() {
  const fallback = config.cpe.prixKwhMoyenTertiaireFallback;

  try {
    const sdes = await fetchSdesTertiaryKwhPrice();
    return finalizeDynamicPrice({
      prixCalculeTtc: sdes.priceKwhTtc,
      source: 'sdes',
      period: sdes.period,
      field: sdes.field,
      details: `HT ${sdes.eurPer100kWhHt} €/100 kWh + TVA ${Math.round(config.cpe.tvaCollectivites * 100)} %`,
    });
  } catch (error) {
    logger.warn(`SDES indisponible pour le prix kWh — ${error.message}`);
  }

  try {
    const enedis = await fetchEnedisTertiaryKwhPrice();
    if (enedis) {
      return finalizeDynamicPrice({
        prixCalculeTtc: enedis.priceKwhTtc,
        source: 'enedis',
        period: enedis.period,
        field: enedis.field,
      });
    }
    logger.info('Enedis Open Data — pas de tarif kWh tertiaire unitaire disponible');
  } catch (error) {
    logger.warn(`Enedis indisponible pour le prix kWh — ${error.message ?? error}`);
  }

  return setFallbackPrice(
    fallback,
    'Prix kWh tertiaire — sources SDES/Enedis indisponibles',
  );
}
