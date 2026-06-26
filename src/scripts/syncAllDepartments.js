/**
 * Sync tous les CSV présents dans data/departments/ vers Supabase.
 * Usage: node src/scripts/syncAllDepartments.js
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildFranceCatalog } from '../data/franceDepartments.js';
import { syncCsvToSupabase } from './syncToSupabase.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const deptDir = path.join(root, 'data/departments');

async function main() {
  const catalog = buildFranceCatalog();
  const byCode = new Map(catalog.map((d) => [d.code, d]));
  const files = (await fs.readdir(deptDir)).filter((f) => f.endsWith('.csv'));

  for (const file of files.sort()) {
    const code = file.replace('.csv', '');
    const dept = byCode.get(code);
    if (!dept) {
      console.warn(`[sync-all] Dept inconnu: ${file}`);
      continue;
    }
    const filePath = path.join(deptDir, file);
    console.log(`\n[sync-all] === ${dept.code} ${dept.label} ===`);
    await syncCsvToSupabase({
      file: filePath,
      regionLabel: dept.region_label,
      department: dept.code,
      skipIfEmpty: true,
    });
  }
  console.log('\n[sync-all] Terminé');
}

main().catch((err) => {
  console.error('[sync-all] Échec:', err.message);
  process.exit(1);
});
