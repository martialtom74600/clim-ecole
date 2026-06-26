import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { api } from '../utils/apiClients.js';

const CACHE_FILE = () => path.join(config.cacheDir, 'school-coords.json');

function isExternalAssetId(codeUai) {
  const id = String(codeUai ?? '');
  return id.startsWith('BDNB-') || id.startsWith('PAT-');
}

function readCoordsFromRow(school, cache) {
  const lat = school.Latitude ?? school.latitude ?? cache[school.Code_UAI]?.lat;
  const lng = school.Longitude ?? school.longitude ?? cache[school.Code_UAI]?.lng;
  if (lat == null || lng == null) {
    return null;
  }
  return { lat: Number(lat), lng: Number(lng) };
}

/**
 * Je résous les coordonnées GPS des bâtiments.
 * @param {object[]} schools
 * @param {{ requireCoords?: boolean }} options — requireCoords=true pour la carte (exclut sans GPS)
 */
export async function resolveSchoolCoordinates(schools, { requireCoords = false } = {}) {
  let cache = {};
  try {
    cache = JSON.parse(await fs.readFile(CACHE_FILE(), 'utf8'));
  } catch {
    /* cache absent */
  }

  const missingUais = [];
  const enriched = schools.map((school) => {
    const coords = readCoordsFromRow(school, cache);
    if (coords) {
      return { ...school, Latitude: coords.lat, Longitude: coords.lng };
    }
    if (!isExternalAssetId(school.Code_UAI)) {
      missingUais.push(school.Code_UAI);
    }
    return school;
  });

  if (missingUais.length > 0) {
    const fetched = await fetchCoordsFromEducation(missingUais);
    Object.assign(cache, fetched);
    await fs.mkdir(config.cacheDir, { recursive: true });
    await fs.writeFile(CACHE_FILE(), JSON.stringify(cache));

    for (const school of enriched) {
      const coords = fetched[school.Code_UAI] ?? cache[school.Code_UAI];
      if (coords) {
        school.Latitude = coords.lat;
        school.Longitude = coords.lng;
      }
    }
  }

  if (requireCoords) {
    return enriched.filter((s) => s.Latitude != null && s.Longitude != null);
  }
  return enriched;
}

async function fetchCoordsFromEducation(uaiList) {
  const result = {};
  const unique = [...new Set(uaiList.filter(Boolean))];

  for (let i = 0; i < unique.length; i += 15) {
    const batch = unique.slice(i, i + 15);
    const uaiFilter = batch.map((u) => `"${u}"`).join(', ');
    const data = await api.education.getJson(`${config.apis.education}/records`, {
      params: {
        limit: 100,
        where: `numero_uai in (${uaiFilter})`,
        select: 'numero_uai,latitude,longitude',
      },
      label: 'education-coords',
    });

    for (const row of data.results ?? []) {
      if (row.latitude != null && row.longitude != null) {
        result[row.numero_uai] = { lat: row.latitude, lng: row.longitude };
      }
    }
  }

  return result;
}
