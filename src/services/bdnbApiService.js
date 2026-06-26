import { config } from '../config.js';
import { getBdnbJson } from '../utils/apiClients.js';
import { parseBdnbQuotaFromError } from '../utils/httpClient.js';
import { logger } from '../utils/logger.js';
import { parseRnbField } from '../utils/parseRnb.js';
import { BdnbQuotaExhaustedError } from '../errors/bdnbQuotaError.js';
import { bdnbQuotaBlocked, blockBdnbQuota } from './bdnbQuotaState.js';
import {
  filterUncachedRnbIds,
  getCachedBuilding,
  setCachedBuilding,
} from './bdnbBuildingCache.js';
import { initBdnbLocalStore, lookupBdnbLocal } from './bdnbLocalStore.js';

let embedSupported = config.bdnb.singleRequestEmbed !== false;
let batchEmbedSupported = config.bdnb.batchPrefetch && config.bdnb.singleRequestEmbed !== false;
const EMBED_SELECT =
  'rnb_id,batiment_groupe_id,'
  + 'batiment_groupe(s_geom_groupe,batiment_groupe_ffo_bat(annee_construction))';

function firstRow(rows) {
  return Array.isArray(rows) ? rows[0] : null;
}

function parseEmbeddedFfo(ffoNode) {
  if (ffoNode == null) {
    return null;
  }
  const row = Array.isArray(ffoNode) ? ffoNode[0] : ffoNode;
  return row?.annee_construction ?? null;
}

export function buildResultFromParts(rnbId, groupId, anneeConstruction, surfaceM2) {
  if (anneeConstruction == null || surfaceM2 == null) {
    return null;
  }
  return { rnbId, groupId, anneeConstruction, surfaceM2 };
}

function parseEmbedRow(row, rnbId) {
  if (!row?.batiment_groupe_id) {
    return null;
  }

  const group = row.batiment_groupe ?? {};
  const surfaceM2 = group.s_geom_groupe ?? row.s_geom_groupe ?? null;
  const ffoNode = group.batiment_groupe_ffo_bat ?? row.batiment_groupe_ffo_bat;
  const anneeConstruction = parseEmbeddedFfo(ffoNode);

  return buildResultFromParts(rnbId, row.batiment_groupe_id, anneeConstruction, surfaceM2);
}

function isEmbedSchemaError(error) {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message ?? error?.message ?? '').toLowerCase();
  return (
    status === 400
    || status === 404
    || message.includes('embed')
    || message.includes('relationship')
    || message.includes('could not find')
    || message.includes('unknown')
  );
}

function assertQuotaAvailable(error) {
  if (bdnbQuotaBlocked) {
    throw new BdnbQuotaExhaustedError({ monthlyLimit: 10_000, monthlyRemaining: 0 });
  }

  const quota = parseBdnbQuotaFromError(error);
  if (quota.monthlyRemaining === 0) {
    blockBdnbQuota();
    throw new BdnbQuotaExhaustedError(quota);
  }
}

function wrapBdnbError(error) {
  if (error instanceof BdnbQuotaExhaustedError) {
    throw error;
  }
  if (error?.response?.status === 429) {
    assertQuotaAvailable(error);
  }
  throw error;
}

function postgrestInList(values) {
  return `in.(${values.map((v) => JSON.stringify(v)).join(',')})`;
}

export function collectRnbIdsFromSchools(schools) {
  const ids = new Set();
  for (const school of schools) {
    for (const rnbId of parseRnbField(school.rnb)) {
      ids.add(rnbId);
    }
  }
  return [...ids];
}

async function fetchBdnbBuildingEmbed(rnbId) {
  const rows = await getBdnbJson('/batiment_construction', {
    params: {
      rnb_id: `eq.${rnbId}`,
      select: EMBED_SELECT,
      limit: 1,
    },
    label: 'BDNB batiment_construction (embed)',
  });

  return parseEmbedRow(firstRow(rows), rnbId);
}

