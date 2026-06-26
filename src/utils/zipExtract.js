import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);

export async function commandExists(cmd) {
  try {
    await execFileAsync('which', [cmd]);
    return true;
  } catch {
    return false;
  }
}

export async function listZipEntries(zipPath) {
  const { stdout } = await execFileAsync('unzip', ['-Z1', zipPath]);
  return stdout.trim().split('\n').filter(Boolean);
}

/**
 * Fichiers CSV utiles au pipeline (millésime 2026-02-a).
 * Chaîne : RNB → batiment_construction → batiment_groupe (+ FFO année, surface groupe).
 */
export function classifyBdnbCsvEntry(entry) {
  const base = entry.toLowerCase().replace(/\\/g, '/').split('/').pop();
  if (!base.endsWith('.csv')) {
    return null;
  }
  if (base === 'rel_batiment_construction_rnb.csv') {
    return 'relRnb';
  }
  if (base === 'batiment_construction.csv') {
    return 'construction';
  }
  if (base === 'batiment_groupe_ffo_bat.csv') {
    return 'ffo';
  }
  if (base === 'batiment_groupe.csv') {
    return 'groupe';
  }
  // batiment_groupe_geospx.csv : métadonnées géométriques seules — pas de surface/commune
  if (base === 'batiment_groupe_bpe.csv') {
    return 'bpe';
  }
  if (base === 'batiment_groupe_adresse.csv') {
    return 'adresseGroupe';
  }
  if (base === 'rel_batiment_groupe_dpe_tertiaire.csv') {
    return 'relDpe';
  }
  if (base === 'dpe_tertiaire.csv') {
    return 'dpeTertiaire';
  }
  if (base === 'adresse.csv') {
    return 'adresse';
  }
  if (base === 'proprietaire.csv') {
    return 'proprietaire';
  }
  if (base === 'rel_batiment_groupe_proprietaire.csv') {
    return 'relProprietaire';
  }
  return null;
}

/** Tables CSV BDNB nécessaires au scan patrimoine local (BPE, DPE tertiaire, adresses, FFO propriétaire). */
export const BDNB_PATRIMOINE_TABLE_KEYS = [
  'bpe',
  'adresseGroupe',
  'relDpe',
  'dpeTertiaire',
  'adresse',
  'proprietaire',
  'relProprietaire',
];

export function pickBdnbCsvEntries(entries) {
  const picked = {
    relRnb: null,
    construction: null,
    ffo: null,
    groupe: null,
    bpe: null,
    adresseGroupe: null,
    relDpe: null,
    dpeTertiaire: null,
    adresse: null,
    proprietaire: null,
    relProprietaire: null,
  };
  for (const entry of entries) {
    const kind = classifyBdnbCsvEntry(entry);
    if (kind && !picked[kind]) {
      picked[kind] = entry;
    }
  }
  return picked;
}

export async function extractZipEntries(zipPath, entries, destDir) {
  if (!entries.length) {
    return;
  }
  await fs.mkdir(destDir, { recursive: true });
  await execFileAsync('unzip', ['-o', '-q', zipPath, ...entries, '-d', destDir]);
}

export async function assertUnzipAvailable() {
  if (!(await commandExists('unzip'))) {
    throw new Error(
      'La commande « unzip » est requise (macOS : déjà installé ; Linux : apt install unzip)',
    );
  }
}
