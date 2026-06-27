/**
 * Cache persistant par département — geo, écoles (TTL long, survit aux RESET_CHECKPOINT).
 */
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export function deptSnapshotDir() {
  return path.join(config.cacheDir, 'dept-snapshots');
}

function snapshotPath(type, deptKey) {
  const safe = String(deptKey).replace(/[^\w-]/gi, '');
  return path.join(deptSnapshotDir(), `${type}-${safe}.json`);
}

function ttlMs(days) {
  const d = Number(days);
  return (Number.isFinite(d) && d > 0 ? d : 90) * 86_400_000;
}

export function isDeptCacheEnabled() {
  return config.deptCache?.enabled !== false;
}

export async function readDeptSnapshot(type, deptKey) {
  if (!isDeptCacheEnabled()) return null;
  try {
    const raw = JSON.parse(await fs.readFile(snapshotPath(type, deptKey), 'utf8'));
    if (raw.expiresAt && Date.now() > Date.parse(raw.expiresAt)) {
      return null;
    }
    return raw.data ?? null;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeDeptSnapshot(type, deptKey, data, ttlDays) {
  if (!isDeptCacheEnabled()) return;
  const file = snapshotPath(type, deptKey);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const now = Date.now();
  const payload = {
    type,
    dept: deptKey,
    cachedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs(ttlDays)).toISOString(),
    rowCount: Array.isArray(data) ? data.length : null,
    data,
  };
  await fs.writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

export async function logCacheHit(type, deptKey, rowCount) {
  logger.info(`[cache] ${type} ${deptKey} — ${rowCount} ligne(s) (disque, pas d'API)`);
}