async function fetchBdnbBuildingLegacy(rnbId) {
  const constructionRows = await getBdnbJson('/batiment_construction', {
    params: {
      rnb_id: `eq.${rnbId}`,
      select: 'batiment_groupe_id,rnb_id',
      limit: 1,
    },
    label: 'BDNB batiment_construction',
  });

  const construction = firstRow(constructionRows);
  if (!construction) {
    return null;
  }

  const { batiment_groupe_id: groupId } = construction;

  const [ffoRows, groupRows] = await Promise.all([
    getBdnbJson('/batiment_groupe_ffo_bat', {
      params: {
        batiment_groupe_id: `eq.${groupId}`,
        select: 'annee_construction,batiment_groupe_id',
        limit: 1,
      },
      label: 'BDNB ffo_bat',
    }),
    getBdnbJson('/batiment_groupe', {
      params: {
        batiment_groupe_id: `eq.${groupId}`,
        select: 's_geom_groupe,batiment_groupe_id',
        limit: 1,
      },
      label: 'BDNB batiment_groupe',
    }),
  ]);

  const anneeConstruction = firstRow(ffoRows)?.annee_construction ?? null;
  const surfaceM2 = firstRow(groupRows)?.s_geom_groupe ?? null;

  return buildResultFromParts(rnbId, groupId, anneeConstruction, surfaceM2);
}

async function prefetchChunkEmbed(rnbIds) {
  const rows = await getBdnbJson('/batiment_construction', {
    params: {
      rnb_id: postgrestInList(rnbIds),
      select: EMBED_SELECT,
      limit: rnbIds.length,
    },
    label: `BDNB batch embed (${rnbIds.length} RNB)`,
    dedupeKey: `bdnb:batch-embed:${rnbIds.join(',')}`,
  });

  const found = new Set();
  for (const row of rows ?? []) {
    const rnbId = row.rnb_id;
    if (!rnbId) {
      continue;
    }
    found.add(rnbId);
    await setCachedBuilding(rnbId, parseEmbedRow(row, rnbId));
  }

  for (const rnbId of rnbIds) {
    if (!found.has(rnbId)) {
      await setCachedBuilding(rnbId, null);
    }
  }
}

async function prefetchChunkLegacy(rnbIds) {
  const constructions = await getBdnbJson('/batiment_construction', {
    params: {
      rnb_id: postgrestInList(rnbIds),
      select: 'batiment_groupe_id,rnb_id',
      limit: rnbIds.length,
    },
    label: `BDNB batch construction (${rnbIds.length} RNB)`,
    dedupeKey: `bdnb:batch-cstr:${rnbIds.join(',')}`,
  });

  const byRnb = new Map();
  const groupIds = new Set();

  for (const row of constructions ?? []) {
    if (!row?.rnb_id || !row?.batiment_groupe_id) {
      continue;
    }
    byRnb.set(row.rnb_id, row.batiment_groupe_id);
    groupIds.add(row.batiment_groupe_id);
  }

  if (groupIds.size === 0) {
    for (const rnbId of rnbIds) {
      await setCachedBuilding(rnbId, null);
    }
    return;
  }

  const groupIn = postgrestInList([...groupIds]);

  const [ffoRows, groupRows] = await Promise.all([
    getBdnbJson('/batiment_groupe_ffo_bat', {
      params: {
        batiment_groupe_id: groupIn,
        select: 'annee_construction,batiment_groupe_id',
        limit: groupIds.size,
      },
      label: `BDNB batch ffo (${groupIds.size} groupes)`,
      dedupeKey: `bdnb:batch-ffo:${[...groupIds].sort().join(',')}`,
    }),
    getBdnbJson('/batiment_groupe', {
      params: {
        batiment_groupe_id: groupIn,
        select: 's_geom_groupe,batiment_groupe_id',
        limit: groupIds.size,
      },
      label: `BDNB batch groupe (${groupIds.size} groupes)`,
      dedupeKey: `bdnb:batch-bg:${[...groupIds].sort().join(',')}`,
    }),
  ]);

  const ffoByGroup = new Map(
    (ffoRows ?? []).map((r) => [r.batiment_groupe_id, r.annee_construction]),
  );
  const surfaceByGroup = new Map(
    (groupRows ?? []).map((r) => [r.batiment_groupe_id, r.s_geom_groupe]),
  );

  for (const rnbId of rnbIds) {
    const groupId = byRnb.get(rnbId);
    if (!groupId) {
      await setCachedBuilding(rnbId, null);
      continue;
    }
    const result = buildResultFromParts(
      rnbId,
      groupId,
      ffoByGroup.get(groupId) ?? null,
      surfaceByGroup.get(groupId) ?? null,
    );
    await setCachedBuilding(rnbId, result);
  }
}

