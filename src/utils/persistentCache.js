import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

function cachePath(namespace, key) {
  const hash = crypto.createHash('sha256').update(`${namespace}:${key}`).digest('hex');
  return path.join(config.cacheDir, namespace, `${hash}.json`);
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function readCache(namespace, key) {
  try {
    const raw = await fs.readFile(cachePath(namespace, key), 'utf8');
    const entry = JSON.parse(raw);

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      return undefined;
    }

    return entry.value;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

export async function writeCache(namespace, key, value, { ttlMs } = {}) {
  const file = cachePath(namespace, key);
  await ensureDir(file);

  const entry = {
    value,
    cachedAt: new Date().toISOString(),
    expiresAt: ttlMs ? Date.now() + ttlMs : null,
  };

  await fs.writeFile(file, JSON.stringify(entry, null, 2), 'utf8');
}

export async function hasCache(namespace, key) {
  const value = await readCache(namespace, key);
  return value !== undefined;
}

export async function clearPersistentCache({ preserveDirs = [] } = {}) {
  const preserve = new Set(
    preserveDirs.map((dir) => path.resolve(dir)),
  );

  let entries;
  try {
    entries = await fs.readdir(config.cacheDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(config.cacheDir, { recursive: true });
      return;
    }
    throw error;
  }

  for (const entry of entries) {
    const full = path.resolve(path.join(config.cacheDir, entry.name));
    if (preserve.has(full)) {
      continue;
    }
    await fs.rm(full, { recursive: true, force: true });
  }

  await fs.mkdir(config.cacheDir, { recursive: true });
}
