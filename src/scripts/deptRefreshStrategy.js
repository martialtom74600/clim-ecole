/**
 * Stratégie refresh delta — 3 niveaux : light | medium | full | skip_empty
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function daysSince(isoDate) {
  if (!isoDate) return Infinity;
  return (Date.now() - Date.parse(isoDate)) / 86_400_000;
}

function checkpointPath() {
  return path.join(root, process.env.CACHE_DIR ?? '.cache', 'checkpoint.json');
}

async function hasCheckpointForDept(deptCode) {
  try {
    const raw = JSON.parse(await fs.readFile(checkpointPath(), 'utf8'));
    const depts = raw.departments ?? [];
    return depts.includes(deptCode) && (raw.results?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * @returns {'full'|'medium'|'light'|'skip_empty'}
 */
export async function resolveRefreshMode(dept, { job, csvValidation, rotation }) {
  const lightDays = Number(rotation.refreshLightDays ?? 30);
  const fullDays = Number(rotation.refreshFullDays ?? 60);
  const emptySkipDays = Number(rotation.emptyDeptSkipDays ?? 90);

  if (job?.status === 'empty' && job?.last_sync_at) {
    if (daysSince(job.last_sync_at) < emptySkipDays) {
      return { mode: 'skip_empty', reason: `dept vide — skip ${emptySkipDays}j` };
    }
  }

  if (!csvValidation.ok || csvValidation.missing) {
    return { mode: 'full', reason: 'CSV absent' };
  }

  if (csvValidation.empty) {
    return { mode: 'full', reason: 'CSV vide' };
  }

  if (!job?.last_sync_at || job.status === 'pending') {
    return { mode: 'full', reason: 'jamais synchronisé' };
  }

  const ageDays = daysSince(job.last_sync_at);

  if (ageDays >= fullDays) {
    return { mode: 'full', reason: `>${fullDays}j depuis sync` };
  }

  if (ageDays < lightDays) {
    return { mode: 'light', reason: `<${lightDays}j — sync Supabase` };
  }

  const hasCheckpoint = await hasCheckpointForDept(dept.code);
  if (hasCheckpoint) {
    return { mode: 'medium', reason: 'recalcul économies (checkpoint)' };
  }

  return { mode: 'light', reason: 'pas de checkpoint — sync seule' };
}

export function syncOnlyMinutes() {
  return Number(process.env.NIGHTLY_SYNC_ESTIMATE_MINUTES ?? 3);
}

export function skipEmptyMinutes() {
  return 0.1;
}

export function mediumRefreshMinutes() {
  return Number(process.env.NIGHTLY_MEDIUM_ESTIMATE_MINUTES ?? 8);
}
