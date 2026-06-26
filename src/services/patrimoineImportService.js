import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { logger } from '../utils/logger.js';
import { fetchPrimarySchools } from './schoolsService.js';
import {
  scanBdnbLocalPatrimoine,
  bdnbLocalPatrimoineAvailable,
} from './bdnbLocalPatrimoineScanner.js';
import {
  detectPatrimoineCategory,
  evaluateEetAssetFilter,
  evaluateEetSemanticFilter,
  getAssetKey,
} from './patrimoineFilter.js';

const DPE_PAGE_SIZE = 100;
const DPE_SELECT = [
  'numero_dpe',
  'classe_consommation_energie',
  'consommation_energie',
  'date_etablissement_dpe',
  '_geopoint',
  'secteur_activite',
  'surface_utile',
  'geo_adresse',
  'est_efface',
  'code_insee_commune_actualise',
].join(',');

function parseGeopoint(geopoint) {
  if (!geopoint) {
    return { lat: null, lon: null };
  }
  if (typeof geopoint === 'object' && geopoint.lat != null) {
    return { lat: geopoint.lat, lon: geopoint.lon ?? geopoint.lng ?? null };
  }
  const parts = String(geopoint).split(',').map((v) => Number(v.trim()));
  if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return { lat: parts[0], lon: parts[1] };
  }
  return { lat: null, lon: null };
}

function isValidDpeImportRecord(record) {
  if (record.est_efface === true) {
    return false;
  }
  const grade = String(record.classe_consommation_energie ?? '').trim().toUpperCase();
  if (!grade || grade === 'N' || grade === '\\N') {
    return false;
  }
  return evaluateEetSemanticFilter({
    secteurActivite: record.secteur_activite,
    adresse: record.geo_adresse,
  }).pass;
}

async function queryDpeLines(params) {
  return api.dpe.getJson(config.apis.dpeTertiaire, {
    params: {
      size: DPE_PAGE_SIZE,
      select: DPE_SELECT,
      ...params,
    },
    label: 'ADEME DPE tertiaire (patrimoine)',
  });
}

/** Fallback API ADEME — uniquement si PATRIMOINE_IMPORT_DPE=1 et CSV BDNB indisponibles. */
async function fetchPatrimoineDpeForCommune(insee, communeLabel) {
  const assets = [];
  const seenDpe = new Set();
  let offset = 0;
  let total = null;

  while (true) {
    const data = await queryDpeLines({
      code_insee_commune_actualise_eq: insee,
      from: offset,
    });

    total ??= data.total ?? data.total_count ?? null;
    const rows = data.results ?? [];

    for (const record of rows) {
      if (!isValidDpeImportRecord(record)) {
        continue;
      }
      if (seenDpe.has(record.numero_dpe)) {
        continue;
      }
      seenDpe.add(record.numero_dpe);

      const { lat, lon } = parseGeopoint(record._geopoint);
      const label = record.geo_adresse || record.secteur_activite || 'Bâtiment tertiaire';
      const assetId = `PAT-${record.numero_dpe}`;

      assets.push({
        assetId,
        numero_uai: assetId,
        source: 'dpe-tertiaire',
        typePatrimoine: detectPatrimoineCategory(record.secteur_activite, record.geo_adresse, label),
        appellation_officielle: label,
        denomination_principale: record.secteur_activite ?? label,
        libelle_commune: communeLabel,
        code_commune: insee,
        code_departement: insee.slice(0, 2) === '97' ? insee.slice(0, 3) : insee.slice(0, 2),
        adresse_uai: record.geo_adresse ?? '',
        latitude: lat,
        longitude: lon,
        rnb: null,
        dpeSurfaceUtile: Number(record.surface_utile) || null,
        _importDpeRecord: record,
      });
    }

    offset += rows.length;
    if (rows.length < DPE_PAGE_SIZE) {
      break;
    }
    if (total != null && offset >= total) {
      break;
    }
  }

  return assets;
}

