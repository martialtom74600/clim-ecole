/**
 * Construit un index RNB léger depuis les exports CSV BDNB par département.
 * Prérequis : npm run bdnb:download (ou npm run bdnb:setup)
 */
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { buildAllDeptIndexes } from '../services/bdnbLocalIndex.js';

async function main() {
  logger.info(`Construction index BDNB local — ${config.departments.length} département(s) — ${config.bdnb.localDir}`);
  const total = await buildAllDeptIndexes();
  logger.info(`Terminé : ${total} entrées au total`);
}

main().catch((error) => {
  logger.error('buildBdnbLocalIndex', error);
  process.exit(1);
});
