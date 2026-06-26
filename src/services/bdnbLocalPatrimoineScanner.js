import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { parseLambertWktPoint } from '../utils/lambert93.js';
import {
  assertUnzipAvailable,
  extractZipEntries,
  listZipEntries,
  pickBdnbCsvEntries,
  BDNB_PATRIMOINE_TABLE_KEYS,
} from '../utils/zipExtract.js';
import {
  deptHasRequiredCsv,
  findExactCsv,
  findGroupeCsv,
  streamCsvRows,
} from './bdnbLocalIndex.js';
import {
  detectPatrimoineCategory,
  evaluateEetSemanticFilter,
  evaluateLandOwnershipForAsset,
  evaluateLandOwnershipRecord,
  getAssetKey,
  passesEetSurfaceFilter,
  parseSurfaceM2,
} from './patrimoineFilter.js';
import { loadGroupPrimaryOwnersForDept } from './bdnbLandOwnershipService.js';

function parseBpeTypes(raw) {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(String(raw).replace(/""/g, '"'));
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch {
    return [String(raw)];
  }
}

/** Je normalise un enregistrement DPE tertiaire BDNB local vers le format ADEME attendu par dpeService. */
export function mapLocalDpeToAdemeRecord(record, adresse = '') {
  if (!record?.identifiant_dpe) {
    return null;
  }
  const dateRaw = String(record.date_etablissement_dpe ?? '').trim();
  const dateIso = dateRaw.includes('/')
    ? dateRaw.replace(/^(\d{4})\/(\d{2})\/(\d{2}).*/, '$1-$2-$3')
    : dateRaw;

  return {
    numero_dpe: record.identifiant_dpe,
    classe_consommation_energie: record.classe_conso_energie_dpe_tertiaire,
    consommation_energie: record.conso_dpe_tertiaire_ep_m2,
    date_etablissement_dpe: dateIso || dateRaw,
    surface_utile: record.surface_utile,
    secteur_activite: record.type_erp_dpe_tertiaire || record.categorie_erp_dpe_tertiaire || '',
    geo_adresse: adresse,
    est_efface: false,
  };
}

function collectPatrimoineLabels({ bpeTypes, adresseBan, adresseDpe, usageFfo }) {
  return [usageFfo, adresseBan, adresseDpe, ...bpeTypes].filter(Boolean);
}

function matchesPatrimoineLabels(labels) {
  const combined = labels.filter(Boolean).join(' ');
  return evaluateEetSemanticFilter({ nom: combined, adresse: combined }).pass;
}

async function loadManifest() {
  try {
    return JSON.parse(
      await fs.readFile(path.join(config.bdnb.localDir, 'manifest.json'), 'utf8'),
    );
  } catch {
    return { millesime: config.bdnb.millesime, departments: {} };
  }
}

/** Je vérifie si les CSV patrimoine (BPE, DPE tertiaire, adresses) sont extraits pour un département. */
export async function deptHasPatrimoineCsv(deptDir) {
  if (!(await deptHasRequiredCsv(deptDir))) {
    return false;
  }
  const bpe = await findExactCsv(deptDir, 'batiment_groupe_bpe.csv');
  const adresseGroupe = await findExactCsv(deptDir, 'batiment_groupe_adresse.csv');
  const relDpe = await findExactCsv(deptDir, 'rel_batiment_groupe_dpe_tertiaire.csv');
  return Boolean(bpe || adresseGroupe || relDpe);
}

/** J'extrais les tables patrimoine depuis le zip BDNB local si elles manquent encore. */
async function ensurePatrimoineCsvExtracted(departement) {
  const deptDir = path.join(config.bdnb.localDir, departement);
  if (await deptHasPatrimoineCsv(deptDir)) {
    return deptDir;
  }

  const manifest = await loadManifest();
  const entry = manifest.departments?.[departement];
  const zipPath =
    entry?.zipPath
    ?? path.join(config.bdnb.localDir, 'downloads', `${manifest.millesime ?? config.bdnb.millesime}_${departement}.zip`);

  try {
    await fs.access(zipPath);
  } catch {
    logger.warn(`Patrimoine BDNB — ${departement} : zip absent (${zipPath})`);
    return null;
  }

  await assertUnzipAvailable();
  const entries = await listZipEntries(zipPath);
  const picked = pickBdnbCsvEntries(entries);
  const toExtract = BDNB_PATRIMOINE_TABLE_KEYS.map((key) => picked[key]).filter(Boolean);

  if (toExtract.length === 0) {
    logger.warn(`Patrimoine BDNB — ${departement} : tables BPE/DPE absentes du zip`);
    return null;
  }

  logger.info(`Patrimoine BDNB — ${departement} : extraction ${toExtract.length} table(s) depuis le zip`);
  await fs.mkdir(deptDir, { recursive: true });
  await extractZipEntries(zipPath, toExtract, deptDir);
  return deptDir;
}

