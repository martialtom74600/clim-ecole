import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

function resolveBlacklistPath() {
  const file = config.blacklistFile ?? 'data/blacklist.json';
  return path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
}

function normalizeId(id) {
  return String(id ?? '').trim();
}

let cache = { mtimeMs: -1, ids: new Set() };

function invalidateCache() {
  cache.mtimeMs = -1;
}

/** Cache synchrone — stat uniquement si mtime inchangé (safe hot-path pipeline). */
export function getBlacklistIds() {
  const filePath = resolveBlacklistPath();
  try {
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs === cache.mtimeMs) {
      return cache.ids;
    }
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const ids = new Set(
      (Array.isArray(raw?.ids) ? raw.ids : [])
        .map(normalizeId)
        .filter(Boolean),
    );
    cache = { mtimeMs: stat.mtimeMs, ids };
    return ids;
  } catch (error) {
    if (error.code === 'ENOENT') {
      cache = { mtimeMs: 0, ids: new Set() };
      return cache.ids;
    }
    throw error;
  }
}

export function resolveBlacklistIds(entry = {}) {
  const ids = new Set();
  const candidates = [
    entry.Code_UAI,
    entry.numero_uai,
    entry.id,
    entry.bdnbGroupId,
    entry.bdnb_group_id,
    entry.assetId,
  ];

  for (const value of candidates) {
    const id = normalizeId(value);
    if (!id) continue;
    ids.add(id);
    if (id.startsWith('BDNB-')) {
      ids.add(id.slice(5));
    }
  }

  return [...ids];
}

export function isBlacklistedEntry(entry) {
  const blacklist = getBlacklistIds();
  if (!blacklist.size) {
    return false;
  }

  for (const id of resolveBlacklistIds(entry)) {
    if (blacklist.has(id)) {
      return true;
    }
    if (id.startsWith('BDNB-') && blacklist.has(id.slice(5))) {
      return true;
    }
    if (blacklist.has(`BDNB-${id}`)) {
      return true;
    }
  }

  return false;
}

async function ensureBlacklistFile() {
  const filePath = resolveBlacklistPath();
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fsPromises.access(filePath);
  } catch {
    await fsPromises.writeFile(filePath, JSON.stringify({ ids: [] }, null, 2), 'utf8');
  }
}

/** Ajoute un ou plusieurs identifiants (UAI, batiment_groupe_id). Retourne les nouveaux IDs. */
export async function addToBlacklist(...rawIds) {
  const incoming = rawIds.flatMap((v) => (Array.isArray(v) ? v : [v])).map(normalizeId).filter(Boolean);
  if (!incoming.length) {
    throw new Error('Identifiant requis (UAI ou batiment_groupe_id)');
  }

  await ensureBlacklistFile();
  const filePath = resolveBlacklistPath();
  let data = { ids: [] };

  try {
    data = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const existing = new Set((Array.isArray(data.ids) ? data.ids : []).map(normalizeId).filter(Boolean));
  const added = [];

  for (const id of incoming) {
    if (!existing.has(id)) {
      existing.add(id);
      added.push(id);
    }
  }

  if (!added.length) {
    invalidateCache();
    return { added: [], total: existing.size };
  }

  const payload = { ids: [...existing].sort() };
  const temp = `${filePath}.tmp`;
  await fsPromises.writeFile(temp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await fsPromises.rename(temp, filePath);
  invalidateCache();

  return { added, total: existing.size };
}

export async function readBlacklistFile() {
  await ensureBlacklistFile();
  const raw = JSON.parse(await fsPromises.readFile(resolveBlacklistPath(), 'utf8'));
  return Array.isArray(raw?.ids) ? raw.ids : [];
}
