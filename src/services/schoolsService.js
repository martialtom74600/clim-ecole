import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { logger } from '../utils/logger.js';
import { geoDepartementCode } from './epciMappingService.js';
import {
  logCacheHit,
  readDeptSnapshot,
  writeDeptSnapshot,
} from './deptSnapshotCache.js';

const PAGE_SIZE = 100;
const CACHE_TYPE = 'education-schools';

const SCHOOL_SELECT =
  'numero_uai,appellation_officielle,denomination_principale,libelle_commune,code_commune,code_postal_uai,adresse_uai,latitude,longitude,rnb';

const BASE_WHERE = [
  'nature_uai >= 100',
  'nature_uai <= 199',
  "secteur_public_prive_libe = 'Public'",
  "etat_etablissement_libe = 'OUVERT'",
].join(' and ');

async function fetchDepartmentSchoolsFromApi(deptCode) {
  const where = [`code_departement = "${deptCode}"`, BASE_WHERE].join(' and ');
  const schools = [];
  let offset = 0;
  let total = null;

  while (true) {
    const data = await api.education.getJson(`${config.apis.education}/records`, {
      params: {
        limit: PAGE_SIZE,
        offset,
        where,
        select: SCHOOL_SELECT,
      },
      label: 'data.education.gouv.fr',
    });

    total ??= data.total_count;
    schools.push(...(data.results ?? []));

    offset += PAGE_SIZE;
    logger.info(`  ${deptCode} : ${Math.min(offset, total)}/${total} lignes API`);

    if (offset >= total) {
      break;
    }
  }

  return schools;
}

async function getDepartmentSchools(deptPipelineCode) {
  const apiDept = geoDepartementCode(deptPipelineCode);

  const cached = await readDeptSnapshot(CACHE_TYPE, apiDept);
  if (cached?.length) {
    await logCacheHit(CACHE_TYPE, apiDept, cached.length);
    return cached;
  }

  logger.info(`Écoles primaires — département ${apiDept} (téléchargement)`);
  const schools = await fetchDepartmentSchoolsFromApi(apiDept);
  await writeDeptSnapshot(
    CACHE_TYPE,
    apiDept,
    schools,
    config.deptCache?.schoolsTtlDays ?? 60,
  );
  logger.info(`[cache] ${CACHE_TYPE} ${apiDept} — ${schools.length} école(s) enregistrée(s)`);
  return schools;
}

export async function fetchPrimarySchools(inseeCodes) {
  const schools = [];
  const seenUai = new Set();

  for (const deptCode of config.departments) {
    const deptSchools = (await getDepartmentSchools(deptCode))
      .filter((school) => inseeCodes.has(school.code_commune));

    for (const school of deptSchools) {
      if (seenUai.has(school.numero_uai)) continue;
      seenUai.add(school.numero_uai);
      schools.push(school);
    }

    logger.info(`  → ${deptSchools.length} écoles dans les communes cibles (${schools.length} cumulées)`);

    if (config.maxSchools > 0 && schools.length >= config.maxSchools) {
      schools.splice(config.maxSchools);
      break;
    }
  }

  logger.success(
    `${schools.length} écoles primaires publiques dans les communes cibles `
    + `(${config.departments.length} département(s))`,
  );
  return schools;
}