function mapSchoolToAsset(school) {
  const nom = school.appellation_officielle ?? school.denomination_principale ?? '';
  const eetCheck = evaluateEetAssetFilter({
    appellation_officielle: nom,
    denomination_principale: school.denomination_principale,
    adresse_uai: school.adresse_uai,
  });
  if (!eetCheck.pass) {
    return null;
  }
  return {
    assetId: school.numero_uai,
    numero_uai: school.numero_uai,
    source: 'education',
    typePatrimoine: detectPatrimoineCategory(nom, school.adresse_uai),
    appellation_officielle: nom,
    denomination_principale: school.denomination_principale ?? nom,
    libelle_commune: school.libelle_commune,
    code_commune: school.code_commune,
    code_departement: school.code_departement ?? school.code_commune?.slice(0, 2),
    adresse_uai: school.adresse_uai ?? '',
    latitude: school.latitude,
    longitude: school.longitude,
    rnb: school.rnb,
    dpeSurfaceUtile: null,
  };
}

function registerAsset(assets, seenKeys, seenRnb, asset) {
  const key = getAssetKey(asset);
  if (seenKeys.has(key)) {
    return false;
  }
  if (asset.rnb && seenRnb.has(asset.rnb)) {
    return false;
  }
  seenKeys.add(key);
  if (asset.rnb) {
    seenRnb.add(asset.rnb);
  }
  assets.push(asset);
  return true;
}

/**
 * J'importe le patrimoine public cible :
 * - Écoles via Education nationale
 * - Mairies, gymnases, salles des fêtes, etc. via exports CSV BDNB locaux (BPE + DPE tertiaire + adresses)
 */
export async function fetchPatrimoineAssets(inseeCodes, eligibleCommunes = []) {
  const communeByInsee = new Map(eligibleCommunes.map((c) => [c.code, c]));
  const schools = await fetchPrimarySchools(inseeCodes);

  const assets = [];
  const seenKeys = new Set();
  const seenRnb = new Set();

  for (const school of schools) {
    const asset = mapSchoolToAsset(school);
    if (!asset) {
      continue;
    }
    registerAsset(assets, seenKeys, seenRnb, asset);
  }

  const educationCount = assets.length;
  logger.info(`Patrimoine — ${educationCount} bâtiment(s) issus de l'Education nationale`);

  const localAvailable = await bdnbLocalPatrimoineAvailable();
  if (localAvailable) {
    const localAssets = await scanBdnbLocalPatrimoine(inseeCodes, eligibleCommunes);
    let added = 0;
    for (const asset of localAssets) {
      if (registerAsset(assets, seenKeys, seenRnb, asset)) {
        added += 1;
      }
    }
    logger.success(
      `Patrimoine BDNB local — ${added} bâtiment(s) ajouté(s) (${localAssets.length} candidats scannés dans les CSV)`,
    );
  } else if (config.patrimoineImportDpe) {
    logger.warn('CSV BDNB patrimoine absents — repli API ADEME DPE tertiaire (PATRIMOINE_IMPORT_DPE=1)');
    const inseeList = [...inseeCodes];
    for (let i = 0; i < inseeList.length; i += 1) {
      const insee = inseeList[i];
      const communeLabel = communeByInsee.get(insee)?.nom ?? insee;
      logger.info(`Patrimoine DPE tertiaire — commune ${communeLabel} (${i + 1}/${inseeList.length})`);
      const dpeAssets = await fetchPatrimoineDpeForCommune(insee, communeLabel);
      for (const asset of dpeAssets) {
        registerAsset(assets, seenKeys, seenRnb, asset);
      }
    }
  } else {
    logger.warn(
      'Patrimoine non-éducatif ignoré — lancez npm run bdnb:reextract pour extraire BPE/DPE depuis vos zip BDNB',
    );
  }

  const bdnbCount = assets.filter((a) => a.source === 'bdnb-local').length;
  const dpeCount = assets.filter((a) => a.source === 'dpe-tertiaire').length;
  logger.success(
    `${assets.length} bâtiment(s) patrimoniaux importés (${educationCount} Education · ${bdnbCount} BDNB local · ${dpeCount} DPE API)`,
  );

  if (config.maxSchools > 0 && assets.length > config.maxSchools) {
    assets.splice(config.maxSchools);
    logger.warn(`Limite MAX_SCHOOLS=${config.maxSchools} — patrimoine tronqué`);
  }

  return assets;
}
