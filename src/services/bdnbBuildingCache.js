import { readCache, writeCache } from '../utils/persistentCache.js';

export const BDNB_BUILDING_CACHE_NS = 'bdnb-building';
const NEGATIVE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const memoryCache = new Map();

export async function getCachedBuilding(rnbId) {
  if (memoryCache.has(rnbId)) {
    return memoryCache.get(rnbId);
  }

  const cached = await readCache(BDNB_BUILDING_CACHE_NS, rnbId);
  if (cached !== undefined) {
    memoryCache.set(rnbId, cached);
    return cached;
  }

  return undefined;
}

export async function setCachedBuilding(rnbId, value) {
  memoryCache.set(rnbId, value);
  const ttlMs = value == null ? NEGATIVE_CACHE_TTL_MS : undefined;
  await writeCache(BDNB_BUILDING_CACHE_NS, rnbId, value, ttlMs ? { ttlMs } : {});
}

export function primeCachedBuilding(rnbId, value) {
  memoryCache.set(rnbId, value);
}

export async function filterUncachedRnbIds(rnbIds) {
  const uncached = [];
  for (const rnbId of rnbIds) {
    if ((await getCachedBuilding(rnbId)) === undefined) {
      uncached.push(rnbId);
    }
  }
  return uncached;
}
