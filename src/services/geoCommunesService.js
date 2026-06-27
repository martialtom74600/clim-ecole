/**
 * Communes geo.api.gouv.fr — une requête / dept, cache disque 90 j.
 */
import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { logger } from '../utils/logger.js';
import { geoDepartementCode } from './epciMappingService.js';
import {
  logCacheHit,
  readDeptSnapshot,
  writeDeptSnapshot,
} from './deptSnapshotCache.js';

/** Champs fusionnés — communes + EPCI en un seul appel / cache. */
export const GEO_COMMUNES_FIELDS =
  'nom,code,population,codesPostaux,centre,codeEpci,nomEpci';

const CACHE_TYPE = 'geo-communes';
const GEO_TIMEOUT_MS = Number(process.env.GEO_API_TIMEOUT_MS ?? 120_000);

export async function fetchGeoCommunesForDepartment(deptPipelineCode) {
  const geoDept = geoDepartementCode(deptPipelineCode);

  const cached = await readDeptSnapshot(CACHE_TYPE, geoDept);
  if (cached?.length) {
    await logCacheHit(CACHE_TYPE, geoDept, cached.length);
    return cached;
  }

  logger.info(`geo.api.gouv.fr — département ${geoDept} (téléchargement)`);
  const data = await api.geo.getJson(`${config.apis.geo}/communes`, {
    params: {
      codeDepartement: geoDept,
      fields: GEO_COMMUNES_FIELDS,
      format: 'json',
    },
    label: 'geo.api.gouv.fr',
    timeoutMs: GEO_TIMEOUT_MS,
  });

  await writeDeptSnapshot(
    CACHE_TYPE,
    geoDept,
    data,
    config.deptCache?.geoTtlDays ?? 90,
  );
  logger.info(`[cache] ${CACHE_TYPE} ${geoDept} — ${data.length} commune(s) enregistrée(s)`);
  return data;
}

export async function fetchGeoCommunesForDepartments(deptPipelineCodes) {
  const communes = [];
  for (const dept of deptPipelineCodes) {
    communes.push(...await fetchGeoCommunesForDepartment(dept));
  }
  return communes;
}
