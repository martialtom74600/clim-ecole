import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

function normalizeCommuneName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export async function savePopulationCache(eligible) {
  const byInsee = Object.fromEntries(eligible.map((c) => [c.code, c.population]));
  const byName = {};
  const registry = {};

  for (const commune of eligible) {
    byName[normalizeCommuneName(commune.nom)] = {
      code: commune.code,
      population: commune.population,
      nom: commune.nom,
    };
    registry[commune.code] = {
      nom: commune.nom,
      population: commune.population,
      departement: commune.code?.slice(0, 2) ?? '',
      codesPostaux: commune.codesPostaux ?? [],
      lat: commune.centre?.coordinates?.[1] ?? null,
      lon: commune.centre?.coordinates?.[0] ?? null,
    };
  }

  await fs.mkdir(config.cacheDir, { recursive: true });
  const paths = populationCachePaths();
  await fs.writeFile(paths.byInsee, JSON.stringify(byInsee));
  await fs.writeFile(paths.byName, JSON.stringify(byName));
  await fs.writeFile(paths.registry, JSON.stringify(registry));
}

function populationCachePaths() {
  return {
    byInsee: path.join(config.cacheDir, 'population-by-insee.json'),
    byName: path.join(config.cacheDir, 'commune-by-name.json'),
    registry: path.join(config.cacheDir, 'commune-registry.json'),
  };
}

export async function loadPopulationMaps() {
  const paths = populationCachePaths();
  let byInsee = new Map();
  let byName = {};
  let registry = {};

  try {
    byInsee = new Map(Object.entries(JSON.parse(await fs.readFile(paths.byInsee, 'utf8'))));
  } catch {
    /* cache absent */
  }

  try {
    byName = JSON.parse(await fs.readFile(paths.byName, 'utf8'));
  } catch {
    /* cache absent */
  }

  try {
    registry = JSON.parse(await fs.readFile(paths.registry, 'utf8'));
  } catch {
    /* cache absent */
  }

  return { byInsee, byName, registry, normalizeCommuneName };
}

export function resolveCommune(row, { byInsee, byName, normalizeCommuneName }) {
  if (row.Code_INSEE && byInsee.has(String(row.Code_INSEE))) {
    return {
      code: String(row.Code_INSEE),
      population: byInsee.get(String(row.Code_INSEE)),
    };
  }

  const match = byName[normalizeCommuneName(row.Commune)];
  if (match) {
    return { code: match.code, population: match.population };
  }

  return null;
}

export function resolvePopulation(row, maps) {
  return resolveCommune(row, maps)?.population ?? null;
}