async function prefetchChunk(rnbIds) {
  if (batchEmbedSupported) {
    try {
      await prefetchChunkEmbed(rnbIds);
      return;
    } catch (error) {
      if (error instanceof BdnbQuotaExhaustedError) {
        throw error;
      }
      if (isEmbedSchemaError(error)) {
        batchEmbedSupported = false;
        logger.warn('BDNB batch embed refusé — repli batch legacy (3 appels/lot)');
      } else {
        wrapBdnbError(error);
      }
    }
  }

  await prefetchChunkLegacy(rnbIds);
}

export async function prefetchBdnbForRnbIds(rnbIds) {
  if (bdnbQuotaBlocked || rnbIds.length === 0) {
    return { prefetched: 0, apiChunks: 0 };
  }

  const uncached = await filterUncachedRnbIds(rnbIds);
  if (uncached.length === 0) {
    return { prefetched: 0, apiChunks: 0 };
  }

  const batchSize = config.bdnb.batchSize;
  let apiChunks = 0;

  for (let i = 0; i < uncached.length; i += batchSize) {
    const chunk = uncached.slice(i, i + batchSize);
    apiChunks += 1;
    try {
      await prefetchChunk(chunk);
    } catch (error) {
      if (error instanceof BdnbQuotaExhaustedError) {
        logger.warn('BDNB prefetch interrompu — quota mensuel épuisé');
        break;
      }
      wrapBdnbError(error);
    }
  }

  return { prefetched: uncached.length, apiChunks };
}

export async function prefetchBdnbForSchools(schools) {
  await initBdnbLocalStore();

  const rnbIds = collectRnbIdsFromSchools(schools);
  const stillUncached = await filterUncachedRnbIds(rnbIds);

  let localHits = 0;
  for (const rnbId of stillUncached) {
    const local = await lookupBdnbLocal(rnbId);
    if (local !== undefined) {
      await setCachedBuilding(rnbId, local);
      localHits += 1;
    }
  }

  const afterLocal = await filterUncachedRnbIds(rnbIds);
  const { prefetched, apiChunks } = await prefetchBdnbForRnbIds(afterLocal);

  if (prefetched > 0 || localHits > 0) {
    const callsPerChunk = batchEmbedSupported ? 1 : 3;
    logger.info(
      `BDNB prefetch : ${localHits} RNB via index local, ${prefetched} via API `
      + `(${apiChunks} lot(s) × ~${callsPerChunk} appel(s))`,
    );
  }

  return { localHits, prefetched, apiChunks };
}

export async function fetchBdnbBuildingData(rnbId, { departementHint = null } = {}) {
  const cached = await getCachedBuilding(rnbId);
  if (cached !== undefined) {
    return cached;
  }

  const local = await lookupBdnbLocal(rnbId, departementHint);
  if (local !== undefined) {
    await setCachedBuilding(rnbId, local);
    return local;
  }

  if (config.bdnb.localOnly || bdnbQuotaBlocked) {
    await setCachedBuilding(rnbId, null);
    return null;
  }

  let result = null;

  try {
    if (embedSupported) {
      try {
        result = await fetchBdnbBuildingEmbed(rnbId);
      } catch (error) {
        if (error instanceof BdnbQuotaExhaustedError) {
          throw error;
        }
        if (isEmbedSchemaError(error)) {
          embedSupported = false;
          batchEmbedSupported = false;
          logger.warn('BDNB embed unitaire refusé — repli 3 appels/RNB');
          result = await fetchBdnbBuildingLegacy(rnbId);
        } else {
          wrapBdnbError(error);
        }
      }
    } else {
      result = await fetchBdnbBuildingLegacy(rnbId);
    }
  } catch (error) {
    wrapBdnbError(error);
  }

  await setCachedBuilding(rnbId, result);
  return result;
}

export function estimateBdnbCallsPerRnb() {
  if (config.bdnb.localOnly || bdnbQuotaBlocked) {
    return 0;
  }
  if (config.bdnb.batchPrefetch && batchEmbedSupported) {
    return 1 / config.bdnb.batchSize;
  }
  return embedSupported ? 1 : 3;
}

export function estimateBdnbCallsForSchools(schoolCount, rnbCount = schoolCount) {
  const perRnb = estimateBdnbCallsPerRnb();
  if (perRnb === 0) {
    return 0;
  }
  if (perRnb < 1) {
    return Math.ceil(rnbCount * perRnb);
  }
  return rnbCount * perRnb;
}
