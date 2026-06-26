import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { logger } from '../utils/logger.js';

const PAGE_SIZE = 100;

function educationDeptCode(code) {
  const raw = String(code ?? '').trim().toUpperCase();
  if (raw === '2A' || raw === '2B') return raw;
  const n = Number(raw);
  return Number.isNaN(n) ? raw : String(n).padStart(2, '0');
}

const SCHOOL_SELECT =
  'numero_uai,appellation_officielle,denomination_principale,libelle_commune,code_commune,code_postal_uai,adresse_uai,latitude,longitude,rnb';

const BASE_WHERE = [
  'nature_uai >= 100',
  'nature_uai <= 199',
  "secteur_public_prive_libe = 'Public'",
  "etat_etablissement_libe = 'OUVERT'",
].join(' and ');

async function fetchDepartmentSchools(deptCode, inseeCodes) {
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

    const page = (data.results ?? []).filter((school) => inseeCodes.has(school.code_commune));
    schools.push(...page);

    offset += PAGE_SIZE;
    logger.info(`  ${deptCode} : ${Math.min(offset, total)}/${total} lignes API`);

    if (offset >= total) {
      break;
    }
  }

  return schools;
}

export async function fetchPrimarySchools(inseeCodes) {
  const schools = [];
  const seenUai = new Set();

  for (const deptCode of config.departments) {
    const apiDept = educationDeptCode(deptCode);
    logger.info(`Écoles primaires — département ${apiDept}`);
    const deptSchools = await fetchDepartmentSchools(apiDept, inseeCodes);

    for (const school of deptSchools) {
      if (seenUai.has(school.numero_uai)) {
        continue;
      }
      seenUai.add(school.numero_uai);
      schools.push(school);
    }

    logger.info(`  → ${deptSchools.length} écoles dans les communes cibles (${schools.length} cumulées)`);

    if (config.maxSchools > 0 && schools.length >= config.maxSchools) {
      schools.splice(config.maxSchools);
      break;
    }
  }

  logger.success(`${schools.length} écoles primaires publiques dans les communes cibles (${config.departments.length} département(s))`);
  return schools;
}
