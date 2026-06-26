/**
 * Télécharge les exports CSV BDNB (open-data S3) pour chaque département configuré,
 * extrait uniquement les 3 tables nécessaires au pipeline.
 *
 * Usage : npm run bdnb:download
 * Variables : BDNB_MILLESIME, BDNB_LOCAL_DIR, DEPARTEMENTS, BDNB_DOWNLOAD_FORCE=1
 */
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import {
  buildBdnbDeptCsvZipUrl,
  resolveLatestBdnbMillesime,
} from '../services/bdnbOpenDataUrls.js';
import { deptHasRequiredCsv } from '../services/bdnbLocalIndex.js';
import {
  assertUnzipAvailable,
  extractZipEntries,
  listZipEntries,
  pickBdnbCsvEntries,
} from '../utils/zipExtract.js';

const FORCE = process.env.BDNB_DOWNLOAD_FORCE === '1';
const downloadsDir = path.join(config.bdnb.localDir, 'downloads');

async function loadManifest() {
  const manifestPath = path.join(config.bdnb.localDir, 'manifest.json');
  try {
    return JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  } catch {
    return { millesime: null, departments: {} };
  }
}

async function saveManifest(manifest) {
  await fs.mkdir(config.bdnb.localDir, { recursive: true });
  await fs.writeFile(
    path.join(config.bdnb.localDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
}

async function downloadFile(url, destPath, { label }) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'clim-ecole-prospection/1.0' },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} — ${url}`);
  }

  const total = Number(res.headers.get('content-length') ?? 0);
  await fs.mkdir(path.dirname(destPath), { recursive: true });

  const tmpPath = `${destPath}.part`;
  const fileStream = createWriteStream(tmpPath);
  const body = res.body;

  if (!body) {
    throw new Error('Réponse sans corps');
  }

  let received = 0;
  let lastPct = -1;
  const reader = body.getReader();

  const progressStream = new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) {
        this.push(null);
        return;
      }
      received += value.length;
      if (total > 0) {
        const pct = Math.floor((received / total) * 100);
        if (pct >= lastPct + 10) {
          lastPct = pct;
          logger.info(`  ${label} : ${pct} % (${Math.round(received / 1e6)} Mo)`);
        }
      }
      this.push(Buffer.from(value));
    },
  });

  await pipeline(progressStream, fileStream);
  await fs.rename(tmpPath, destPath);

  const stat = await fs.stat(destPath);
  logger.success(`  ${label} : ${Math.round(stat.size / 1e6)} Mo téléchargés`);
  return stat.size;
}

async function prepareDepartment(departement, millesime, manifest) {
  const deptDir = path.join(config.bdnb.localDir, departement);
  const zipPath = path.join(downloadsDir, `${millesime}_${departement}.zip`);
  const url = buildBdnbDeptCsvZipUrl(departement, millesime);

  if (!FORCE && (await deptHasRequiredCsv(deptDir))) {
    logger.info(`${departement} : CSV déjà présents — skip (BDNB_DOWNLOAD_FORCE=1 pour forcer)`);
    return { skipped: true, departement };
  }

  logger.info(`${departement} : téléchargement ${url}`);
  await downloadFile(url, zipPath, { label: departement });

  logger.info(`${departement} : extraction des tables BDNB (cœur + patrimoine)…`);
  const entries = await listZipEntries(zipPath);
  const picked = pickBdnbCsvEntries(entries);
  const coreKeys = ['relRnb', 'construction', 'ffo', 'groupe'];
  const patrimoineKeys = ['bpe', 'adresseGroupe', 'relDpe', 'dpeTertiaire', 'adresse'];
  const missing = coreKeys.filter((k) => !picked[k]);
  if (missing.length) {
    throw new Error(`${departement} : tables manquantes dans le zip (${missing.join(', ')})`);
  }

  await fs.rm(deptDir, { recursive: true, force: true });
  await extractZipEntries(
    zipPath,
    [...coreKeys, ...patrimoineKeys].map((k) => picked[k]).filter(Boolean),
    deptDir,
  );

  if (!(await deptHasRequiredCsv(deptDir))) {
    throw new Error(`${departement} : extraction incomplète`);
  }

  manifest.departments[departement] = {
    url,
    zipPath,
    millesime,
    extractedAt: new Date().toISOString(),
    tables: picked,
  };

  return { skipped: false, departement };
}

async function main() {
  await assertUnzipAvailable();

  let millesime = process.env.BDNB_MILLESIME?.trim() || config.bdnb.millesime;
  if (!millesime || millesime === 'auto') {
    logger.info('Résolution du dernier millésime BDNB via data.gouv.fr…');
    millesime = await resolveLatestBdnbMillesime();
  }
  logger.info(`Millésime BDNB : ${millesime}`);
  logger.info(`Départements : ${config.departments.join(', ')}`);
  logger.info(`Destination : ${config.bdnb.localDir}`);

  const manifest = await loadManifest();
  manifest.millesime = millesime;

  let done = 0;
  let skipped = 0;

  for (const dept of config.departments) {
    try {
      const result = await prepareDepartment(dept, millesime, manifest);
      if (result.skipped) {
        skipped += 1;
      } else {
        done += 1;
      }
      await saveManifest(manifest);
    } catch (error) {
      logger.error(`${dept} : échec — ${error.message}`);
      throw error;
    }
  }

  logger.info(`Terminé — ${done} téléchargé(s), ${skipped} déjà prêt(s)`);
  logger.info('Étape suivante : npm run bdnb:build-index (ou npm run bdnb:setup)');
}

main().catch((error) => {
  logger.error('downloadBdnbDepartments', error);
  process.exit(1);
});
