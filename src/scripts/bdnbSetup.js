/**
 * Setup BDNB complet : téléchargement S3 + index RNB local.
 * Usage : npm run bdnb:setup
 */
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { buildAllDeptIndexes } from '../services/bdnbLocalIndex.js';
import { initBdnbLocalStore } from '../services/bdnbLocalStore.js';
import { resetBdnbQuotaBlock } from '../services/bdnbQuotaState.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

function runNodeScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, scriptName)], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} a échoué (code ${code})`));
      }
    });
  });
}

async function runBdnbSetup() {
  const skipDownload = process.env.BDNB_SETUP_SKIP_DOWNLOAD === '1';

  logger.info('═══ Setup BDNB local (0 €, sans quota API) ═══');
  logger.info(`Territoire : ${config.departments.length} département(s) — ${config.regionLabel ?? 'config'}`);

  if (!skipDownload) {
    await runNodeScript('downloadBdnbDepartments.js');
  } else {
    logger.info('Téléchargement ignoré (BDNB_SETUP_SKIP_DOWNLOAD=1)');
  }

  logger.info('Construction des index RNB…');
  const total = await buildAllDeptIndexes();
  const local = await initBdnbLocalStore();
  resetBdnbQuotaBlock();

  logger.success(`Setup terminé — ${total} RNB indexés, ${local.loadedDepts.length} département(s)`);

  if (process.env.BDNB_PRUNE_CSV_AFTER_INDEX === '1') {
    for (const dept of config.departments) {
      const csvDir = path.join(config.bdnb.localDir, dept, 'csv');
      await fs.rm(csvDir, { recursive: true, force: true });
    }
    logger.info('CSV BDNB supprimés — zip conservés (ré-extraction patrimoine à la volée)');
  }

  return { total, depts: local.loadedDepts.length };
}

export { runBdnbSetup };

async function main() {
  await runBdnbSetup();
  logger.info('Activez dans .env : BDNB_LOCAL_ONLY=1');
  logger.info('Puis relancez : npm run prospect');
}

main().catch((error) => {
  logger.error('bdnbSetup', error);
  process.exit(1);
});
