import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

/** Index RNB → { groupId, anneeConstruction, surfaceM2 } chargé depuis export CSV local */
const deptIndexes = new Map();
let loadAttempted = false;

function indexPath(departement) {
  return path.join(config.bdnb.localDir, `index-${departement}.json`);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadDeptIndex(departement) {
  if (deptIndexes.has(departement)) {
    return deptIndexes.get(departement);
  }

  const file = indexPath(departement);
  if (!(await fileExists(file))) {
    deptIndexes.set(departement, null);
    return null;
  }

  const raw = await fs.readFile(file, 'utf8');
  const data = JSON.parse(raw);
  const map = new Map(Object.entries(data));
  deptIndexes.set(departement, map);
  return map;
}

export async function initBdnbLocalStore(departements = config.departments) {
  if (!config.bdnb.preferLocal || loadAttempted) {
    return { loadedDepts: [], totalEntries: 0 };
  }

  loadAttempted = true;
  const loadedDepts = [];
  let totalEntries = 0;

  for (const dept of departements) {
    const map = await loadDeptIndex(dept);
    if (map?.size) {
      loadedDepts.push(dept);
      totalEntries += map.size;
    }
  }

  if (loadedDepts.length > 0) {
    logger.info(
      `BDNB local : ${totalEntries} RNB indexés (${loadedDepts.length} dépt.) — ${config.bdnb.localDir}`,
    );
  }

  return { loadedDepts, totalEntries };
}

export async function lookupBdnbLocal(rnbId, departementHint = null) {
  if (!config.bdnb.preferLocal) {
    return undefined;
  }

  const depts = departementHint
    ? [departementHint]
    : config.departments;

  for (const dept of depts) {
    const map = await loadDeptIndex(dept);
    if (!map) {
      continue;
    }
    const hit = map.get(rnbId);
    if (hit !== undefined) {
      return hit === null ? null : { rnbId, ...hit };
    }
  }

  return undefined;
}

export function getBdnbLocalDir() {
  return config.bdnb.localDir;
}
