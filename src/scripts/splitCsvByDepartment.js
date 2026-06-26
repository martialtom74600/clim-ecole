/**
 * Split output_prospection.csv → data/departments/{code}.csv
 * Usage: node src/scripts/splitCsvByDepartment.js [source.csv]
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { createObjectCsvWriter } from 'csv-writer';
import { deptCodeFromInsee, orderedDepartmentCodes } from '../data/franceDepartments.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = process.argv[2] ?? path.join(root, 'output_prospection.csv');
const outDir = path.join(root, 'data/departments');

async function main() {
  const content = await fs.readFile(source, 'utf8');
  const rows = parse(content, { columns: true, skip_empty_lines: true, bom: true });
  const byDept = new Map();
  for (const code of orderedDepartmentCodes()) {
    byDept.set(code, []);
  }

  for (const row of rows) {
    const insee = row.Code_INSEE?.trim();
    if (!insee) continue;
    const dept = deptCodeFromInsee(insee);
    if (!byDept.has(dept)) byDept.set(dept, []);
    byDept.get(dept).push(row);
  }

  await fs.mkdir(outDir, { recursive: true });
  const headers = rows.length ? Object.keys(rows[0]).map((h) => ({ id: h, title: h })) : [];

  let written = 0;
  for (const [dept, deptRows] of byDept) {
    if (!deptRows.length) continue;
    const outPath = path.join(outDir, `${dept}.csv`);
    const writer = createObjectCsvWriter({ path: outPath, header: headers, alwaysQuote: true });
    await writer.writeRecords(deptRows);
    written += 1;
    console.log(`[split] ${dept}.csv — ${deptRows.length} lignes`);
  }
  console.log(`[split] Terminé — ${written} fichiers dans data/departments/`);
}

main().catch((err) => {
  console.error('[split] Échec:', err.message);
  process.exit(1);
});
