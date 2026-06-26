/**
 * Génère data/departments/catalog.json depuis franceDepartments.js
 * Usage: node src/scripts/buildDeptCatalog.js
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildFranceCatalog } from '../data/franceDepartments.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'data/departments');

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const catalog = buildFranceCatalog();
  await fs.writeFile(
    path.join(outDir, 'catalog.json'),
    `${JSON.stringify(catalog, null, 2)}\n`,
    'utf8',
  );
  console.log(`[catalog] ${catalog.length} départements → data/departments/catalog.json`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
