import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { logger } from '../utils/logger.js';

const CACHE_FILE = 'insee-epci.json';

/** @type {Map<string, { codeEpci: string, nomEpci: string }> | null} */
let memoryCache = null;

function normalizeInsee(code) {
  return String(code ?? '').trim().padStart(5, '0');
}

/** Je convertis un code département pipeline (001, 073) en code geo.api.gouv.fr (01, 73). */
export function geoDepartementCode(dept) {
  const raw = String(dept ?? '').trim().toUpperCase();
  if (raw === '2A' || raw === '2B') return raw;
  const n = Number(raw.replace(/^0+/, ''));
  if (Number.isNaN(n)) return raw;
  return String(n).padStart(2, '0');
}

function cachePath() {
  return path.join(config.cacheDir, CACHE_FILE);
}

function mappingFilePath() {
  const raw = config.epci?.mappingFile ?? 'data/insee_epci.csv';
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

/** Je parse un CSV Code_INSEE, Code_EPCI, Nom_EPCI. */
function parseMappingCsv(raw) {
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
  });

  const map = new Map();
  for (const row of rows) {
    const insee = normalizeInsee(row.Code_INSEE ?? row.code_insee ?? row.insee);
    const codeEpci = String(row.Code_EPCI ?? row.code_epci ?? row.epci ?? '').trim();
    const nomEpci = String(row.Nom_EPCI ?? row.nom_epci ?? row.nom ?? '').trim();
    if (insee && codeEpci) {
      map.set(insee, { codeEpci, nomEpci: nomEpci || codeEpci });
    }
  }
  return map;
}

/** Je charge le fichier de correspondance INSEE → EPCI s'il existe. */
async function loadFromMappingFile() {
  const file = mappingFilePath();
  try {
    const raw = await fs.readFile(file, 'utf8');
    const map = parseMappingCsv(raw);
    if (map.size > 0) {
      logger.info(`Correspondance EPCI : ${map.size} communes depuis ${file}`);
      return map;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`Lecture ${file} impossible : ${err.message}`);
    }
  }
  return null;
}

/** Je construis la table depuis geo.api.gouv.fr (codes EPCI officiels). */
async function bootstrapFromGeoApi(deptCodes = null) {
  const deptNumbers =
    deptCodes ?? [...new Set(config.departments.map((d) => geoDepartementCode(d)))];
  const map = new Map();

  for (const dept of deptNumbers) {
    const data = await api.geo.getJson(`${config.apis.geo}/communes`, {
      params: {
        codeDepartement: dept,
        fields: 'code,nom,codeEpci,nomEpci',
        format: 'json',
      },
      label: 'geo.api.gouv.fr EPCI',
    });

    for (const commune of data) {
      const insee = normalizeInsee(commune.code);
      const codeEpci = String(commune.codeEpci ?? '').trim();
      if (!insee || !codeEpci) continue;
      map.set(insee, {
        codeEpci,
        nomEpci: String(commune.nomEpci ?? '').trim() || codeEpci,
      });
    }
  }

  logger.info(`Correspondance EPCI : ${map.size} communes via geo.api.gouv.fr`);
  return map;
}

async function persistMapping(map) {
  await fs.mkdir(config.cacheDir, { recursive: true });
  const payload = Object.fromEntries(map.entries());
  await fs.writeFile(cachePath(), JSON.stringify(payload, null, 2), 'utf8');
}

async function loadFromDiskCache() {
  try {
    const raw = await fs.readFile(cachePath(), 'utf8');
    const obj = JSON.parse(raw);
    const map = new Map(
      Object.entries(obj).map(([insee, meta]) => [normalizeInsee(insee), meta]),
    );
    if (map.size > 0) {
      return map;
    }
  } catch {
    /* cache absent */
  }
  return null;
}

/**
 * Je garantis que la correspondance INSEE → EPCI est disponible (fichier, cache ou API).
 */
export async function ensureEpciMapping() {
  let map = memoryCache?.size ? memoryCache : null;

  if (!map?.size) {
    map = await loadFromMappingFile();
  }
  if (!map?.size) {
    map = await loadFromDiskCache();
  }
  if (!map?.size) {
    map = new Map();
  }

  const requiredDepts = new Set(config.departments.map((d) => geoDepartementCode(d)));
  const coveredDepts = new Set([...map.keys()].map((insee) => insee.slice(0, 2)));
  const missingDepts = [...requiredDepts].filter((d) => !coveredDepts.has(d));

  if (missingDepts.length) {
    logger.info(`Correspondance EPCI : complément départements ${missingDepts.join(', ')}`);
    const extra = await bootstrapFromGeoApi(missingDepts);
    for (const [insee, meta] of extra) {
      map.set(insee, meta);
    }
  } else if (!map.size) {
    map = await bootstrapFromGeoApi();
  }

  await persistMapping(map);
  memoryCache = map;
  return map;
}

/** Je lis le cache local de façon synchrone (après ensureEpciMapping ou reexport). */
export function getEpciMappingSync() {
  if (memoryCache?.size) {
    return memoryCache;
  }

  try {
    const raw = fsSync.readFileSync(cachePath(), 'utf8');
    const obj = JSON.parse(raw);
    memoryCache = new Map(
      Object.entries(obj).map(([insee, meta]) => [normalizeInsee(insee), meta]),
    );
    return memoryCache;
  } catch {
    memoryCache = new Map();
    return memoryCache;
  }
}

/** Je résous l'EPCI d'une commune à partir de son code INSEE. */
export function resolveEpciForInsee(codeInsee, mapping = getEpciMappingSync()) {
  const insee = normalizeInsee(codeInsee);
  if (!insee) {
    return { codeEpci: '', nomEpci: '' };
  }
  return mapping.get(insee) ?? { codeEpci: '', nomEpci: '' };
}