async function scanDepartmentPatrimoine(departement, inseeSet, communeByInsee) {
  const deptDir = await ensurePatrimoineCsvExtracted(departement);
  if (!deptDir || !(await deptHasPatrimoineCsv(deptDir))) {
    return [];
  }

  const groupeFile = await findGroupeCsv(deptDir);
  const ffoFile = await findExactCsv(deptDir, 'batiment_groupe_ffo_bat.csv');
  const bpeFile = await findExactCsv(deptDir, 'batiment_groupe_bpe.csv');
  const adresseGroupeFile = await findExactCsv(deptDir, 'batiment_groupe_adresse.csv');
  const relDpeFile = await findExactCsv(deptDir, 'rel_batiment_groupe_dpe_tertiaire.csv');
  const dpeFile = await findExactCsv(deptDir, 'dpe_tertiaire.csv');
  const adresseFile = await findExactCsv(deptDir, 'adresse.csv');
  const relRnbFile = await findExactCsv(deptDir, 'rel_batiment_construction_rnb.csv');
  const cstrFile = await findExactCsv(deptDir, 'batiment_construction.csv');

  if (!groupeFile || !ffoFile) {
    return [];
  }

  const groups = new Map();
  await streamCsvRows(groupeFile, (row) => {
    const insee = row.code_commune_insee;
    if (!inseeSet.has(insee)) {
      return;
    }
    const surface = Number(row.s_geom_groupe);
    groups.set(row.batiment_groupe_id, {
      groupId: row.batiment_groupe_id,
      codeInsee: insee,
      commune: row.libelle_commune_insee ?? communeByInsee.get(insee)?.nom ?? insee,
      surfaceM2: Number.isNaN(surface) ? null : surface,
      departement: row.code_departement_insee ?? departement,
    });
  });

  if (groups.size === 0) {
    return [];
  }

  const ffoByGroup = new Map();
  await streamCsvRows(ffoFile, (row) => {
    if (!groups.has(row.batiment_groupe_id)) {
      return;
    }
    ffoByGroup.set(row.batiment_groupe_id, {
      annee: Number(row.annee_construction) || null,
      usage: row.usage_niveau_1_txt ?? '',
    });
  });

  const bpeByGroup = new Map();
  if (bpeFile) {
    await streamCsvRows(bpeFile, (row) => {
      if (!groups.has(row.batiment_groupe_id)) {
        return;
      }
      bpeByGroup.set(row.batiment_groupe_id, parseBpeTypes(row.l_type_equipement));
    });
  }

  const adresseBanByGroup = new Map();
  const cleInteropByGroup = new Map();
  if (adresseGroupeFile) {
    await streamCsvRows(adresseGroupeFile, (row) => {
      if (!groups.has(row.batiment_groupe_id)) {
        return;
      }
      adresseBanByGroup.set(row.batiment_groupe_id, row.libelle_adr_principale_ban ?? '');
      if (row.cle_interop_adr_principale_ban) {
        cleInteropByGroup.set(row.batiment_groupe_id, row.cle_interop_adr_principale_ban);
      }
    });
  }

  const coordsByCle = new Map();
  if (adresseFile) {
    await streamCsvRows(adresseFile, (row) => {
      if (!row.cle_interop_adr) {
        return;
      }
      coordsByCle.set(row.cle_interop_adr, parseLambertWktPoint(row.wkt));
    });
  }

  const dpeById = new Map();
  if (dpeFile) {
    await streamCsvRows(dpeFile, (row) => {
      if (row.identifiant_dpe) {
        dpeById.set(row.identifiant_dpe, row);
      }
    });
  }

  const dpeLinkByGroup = new Map();
  if (relDpeFile) {
    await streamCsvRows(relDpeFile, (row) => {
      if (!groups.has(row.batiment_groupe_id)) {
        return;
      }
      dpeLinkByGroup.set(row.batiment_groupe_id, {
        dpeId: row.identifiant_dpe,
        adresseBrut: row.adresse_brut ?? '',
        adresseGeocodee: row.adresse_geocodee ?? '',
      });
    });
  }

  const cstrById = new Map();
  if (cstrFile) {
    await streamCsvRows(cstrFile, (row) => {
      cstrById.set(row.batiment_construction_id, row.batiment_groupe_id);
    });
  }

  const rnbByGroup = new Map();
  if (relRnbFile) {
    await streamCsvRows(relRnbFile, (row) => {
      const groupId = cstrById.get(row.batiment_construction_id);
      if (!groupId || !groups.has(groupId) || !row.rnb_id) {
        return;
      }
      if (!rnbByGroup.has(groupId)) {
        rnbByGroup.set(groupId, row.rnb_id);
      }
    });
  }

  const assets = [];
  const ownerIndex = await loadGroupPrimaryOwnersForDept(departement, new Set(groups.keys()));

  for (const [groupId, group] of groups) {
    const ffo = ffoByGroup.get(groupId) ?? {};
    const bpeTypes = bpeByGroup.get(groupId) ?? [];
    const adresseBan = adresseBanByGroup.get(groupId) ?? '';
    const dpeLink = dpeLinkByGroup.get(groupId);
    const adresseDpe = dpeLink?.adresseGeocodee || dpeLink?.adresseBrut || '';
    const labels = collectPatrimoineLabels({
      bpeTypes,
      adresseBan,
      adresseDpe,
      usageFfo: ffo.usage,
    });

    if (!matchesPatrimoineLabels(labels)) {
      continue;
    }

    const dpeRecord = dpeLink?.dpeId ? dpeById.get(dpeLink.dpeId) : null;
    const surfaceUtile = parseSurfaceM2(dpeRecord?.surface_utile);
    const surfaceM2 = parseSurfaceM2(group.surfaceM2) ?? surfaceUtile;
    if (surfaceM2 != null && !passesEetSurfaceFilter(surfaceM2)) {
      continue;
    }

    const bdnbLandOwner = ownerIndex?.get(groupId) ?? null;
    const landCheck = evaluateLandOwnershipRecord(bdnbLandOwner);
    if (!landCheck.pass) {
      continue;
    }

    const labelParts = [...bpeTypes, adresseBan, adresseDpe, ffo.usage].filter(Boolean);
    const nom = labelParts[0] ?? adresseBan ?? adresseDpe ?? `Bâtiment ${groupId}`;
    const typeLabel = labelParts.join(' · ');
    const cleInterop = cleInteropByGroup.get(groupId);
    const coords = cleInterop ? coordsByCle.get(cleInterop) : null;
    const importDpe = dpeRecord
      ? mapLocalDpeToAdemeRecord(dpeRecord, adresseDpe || adresseBan)
      : null;

    assets.push({
      assetId: `BDNB-${groupId}`,
      numero_uai: `BDNB-${groupId}`,
      source: 'bdnb-local',
      typePatrimoine: detectPatrimoineCategory(typeLabel, nom),
      appellation_officielle: nom,
      denomination_principale: typeLabel,
      libelle_commune: group.commune,
      code_commune: group.codeInsee,
      code_departement: group.departement,
      adresse_uai: adresseBan || adresseDpe,
      latitude: coords?.lat ?? null,
      longitude: coords?.lon ?? null,
      rnb: rnbByGroup.get(groupId) ?? null,
      bdnbGroupId: groupId,
      bdnbSurfaceM2: group.surfaceM2,
      bdnbAnneeConstruction: ffo.annee,
      dpeSurfaceUtile: surfaceUtile,
      bdnbLandOwner,
      _importDpeRecord: importDpe,
    });
  }

  return assets;
}

