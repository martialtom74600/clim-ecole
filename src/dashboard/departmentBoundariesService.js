import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { fetchJsonReliable } from '../utils/httpClient.js';

const SOURCE_URL =
  'https://etalab-datasets.geo.data.gouv.fr/contours-administratifs/latest/geojson/departements-100m.geojson';

let fullCollection = null;

export function normalizeDeptCode(code) {
  const raw = String(code ?? '').trim().toUpperCase();
  if (raw === '2A' || raw === '2B') {
    return raw;
  }
  const n = Number(raw);
  return Number.isNaN(n) ? raw : String(n).padStart(2, '0');
}

async function loadFullCollection() {
  if (fullCollection) {
    return fullCollection;
  }

  const cachePath = path.join(config.cacheDir, 'departements-100m.geojson');
  try {
    fullCollection = JSON.parse(await fs.readFile(cachePath, 'utf8'));
    return fullCollection;
  } catch {
    /* téléchargement initial */
  }

  fullCollection = await fetchJsonReliable(SOURCE_URL, { label: 'Etalab contours départements' });
  await fs.mkdir(config.cacheDir, { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(fullCollection));
  return fullCollection;
}

export async function getDepartmentBoundariesGeoJson(departments = config.departments) {
  const full = await loadFullCollection();
  const codes = new Set(departments.map(normalizeDeptCode));

  return {
    type: 'FeatureCollection',
    features: full.features.filter((f) => codes.has(f.properties?.code)),
  };
}
