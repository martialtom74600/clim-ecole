import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import {
  assertUnzipAvailable,
  extractZipEntries,
  listZipEntries,
  pickBdnbCsvEntries,
} from '../utils/zipExtract.js';
import { findExactCsv, streamCsvRows } from './bdnbLocalIndex.js';
import { normalizeOwnerRecord } from './patrimoineFilter.js';

const deptOwnerIndexes = new Map();

async function loadManifest() {
  try {
    return JSON.parse(
      await fs.readFile(path.join(config.bdnb.localDir, 'manifest.json'), 'utf8'),
    );
  } catch {
    return { millesime: config.bdnb.millesime, departments: {} };
  }
}

async function ensureLandCsvExtracted(departement) {
  const deptDir = path.join(config.bdnb.localDir, departement);
  const relFile = await findExactCsv(deptDir, 'rel_batiment_groupe_proprietaire.csv');
  const propFile = await findExactCsv(deptDir, 'proprietaire.csv');
  if (relFile && propFile) {
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
    return null;
  }

  await assertUnzipAvailable();
  const entries = await listZipEntries(zipPath);
  const picked = pickBdnbCsvEntries(entries);
  const toExtract = [picked.proprietaire, picked.relProprietaire].filter(Boolean);
  if (toExtract.length === 0) {
    return null;
  }

  logger.info(`FFO propriétaire BDNB — ${departement} : extraction ${toExtract.length} table(s)`);
  await fs.mkdir(deptDir, { recursive: true });
  await extractZipEntries(zipPath, toExtract, deptDir);
  return deptDir;
}

async function buildFullDeptOwnerIndex(departement) {
  const deptDir = await ensureLandCsvExtracted(departement);
  if (!deptDir) {
    return null;
  }

  const relFile = await findExactCsv(deptDir, 'rel_batiment_groupe_proprietaire.csv');
  const propFile = await findExactCsv(deptDir, 'proprietaire.csv');
  if (!relFile || !propFile) {
    return null;
  }

  const primaryByGroup = new Map();
  await streamCsvRows(relFile, (row) => {
    const groupId = row.batiment_groupe_id;
    if (!groupId) {
      return;
    }
    const nbLocaux = Number(row.nb_locaux_open) || 0;
    const existing = primaryByGroup.get(groupId);
    if (!existing || nbLocaux > existing.nbLocaux) {
      primaryByGroup.set(groupId, {
        personneId: row.personne_id,
        nbLocaux,
        dansMajicPm: row.dans_majic_pm === '1' || row.dans_majic_pm === true,
      });
    }
  });

  const neededPersonneIds = new Set(
    [...primaryByGroup.values()].map((entry) => entry.personneId).filter(Boolean),
  );
  const ownersById = new Map();

  await streamCsvRows(propFile, (row) => {
    if (neededPersonneIds.size > 0 && !neededPersonneIds.has(row.personne_id)) {
      return;
    }
    ownersById.set(row.personne_id, normalizeOwnerRecord(row));
  });

  const index = new Map();
  for (const [groupId, link] of primaryByGroup) {
    const owner = ownersById.get(link.personneId);
    if (owner) {
      index.set(groupId, {
        ...owner,
        nbLocauxOpen: link.nbLocaux,
        dansMajicPm: link.dansMajicPm,
      });
    }
  }

  return index;
}

/**
 * Je charge l'index propriétaire principal par batiment_groupe_id (FFO / MAJIC open BDNB).
 * @param {Set<string>|null} groupIdFilter — limite aux groupes cibles (perf scan patrimoine)
 */
export async function loadGroupPrimaryOwnersForDept(departement, groupIdFilter = null) {
  const fullKey = `${departement}:full`;
  if (!deptOwnerIndexes.has(fullKey)) {
    deptOwnerIndexes.set(fullKey, await buildFullDeptOwnerIndex(departement));
  }

  const fullIndex = deptOwnerIndexes.get(fullKey);
  if (!fullIndex) {
    return null;
  }
  if (!groupIdFilter) {
    return fullIndex;
  }

  const filtered = new Map();
  for (const groupId of groupIdFilter) {
    const owner = fullIndex.get(groupId);
    if (owner) {
      filtered.set(groupId, owner);
    }
  }
  return filtered;
}

export async function resolveGroupLandOwnership(groupId, departementHint = null) {
  if (!groupId) {
    return null;
  }

  const deptCandidates = departementHint
    ? [String(departementHint).padStart(3, '0')]
    : config.departments;

  for (const dept of deptCandidates) {
    const index = await loadGroupPrimaryOwnersForDept(dept);
    const owner = index?.get(groupId);
    if (owner) {
      return owner;
    }
  }

  return null;
}

export function clearLandOwnershipCache() {
  deptOwnerIndexes.clear();
}
