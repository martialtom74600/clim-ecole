import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { logger } from './logger.js';
import { isExportableEetRow, purgeInvalidEetCheckpointResults } from '../services/patrimoineFilter.js';

const CHECKPOINT_VERSION = 1;

async function ensureCacheDir() {
  await fs.mkdir(config.cacheDir, { recursive: true });
}

function checkpointFilePath() {
  return path.join(config.cacheDir, 'checkpoint.json');
}

function defaultCheckpoint(departments) {
  return {
    version: CHECKPOINT_VERSION,
    departments,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schools: {},
    results: [],
    stats: {},
  };
}

export function syncCheckpointStats(checkpoint) {
  const states = Object.values(checkpoint.schools ?? {});
  const maxRetries = checkpoint.maxApiRetryPasses ?? 4;
  const exportedFromStates = states.filter((s) => s.outcome === 'exported').length;
  const exportedFromResults = Array.isArray(checkpoint.results) ? checkpoint.results.length : 0;
  const exported =
    exportedFromResults > 0 && exportedFromResults < exportedFromStates
      ? exportedFromResults
      : exportedFromStates;

  checkpoint.stats = {
    totalSchools: checkpoint.totalSchools ?? 0,
    processed: states.length,
    exported,
    filtered: states.filter((s) => s.outcome === 'filtered' || s.outcome === 'no_rnb').length,
    filteredDpe: states.filter((s) => s.outcome === 'filtered_dpe').length,
    dpeDuplicate: states.filter((s) => s.outcome === 'dpe_duplicate').length,
    noArtisan: states.filter((s) => s.outcome === 'no_artisan').length,
    unresolvedApi: states.filter(
      (s) =>
        (s.outcome === 'api_error' || s.outcome === 'error') &&
        (s.retries ?? 0) >= maxRetries,
    ).length,
    pendingRetry: states.filter(
      (s) =>
        (s.outcome === 'api_error' || s.outcome === 'error') &&
        (s.retries ?? 0) < maxRetries,
    ).length,
  };
}

export async function loadCheckpoint(departments) {
  await ensureCacheDir();

  try {
    const raw = await fs.readFile(checkpointFilePath(), 'utf8');
    const checkpoint = JSON.parse(raw);

    if (checkpoint.version !== CHECKPOINT_VERSION) {
      logger.warn('Checkpoint incompatible — nouveau run');
      return defaultCheckpoint(departments);
    }

    if (checkpoint.departments.join(',') !== departments.join(',')) {
      logger.warn('Départements différents — nouveau run (ancien checkpoint ignoré)');
      return defaultCheckpoint(departments);
    }

    purgeInvalidEetCheckpointResults(checkpoint);

    logger.info(
      `Checkpoint restauré : ${Object.keys(checkpoint.schools).length} écoles déjà traitées, ${checkpoint.results.length} lignes CSV`,
    );
    return checkpoint;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultCheckpoint(departments);
    }
    throw error;
  }
}

export async function saveCheckpoint(checkpoint) {
  await ensureCacheDir();
  purgeInvalidEetCheckpointResults(checkpoint, { log: false });
  syncCheckpointStats(checkpoint);
  checkpoint.updatedAt = new Date().toISOString();

  const target = checkpointFilePath();
  const temp = `${target}.tmp`;
  await fs.writeFile(temp, JSON.stringify(checkpoint, null, 2), 'utf8');
  await fs.rename(temp, target);
}

export function getSchoolState(checkpoint, uai) {
  return checkpoint.schools[uai] ?? null;
}

export function recordSchoolOutcome(checkpoint, uai, state) {
  checkpoint.schools[uai] = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * J'ajoute une ligne au checkpoint — refusée si elle ne passe pas la gate EET export.
 * @returns {boolean} true si la ligne a été ajoutée
 */
export function appendResult(checkpoint, row) {
  if (!isExportableEetRow(row)) {
    return false;
  }

  const exists = checkpoint.results.some((entry) => entry.Code_UAI === row.Code_UAI);
  if (!exists) {
    checkpoint.results.push(row);
  }
  return true;
}

export async function clearCheckpoint() {
  try {
    await fs.unlink(checkpointFilePath());
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}
