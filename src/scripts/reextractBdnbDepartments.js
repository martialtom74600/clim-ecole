/**
 * Ré-extrait les 4 bons CSV depuis les zip déjà téléchargés (sans re-télécharger).
 */
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { deptHasRequiredCsv } from '../services/bdnbLocalIndex.js';
import {
  assertUnzipAvailable,
  extractZipEntries,
  listZipEntries,
  pickBdnbCsvEntries,
} from '../utils/zipExtract.js';

async function main() {
  await assertUnzipAvailable();
  const manifestPath = path.join(config.bdnb.localDir, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

  for (const dept of config.departments) {
    const entry = manifest.departments?.[dept];
    const zipPath = entry?.zipPath ?? path.join(config.bdnb.localDir, 'downloads', `${manifest.millesime}_${dept}.zip`);
    const deptDir = path.join(config.bdnb.localDir, dept);

    try {
      await fs.access(zipPath);
    } catch {
      logger.warn(`${dept} : zip absent ${zipPath}`);
      continue;
    }

    logger.info(`${dept} : ré-extraction depuis ${zipPath}`);
    const entries = await listZipEntries(zipPath);
    const picked = pickBdnbCsvEntries(entries);
    const coreKeys = ['relRnb', 'construction', 'ffo', 'groupe'];
    const patrimoineKeys = ['bpe', 'adresseGroupe', 'relDpe', 'dpeTertiaire', 'adresse'];
    const required = [...coreKeys, ...patrimoineKeys];
    const missing = coreKeys.filter((k) => !picked[k]);
    if (missing.length) {
      throw new Error(`${dept} : tables manquantes (${missing.join(', ')})`);
    }

    await fs.rm(deptDir, { recursive: true, force: true });
    await extractZipEntries(
      zipPath,
      required.map((k) => picked[k]).filter(Boolean),
      deptDir,
    );

    if (!(await deptHasRequiredCsv(deptDir))) {
      throw new Error(`${dept} : extraction incomplète`);
    }
    logger.success(`${dept} : OK`);
  }
}

main().catch((e) => {
  logger.error('reextractBdnbDepartments', e);
  process.exit(1);
});