/**
 * Je scanne les exports CSV BDNB locaux pour identifier le patrimoine public territorial
 * (BPE, adresses, DPE tertiaire) sans appeler l'API ADEME.
 */
export async function scanBdnbLocalPatrimoine(inseeCodes, eligibleCommunes = []) {
  const inseeSet = new Set(inseeCodes);
  const communeByInsee = new Map(eligibleCommunes.map((c) => [c.code, c]));
  const deptList = [...new Set(
    [...inseeSet].map((insee) => {
      if (insee.startsWith('97')) {
        return insee.slice(0, 3);
      }
      return insee.slice(0, 2).padStart(3, '0');
    }),
  )];
  const assets = [];
  const seenKeys = new Set();

  for (const dept of deptList) {
    logger.info(`Patrimoine BDNB local — scan département ${dept}`);
    const deptAssets = await scanDepartmentPatrimoine(dept, inseeSet, communeByInsee);
    for (const asset of deptAssets) {
      const key = getAssetKey(asset);
      if (seenKeys.has(key)) {
        continue;
      }
      seenKeys.add(key);
      assets.push(asset);
    }
    logger.info(`Patrimoine BDNB local — ${dept} : ${deptAssets.length} bâtiment(s) patrimoniaux`);
  }

  return assets;
}

export async function bdnbLocalPatrimoineAvailable() {
  for (const dept of config.departments) {
    const deptDir = path.join(config.bdnb.localDir, dept);
    if (await deptHasPatrimoineCsv(deptDir)) {
      return true;
    }
    const manifest = await loadManifest();
    const zipPath =
      manifest.departments?.[dept]?.zipPath
      ?? path.join(config.bdnb.localDir, 'downloads', `${manifest.millesime ?? config.bdnb.millesime}_${dept}.zip`);
    try {
      await fs.access(zipPath);
      return true;
    } catch {
      // zip absent
    }
  }
  return false;
}
