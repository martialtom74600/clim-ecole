/**
 * Pipeline nightly — 1 département toutes les intervalHours (défaut 36 h).
 * Usage: node src/scripts/runNightlyDepartment.js [--force]
 */
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import {
  buildFranceCatalog,
  departmentCsvPath,
  getDepartmentEntry,
} from '../data/franceDepartments.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROTATION_PATH = path.join(root, 'data/departments/rotation.json');
const FORCE = process.argv.includes('--force');

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} → code ${code}`));
    });
  });
}

async function readRotation() {
  const raw = JSON.parse(await fs.readFile(ROTATION_PATH, 'utf8'));
  return {
    phase: raw.phase ?? 'initial',
    nextDeptIndex: Number(raw.nextDeptIndex ?? 0),
    intervalHours: Number(raw.intervalHours ?? 36),
    lastRunAt: raw.lastRunAt ?? null,
    lastDepartment: raw.lastDepartment ?? null,
    lastStatus: raw.lastStatus ?? null,
  };
}

async function writeRotation(data) {
  await fs.writeFile(ROTATION_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function validateCsv(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const rows = parse(content, { columns: true, skip_empty_lines: true, bom: true });
    const valid = rows.filter((r) => r.Code_UAI?.trim());
    return { ok: true, rowCount: valid.length, empty: valid.length === 0 };
  } catch (err) {
    if (err.code === 'ENOENT') return { ok: false, rowCount: 0, empty: true, missing: true };
    throw err;
  }
}

async function main() {
  const catalog = buildFranceCatalog();
  const rotation = await readRotation();

  if (!FORCE && rotation.lastRunAt) {
    const elapsed = Date.now() - Date.parse(rotation.lastRunAt);
    const minWait = rotation.intervalHours * 60 * 60 * 1000;
    if (elapsed < minWait) {
      const hoursLeft = ((minWait - elapsed) / 3_600_000).toFixed(1);
      console.log(`[nightly] Skip — prochain dept dans ~${hoursLeft} h (interval=${rotation.intervalHours}h)`);
      process.exit(0);
    }
  }

  const index = rotation.nextDeptIndex % catalog.length;
  const dept = catalog[index];
  const csvRel = departmentCsvPath(dept.code);
  const csvAbs = path.join(root, csvRel);

  console.log(`[nightly] Département ${dept.code} (${dept.label}) — ${dept.region_label}`);
  console.log(`[nightly] Index ${index + 1}/${catalog.length} — phase ${rotation.phase}`);

  const pipelineEnv = {
    DEPARTEMENTS: dept.code,
    REGION_LABEL: dept.region_label,
    OUTPUT_FILE: csvRel,
    RESET_CHECKPOINT: '1',
    BDNB_LOCAL_ONLY: process.env.BDNB_LOCAL_ONLY ?? '1',
  };

  if (process.env.SKIP_BDNB_DOWNLOAD === '1') {
    pipelineEnv.BDNB_SETUP_SKIP_DOWNLOAD = '1';
  }

  try {
    if (process.env.SKIP_PIPELINE !== '1') {
      if (process.env.BDNB_SETUP !== '0') {
        console.log('[nightly] Setup BDNB…');
        await run(process.execPath, ['src/scripts/bdnbSetup.js'], pipelineEnv);
      }
      console.log('[nightly] Pipeline prospect…');
      await run(process.execPath, ['src/index.js'], pipelineEnv);
    } else {
      console.log('[nightly] SKIP_PIPELINE=1 — pas de prospect');
    }

    const validation = await validateCsv(csvAbs);
    const status = validation.empty ? 'empty' : 'done';

    const nextIndex = (index + 1) % catalog.length;
    const nextPhase = nextIndex === 0 && rotation.phase === 'initial' ? 'refresh' : rotation.phase;

    await writeRotation({
      phase: nextIndex === 0 ? 'refresh' : nextPhase,
      nextDeptIndex: nextIndex,
      intervalHours: rotation.intervalHours,
      lastRunAt: new Date().toISOString(),
      lastDepartment: dept.code,
      lastStatus: status,
      lastRowCount: validation.rowCount,
    });

    console.log(`[nightly] Terminé — ${status}, ${validation.rowCount} ligne(s) → ${csvRel}`);

    if (!validation.missing && process.env.SKIP_SYNC !== '1') {
      console.log('[nightly] Sync Supabase…');
      try {
        await run(process.execPath, [
          'src/scripts/syncToSupabase.js',
          '--file', csvRel,
          '--region-label', dept.region_label,
          '--department', dept.code,
          '--skip-if-empty',
        ], {
          SUPABASE_URL: process.env.SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
          GITHUB_SHA: process.env.GITHUB_SHA,
        });
      } catch (syncErr) {
        console.warn(`[nightly] Sync Supabase échoué (CSV conservé) : ${syncErr.message}`);
        console.warn('[nightly] Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans les secrets GitHub');
      }
    }

    console.log(`[nightly] Prochain index: ${nextIndex} (${catalog[nextIndex]?.code})`);

    process.exit(0);
  } catch (err) {
    await writeRotation({
      ...rotation,
      lastRunAt: new Date().toISOString(),
      lastDepartment: dept.code,
      lastStatus: 'failed',
      lastError: err.message,
    });
    console.error('[nightly] Échec:', err.message);
    process.exit(1);
  }
}

main();
