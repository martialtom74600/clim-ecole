import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { buildResultFromParts } from './bdnbApiService.js';

function normalizeHeader(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

async function walkDir(dir) {
  const out = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        out.push(...(await walkDir(full)));
      } else {
        out.push(full);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  return out;
}

export async function findCsvFile(dir, pattern, { exclude = [] } = {}) {
  let files;
  try {
    files = await walkDir(dir);
  } catch {
    return null;
  }

  const lowerPattern = pattern.toLowerCase();
  const match = files.find((filePath) => {
    const name = path.basename(filePath).toLowerCase();
    if (!name.endsWith('.csv') || !name.includes(lowerPattern)) {
      return false;
    }
    return !exclude.some((frag) => name.includes(frag.toLowerCase()));
  });
  return match ?? null;
}

export async function streamCsvRows(filePath, onRow) {
  const sample = await fs.readFile(filePath, { encoding: 'utf8', length: 4096 });
  const firstLine = sample.split(/\r?\n/)[0] ?? '';
  const delimiter =
    firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length
      ? ';'
      : ',';

  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: (headers) => headers.map(normalizeHeader),
      delimiter,
      quote: '"',
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
      skip_records_with_error: true,
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        onRow(record);
      }
    });
    parser.on('error', reject);
    parser.on('end', resolve);
    createReadStream(filePath).pipe(parser);
  });
}

export async function findExactCsv(dir, basename) {
  const files = await walkDir(dir);
  const target = basename.toLowerCase();
  return files.find((f) => path.basename(f).toLowerCase() === target) ?? null;
}

/** Je résous le CSV batiment_groupe (surface + commune INSEE) — geospx seul ne suffit pas. */
export async function findGroupeCsv(dir) {
  return findExactCsv(dir, 'batiment_groupe.csv');
}

export async function deptHasRequiredCsv(deptDir) {
  const relRnb = await findExactCsv(deptDir, 'rel_batiment_construction_rnb.csv');
  const cstr = await findExactCsv(deptDir, 'batiment_construction.csv');
  const ffo = await findExactCsv(deptDir, 'batiment_groupe_ffo_bat.csv');
  const groupe = await findExactCsv(deptDir, 'batiment_groupe.csv');
  return Boolean(relRnb && cstr && ffo && groupe);
}

export async function buildDeptIndex(departement, { localDir = config.bdnb.localDir } = {}) {
  const deptDir = path.join(localDir, departement);
  try {
    await fs.access(deptDir);
  } catch {
    logger.warn(`Dossier absent : ${deptDir} — ignoré`);
    return 0;
  }

  const relRnbFile = await findExactCsv(deptDir, 'rel_batiment_construction_rnb.csv');
  const cstrFile = await findExactCsv(deptDir, 'batiment_construction.csv');
  const ffoFile = await findExactCsv(deptDir, 'batiment_groupe_ffo_bat.csv');
  const groupeFile = await findGroupeCsv(deptDir);

  if (!relRnbFile || !cstrFile || !ffoFile || !groupeFile) {
    logger.warn(
      `${departement} : CSV manquants (rel=${Boolean(relRnbFile)}, cstr=${Boolean(cstrFile)}, ffo=${Boolean(ffoFile)}, groupe=${Boolean(groupeFile)})`,
    );
    return 0;
  }

  const cstrById = new Map();
  await streamCsvRows(cstrFile, (row) => {
    const cid = row.batiment_construction_id;
    const gid = row.batiment_groupe_id;
    if (!cid || !gid) {
      return;
    }
    const surface = Number(row.s_geom_cstr ?? row.s_geom_groupe);
    cstrById.set(cid, { groupId: gid, surface: Number.isNaN(surface) ? null : surface });
  });

  const ffoByGroup = new Map();
  await streamCsvRows(ffoFile, (row) => {
    const gid = row.batiment_groupe_id;
    const annee = Number(row.annee_construction);
    if (gid && !Number.isNaN(annee)) {
      ffoByGroup.set(gid, annee);
    }
  });

  const surfaceByGroup = new Map();
  await streamCsvRows(groupeFile, (row) => {
    const gid = row.batiment_groupe_id;
    const surface = Number(row.s_geom_groupe);
    if (gid && !Number.isNaN(surface)) {
      surfaceByGroup.set(gid, surface);
    }
  });

  const index = {};
  let count = 0;

  await streamCsvRows(relRnbFile, (row) => {
    const rnbId = row.rnb_id;
    const cstrId = row.batiment_construction_id;
    if (!rnbId || !cstrId) {
      return;
    }

    const link = cstrById.get(cstrId);
    if (!link) {
      return;
    }

    const surface = surfaceByGroup.get(link.groupId) ?? link.surface;
    const built = buildResultFromParts(
      rnbId,
      link.groupId,
      ffoByGroup.get(link.groupId) ?? null,
      surface ?? null,
    );
    index[rnbId] = built;
    count += 1;
  });

  await fs.mkdir(localDir, { recursive: true });
  const outPath = path.join(localDir, `index-${departement}.json`);
  await fs.writeFile(outPath, JSON.stringify(index));
  logger.success(`${departement} : ${count} RNB indexés → ${outPath}`);
  return count;
}

export async function buildAllDeptIndexes(departements = config.departments, options = {}) {
  let total = 0;
  for (const dept of departements) {
    total += await buildDeptIndex(dept, options);
  }
  return total;
}
