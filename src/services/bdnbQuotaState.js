import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

export let bdnbQuotaBlocked = false;

const QUOTA_FLAG_FILE = path.join(config.cacheDir, 'bdnb-quota-blocked.json');

async function persistQuotaBlock() {
  try {
    await fs.mkdir(config.cacheDir, { recursive: true });
    await fs.writeFile(
      QUOTA_FLAG_FILE,
      JSON.stringify({ blocked: true, at: new Date().toISOString() }),
    );
  } catch {
    /* non bloquant */
  }
}

async function clearQuotaFlagFile() {
  try {
    await fs.unlink(QUOTA_FLAG_FILE);
  } catch {
    /* absent */
  }
}

export async function loadBdnbQuotaState() {
  try {
    const raw = await fs.readFile(QUOTA_FLAG_FILE, 'utf8');
    const data = JSON.parse(raw);
    bdnbQuotaBlocked = Boolean(data.blocked);
  } catch {
    bdnbQuotaBlocked = false;
  }
  return bdnbQuotaBlocked;
}

export function blockBdnbQuota() {
  if (!bdnbQuotaBlocked) {
    bdnbQuotaBlocked = true;
    persistQuotaBlock().catch(() => {});
  }
}

export function resetBdnbQuotaBlock() {
  bdnbQuotaBlocked = false;
  clearQuotaFlagFile().catch(() => {});
}

export function isBdnbQuotaBlocked() {
  return bdnbQuotaBlocked;
}

export function getBdnbQuotaSnapshot() {
  return { blocked: bdnbQuotaBlocked };
}
