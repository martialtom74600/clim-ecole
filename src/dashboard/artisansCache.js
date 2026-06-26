import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

const CACHE_FILE = () => path.join(config.cacheDir, 'artisans-index.json');

export async function saveArtisansCache(artisans) {
  await fs.mkdir(config.cacheDir, { recursive: true });
  const payload = artisans.map((a) => ({
    siret: a.siret,
    nom: a.nom_entreprise,
    email: a.email ?? '',
    lat: a.latitude,
    lon: a.longitude,
    codePostal: a.code_postal ?? '',
    trancheEffectif: a.trancheEffectif ?? null,
  }));
  await fs.writeFile(CACHE_FILE(), JSON.stringify(payload));
  return payload.length;
}

export async function loadArtisansCache() {
  try {
    return JSON.parse(await fs.readFile(CACHE_FILE(), 'utf8'));
  } catch {
    return [];
  }
}
