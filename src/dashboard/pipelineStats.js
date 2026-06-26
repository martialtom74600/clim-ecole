import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { syncCheckpointStats } from '../utils/checkpoint.js';

const RUNNING_THRESHOLD_MS = 120_000;

function checkpointPath() {
  return path.join(config.cacheDir, 'checkpoint.json');
}

function lockPath() {
  return path.join(config.cacheDir, 'pipeline.lock');
}

export async function loadPipelineStats() {
  let checkpoint = null;
  let lock = null;

  try {
    checkpoint = JSON.parse(await fs.readFile(checkpointPath(), 'utf8'));
    syncCheckpointStats(checkpoint);
  } catch {
    return null;
  }

  try {
    lock = JSON.parse(await fs.readFile(lockPath(), 'utf8'));
  } catch {
    /* pas de lock */
  }

  const stats = checkpoint.stats ?? {};
  const total = stats.totalSchools ?? checkpoint.totalSchools ?? 0;
  const processed = stats.processed ?? 0;
  const resultsInCheckpoint = checkpoint.results?.length ?? 0;
  const updatedAt = checkpoint.updatedAt ?? null;
  const ageMs = updatedAt ? Date.now() - new Date(updatedAt).getTime() : Infinity;
  const incomplete = total > 0 && processed < total;
  const isRunning = Boolean(lock?.pid) || (incomplete && ageMs < RUNNING_THRESHOLD_MS);
  const exported = isRunning
    ? (stats.exported ?? 0)
    : (resultsInCheckpoint || stats.exported || 0);

  return {
    isRunning,
    lock,
    totalSchools: total,
    processed,
    exported,
    filtered: stats.filtered ?? 0,
    filteredDpe: stats.filteredDpe ?? 0,
    dpeDuplicate: stats.dpeDuplicate ?? 0,
    noArtisan: stats.noArtisan ?? 0,
    unresolvedApi: stats.unresolvedApi ?? 0,
    pendingRetry: stats.pendingRetry ?? 0,
    resultsInCheckpoint,
    progressPct: total > 0 ? Math.round((processed / total) * 100) : 0,
    updatedAt,
    startedAt: checkpoint.startedAt ?? null,
    departments: checkpoint.departments ?? config.departments,
  };
}

export async function writePipelineLock() {
  await fs.mkdir(config.cacheDir, { recursive: true });
  await fs.writeFile(
    lockPath(),
    JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }),
  );
}

export async function clearPipelineLock() {
  try {
    await fs.unlink(lockPath());
  } catch {
    /* absent */
  }
}
