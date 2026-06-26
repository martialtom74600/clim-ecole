import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { logger } from '../utils/logger.js';
import { geoDepartementCode } from './epciMappingService.js';

const CACHE_FILE = 'epci-geometries.json';

/** @type {Map<string, { nom: string, polygons: number[][][][] }> | null} */
let memoryCache = null;

function cachePath() {
  return path.join(config.cacheDir, CACHE_FILE);
}

/** GeoJSON [lng,lat] → Leaflet [lat,lng] par anneau. */
function geoJsonToPolygons(geometry) {
  if (!geometry) return null;

  if (geometry.type === 'Polygon') {
    return [
      geometry.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng])),
    ];
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((poly) =>
      poly.map((ring) => ring.map(([lng, lat]) => [lat, lng])),
    );
  }

  return null;
}

async function fetchDepartmentEpcis(dept) {
  const data = await api.geo.getJson(`${config.apis.geo}/epcis`, {
    params: {
      codeDepartement: dept,
      format: 'geojson',
      geometry: 'contour',
    },
    label: 'geo.api EPCI contours',
  });

  const features = data.type === 'FeatureCollection' ? data.features : [data];
  const entries = [];

  for (const feature of features) {
    const code = String(feature.properties?.code ?? '').trim();
    const polygons = geoJsonToPolygons(feature.geometry);
    if (!code || !polygons?.length) continue;
    entries.push([
      code,
      {
        nom: String(feature.properties?.nom ?? '').trim() || code,
        polygons,
      },
    ]);
  }

  return entries;
}

async function loadFromDisk() {
  try {
    const raw = await fs.readFile(cachePath(), 'utf8');
    const obj = JSON.parse(raw);
    const map = new Map(Object.entries(obj));
    if (map.size > 0) return map;
  } catch {
    /* cache absent */
  }
  return null;
}

function loadFromDiskSync() {
  try {
    const raw = fsSync.readFileSync(cachePath(), 'utf8');
    return new Map(Object.entries(JSON.parse(raw)));
  } catch {
    return new Map();
  }
}

async function persist(map) {
  await fs.mkdir(config.cacheDir, { recursive: true });
  await fs.writeFile(cachePath(), JSON.stringify(Object.fromEntries(map)), 'utf8');
}

/** Je charge ou télécharge les contours EPCI (communautés de communes, etc.). */
export async function ensureEpciGeometries() {
  if (memoryCache?.size) return memoryCache;

  memoryCache = await loadFromDisk();
  if (memoryCache?.size) return memoryCache;

  memoryCache = new Map();
  const depts = [...new Set(config.departments.map((d) => geoDepartementCode(d)))];

  for (const dept of depts) {
    try {
      const entries = await fetchDepartmentEpcis(dept);
      for (const [code, geom] of entries) {
        memoryCache.set(code, geom);
      }
    } catch (err) {
      logger.warn(`Contours EPCI dépt. ${dept} : ${err.message}`);
    }
  }

  if (memoryCache.size) {
    await persist(memoryCache);
    logger.info(`Contours EPCI : ${memoryCache.size} intercommunalités en cache`);
  }

  return memoryCache;
}

export function getEpciGeometrySync(codeEpci) {
  if (!memoryCache?.size) {
    memoryCache = loadFromDiskSync();
  }
  return memoryCache.get(String(codeEpci ?? '').trim()) ?? null;
}
