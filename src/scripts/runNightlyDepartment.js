/**
 * Pipeline nightly optimisé — batch temps-réel, refresh delta, priorité, monolith partiel.
 */
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import {
  buildFranceCatalog,
  departmentCsvPath,
} from '../data/franceDepartments.js';
import {
  adaptiveBatchSize,
  applyMonthlyBudgetAfterRun,
  capBatchSize,
  checkDiskSpace,
  createTimeBudget,
  formatLimitSummary,
  onRunnerTermination,
  readMonthlyBudget,
  resolveMaxRuntimeMinutes,
} from './githubLimits.js';
import { getDeptEstimateMinutes, mergeDeptDurations } from './deptEstimates.js';
import {
  resolveRefreshMode,
  syncOnlyMinutes,
  skipEmptyMinutes,
  mediumRefreshMinutes,
} from './deptRefreshStrategy.js';
import { buildInitialQueue, buildRefreshQueue } from './deptQueue.js';
import { fetchPipelineJobs } from './pipelineJobsClient.js';
import { syncCsvToSupabase } from './syncToSupabase.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROTATION_PATH = path.join(root, 'data/departments/rotation.json');
const FORCE = process.argv.includes('--force');

function parseArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || !process.argv[idx + 1]) return null;
  const n = Number(process.argv[idx + 1]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function runNodeScript(scriptRel, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptRel], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptRel} → code ${code}`));
    });
  });
}

async function readRotation() {
  const raw = JSON.parse(await fs.readFile(ROTATION_PATH, 'utf8'));
  return {
    phase: raw.phase ?? 'initial',
    nextDeptIndex: Number(raw.nextDeptIndex ?? 0),
    initialStartIndex: raw.initialStartIndex ?? null,
    initialDeptsProcessed: Number(raw.initialDeptsProcessed ?? 0),
    refreshCycle: Number(raw.refreshCycle ?? 0),
    completedInitialAt: raw.completedInitialAt ?? null,
    intervalHours: Number(raw.intervalHours ?? 12),
    initialIntervalHours: Number(raw.initialIntervalHours ?? raw.intervalHours ?? 12),
    refreshIntervalHours: Number(raw.refreshIntervalHours ?? 24),
    initialBatchSize: Number(raw.initialBatchSize ?? 5),
    refreshBatchSize: Number(raw.refreshBatchSize ?? 4),
    maxBatchSize: Number(raw.maxBatchSize ?? 8),
    maxRuntimeMinutes: raw.maxRuntimeMinutes ?? 105,
    initialMaxRuntimeMinutes: raw.initialMaxRuntimeMinutes ?? 165,
    skipExistingCsvInInitial: raw.skipExistingCsvInInitial !== false,
    refreshLightDays: Number(raw.refreshLightDays ?? 30),
    refreshFullDays: Number(raw.refreshFullDays ?? 60),
    emptyDeptSkipDays: Number(raw.emptyDeptSkipDays ?? 90),
    deptDurations: raw.deptDurations ?? {},
    monthlyBudget: raw.monthlyBudget ?? null,
    lastRunAt: raw.lastRunAt ?? null,
    lastDepartment: raw.lastDepartment ?? null,
    lastStatus: raw.lastStatus ?? null,
    lastBatchSize: raw.lastBatchSize ?? null,
    lastBatchResults: raw.lastBatchResults ?? null,
    lastRunDurationMinutes: raw.lastRunDurationMinutes ?? null,
  };
}

async function writeRotation(data) {
  await fs.writeFile(ROTATION_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function buildRotationPayload(rotation, overrides) {
  return {
    phase: rotation.phase,
    nextDeptIndex: rotation.nextDeptIndex,
    initialStartIndex: rotation.initialStartIndex,
    initialDeptsProcessed: rotation.initialDeptsProcessed,
    refreshCycle: rotation.refreshCycle,
    completedInitialAt: rotation.completedInitialAt,
    intervalHours: rotation.intervalHours,
    initialIntervalHours: rotation.initialIntervalHours,
    refreshIntervalHours: rotation.refreshIntervalHours,
    initialBatchSize: rotation.initialBatchSize,
    refreshBatchSize: rotation.refreshBatchSize,
    maxBatchSize: rotation.maxBatchSize,
    maxRuntimeMinutes: rotation.maxRuntimeMinutes,
    initialMaxRuntimeMinutes: rotation.initialMaxRuntimeMinutes,
    skipExistingCsvInInitial: rotation.skipExistingCsvInInitial,
    refreshLightDays: rotation.refreshLightDays,
    refreshFullDays: rotation.refreshFullDays,
    emptyDeptSkipDays: rotation.emptyDeptSkipDays,
    deptDurations: rotation.deptDurations,
    monthlyBudget: rotation.monthlyBudget,
    lastRunAt: rotation.lastRunAt,
    lastDepartment: rotation.lastDepartment,
    lastStatus: rotation.lastStatus,
    lastRowCount: rotation.lastRowCount,
    lastBatchSize: rotation.lastBatchSize,
    lastBatchResults: rotation.lastBatchResults,
    lastRunDurationMinutes: rotation.lastRunDurationMinutes,
    ...overrides,
  };
}

function effectiveIntervalHours(rotation) {
  return rotation.phase === 'refresh'
    ? rotation.refreshIntervalHours
    : rotation.initialIntervalHours;
}

function resolvePhaseTransition(rotation, catalogLength, currentIndex, initialDeptsProcessed) {
  if (rotation.phase !== 'initial') {
    const wrapped = currentIndex === 0 && rotation.nextDeptIndex > 0;
    return {
      phase: 'refresh',
      refreshCycle: wrapped ? rotation.refreshCycle + 1 : rotation.refreshCycle,
      initialStartIndex: rotation.initialStartIndex,
      initialDeptsProcessed: rotation.initialDeptsProcessed,
      completedInitialAt: rotation.completedInitialAt,
    };
  }

  const startIndex = rotation.initialStartIndex ?? rotation.nextDeptIndex;
  const fullLoopDone = initialDeptsProcessed >= catalogLength
    || (initialDeptsProcessed > 0 && currentIndex === startIndex);

  if (fullLoopDone) {
    return {
      phase: 'refresh',
      refreshCycle: 0,
      initialStartIndex: startIndex,
      initialDeptsProcessed: catalogLength,
      completedInitialAt: rotation.completedInitialAt ?? new Date().toISOString(),
    };
  }

  return {
    phase: 'initial',
    refreshCycle: 0,
    initialStartIndex: startIndex,
    initialDeptsProcessed,
    completedInitialAt: null,
  };
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

function resolveBatchCap(rotation, cliBatch) {
  let requested = cliBatch;
  if (!requested && process.env.NIGHTLY_BATCH_SIZE) {
    requested = Number(process.env.NIGHTLY_BATCH_SIZE);
  }
  if (!requested) {
    requested = rotation.phase === 'initial'
      ? rotation.initialBatchSize
      : rotation.refreshBatchSize;
  }
  return adaptiveBatchSize(requested, rotation);
}

function estimateForMode(mode, deptCode, rotation) {
  if (mode === 'skip_empty') return skipEmptyMinutes();
  if (mode === 'light') return syncOnlyMinutes();
  if (mode === 'medium') return mediumRefreshMinutes();
  return getDeptEstimateMinutes(deptCode, rotation);
}

async function runBdnbSetupOnce(bdnbReady, dept) {
  if (bdnbReady.value || process.env.BDNB_SETUP === '0') return;
  console.log('[nightly] Setup BDNB…');
  await runNodeScript('src/scripts/bdnbSetup.js', {
    DEPARTEMENTS: dept.code,
    REGION_LABEL: dept.region_label,
    BDNB_SETUP_SKIP_DOWNLOAD: process.env.SKIP_BDNB_DOWNLOAD === '1' ? '1' : (process.env.BDNB_SETUP_SKIP_DOWNLOAD ?? ''),
  });
  bdnbReady.value = true;
}

async function runMediumRefresh(dept, csvRel) {
  await runNodeScript('src/scripts/reexportEconomics.js', {
    DEPARTEMENTS: dept.code,
    OUTPUT_FILE: csvRel,
    RESET_CHECKPOINT: '0',
  });
}

async function runFullPipeline(dept, csvRel) {
  await runNodeScript('src/index.js', {
    DEPARTEMENTS: dept.code,
    REGION_LABEL: dept.region_label,
    OUTPUT_FILE: csvRel,
    RESET_CHECKPOINT: '1',
    BDNB_LOCAL_ONLY: process.env.BDNB_LOCAL_ONLY ?? '1',
  });
}

async function syncDepartment(dept, csvAbs) {
  return syncCsvToSupabase({
    file: csvAbs,
    regionLabel: dept.region_label,
    department: dept.code,
    skipIfEmpty: true,
    gitCommit: process.env.GITHUB_SHA,
  });
}

async function processDepartmentEntry(entry, ctx) {
  const { dept, reason } = entry;
  const { rotation, jobsByCode, bdnbReady, timeBudget, isRefresh } = ctx;
  const csvRel = departmentCsvPath(dept.code);
  const csvAbs = path.join(root, csvRel);
  const job = jobsByCode.get(dept.code);
  const csvValidation = await validateCsv(csvAbs);
  const started = Date.now();

  console.log(`\n[nightly] ── ${dept.code} (${dept.label}) — ${dept.region_label} [${reason}]`);

  if (!isRefresh && rotation.skipExistingCsvInInitial && csvValidation.ok && !csvValidation.empty) {
    console.log(`[nightly] Skip ${dept.code} — CSV déjà présent (${csvValidation.rowCount} ligne(s))`);
    return {
      code: dept.code,
      index: entry.index,
      status: 'skipped',
      rowCount: csvValidation.rowCount,
      durationMinutes: (Date.now() - started) / 60_000,
      mode: 'skip_csv',
    };
  }

  if (process.env.SKIP_PIPELINE === '1') {
    return {
      code: dept.code,
      index: entry.index,
      status: csvValidation.empty ? 'empty' : 'done',
      rowCount: csvValidation.rowCount,
      durationMinutes: (Date.now() - started) / 60_000,
      mode: 'dry',
    };
  }

  let mode = 'full';
  let modeReason = 'initial';

  if (isRefresh) {
    const resolved = await resolveRefreshMode(dept, { job, csvValidation, rotation });
    mode = resolved.mode;
    modeReason = resolved.reason;
    console.log(`[nightly] Mode refresh: ${mode} (${modeReason})`);
  }

  if (mode === 'skip_empty') {
    return {
      code: dept.code,
      index: entry.index,
      status: 'skipped_empty',
      rowCount: 0,
      durationMinutes: skipEmptyMinutes(),
      mode,
    };
  }

  if (mode === 'light') {
    if (csvValidation.missing || csvValidation.empty) {
      mode = 'full';
    } else if (process.env.SKIP_SYNC !== '1') {
      await syncDepartment(dept, csvAbs);
      return {
        code: dept.code,
        index: entry.index,
        status: 'synced',
        rowCount: csvValidation.rowCount,
        durationMinutes: (Date.now() - started) / 60_000,
        mode: 'light',
      };
    }
  }

  if (mode === 'medium') {
    try {
      await runMediumRefresh(dept, csvRel);
      if (process.env.SKIP_SYNC !== '1' && timeBudget.canStartDepartment(3)) {
        await syncDepartment(dept, csvAbs);
      }
      const after = await validateCsv(csvAbs);
      return {
        code: dept.code,
        index: entry.index,
        status: 'refreshed',
        rowCount: after.rowCount,
        durationMinutes: (Date.now() - started) / 60_000,
        mode: 'medium',
      };
    } catch (err) {
      console.warn(`[nightly] Medium échoué (${err.message}) — fallback full`);
      mode = 'full';
    }
  }

  await runBdnbSetupOnce(bdnbReady, dept);
  console.log('[nightly] Pipeline complet…');
  await runFullPipeline(dept, csvRel);

  const validation = await validateCsv(csvAbs);
  const status = validation.empty ? 'empty' : (isRefresh ? 'refreshed' : 'done');

  if (!validation.missing && process.env.SKIP_SYNC !== '1') {
    if (!timeBudget.canStartDepartment(3)) {
      console.warn('[nightly] Sync ignoré — budget temps');
    } else {
      await syncDepartment(dept, csvAbs);
    }
  }

  return {
    code: dept.code,
    index: entry.index,
    status,
    rowCount: validation.rowCount,
    durationMinutes: (Date.now() - started) / 60_000,
    mode: 'full',
  };
}

async function main() {
  const catalog = buildFranceCatalog();
  let rotation = await readRotation();
  const isRefresh = rotation.phase === 'refresh';

  if (rotation.phase === 'initial' && rotation.initialStartIndex == null) {
    rotation = { ...rotation, initialStartIndex: rotation.nextDeptIndex };
  }

  const maxRuntimeMinutes = resolveMaxRuntimeMinutes(rotation, rotation.phase);
  const timeBudget = createTimeBudget(maxRuntimeMinutes);
  const monthlyBudget = readMonthlyBudget(rotation);
  const disk = await checkDiskSpace(Number(process.env.NIGHTLY_MIN_DISK_MB ?? 2048));
  const batchCap = resolveBatchCap(rotation, parseArg('--batch'));
  const hardCap = capBatchSize(batchCap, rotation);

  console.log(formatLimitSummary({ maxRuntimeMinutes, batchSize: `≤${hardCap} (temps)`, budget: monthlyBudget, disk }));

  if (!disk.ok) {
    await writeRotation(buildRotationPayload(rotation, {
      lastRunAt: new Date().toISOString(),
      lastStatus: 'skipped_disk',
      lastError: disk.message,
    }));
    console.error(`[limits] ${disk.message}`);
    process.exit(0);
  }

  if (!FORCE && monthlyBudget.shouldSkipRun(rotation.phase)) {
    console.log(`[limits] Skip (phase initial) — budget minutes ${monthlyBudget.estimatedMinutes}/${monthlyBudget.limitMinutes}`);
    process.exit(0);
  }

  if (!FORCE && monthlyBudget.isOverBudget() && isRefresh) {
    console.warn('[limits] Budget minutes dépassé — refresh maintenu');
  }

  const intervalH = effectiveIntervalHours(rotation);
  if (!FORCE && rotation.lastRunAt) {
    const elapsed = Date.now() - Date.parse(rotation.lastRunAt);
    if (elapsed < intervalH * 3_600_000) {
      const hoursLeft = ((intervalH * 3_600_000 - elapsed) / 3_600_000).toFixed(1);
      console.log(`[nightly] Skip — prochain run dans ~${hoursLeft} h (${intervalH}h, phase=${rotation.phase})`);
      process.exit(0);
    }
  }

  const pipelineJobs = await fetchPipelineJobs();
  const jobsByCode = new Map(pipelineJobs.map((j) => [j.department_code, j]));

  const queue = isRefresh
    ? buildRefreshQueue(catalog, pipelineJobs)
    : buildInitialQueue(catalog, rotation);

  const bdnbReady = { value: false };
  const results = [];
  const durationUpdates = {};
  let processed = 0;
  let stoppedEarly = false;
  let stopReason = null;
  let currentIndex = rotation.nextDeptIndex;
  let initialDeptsProcessed = rotation.initialDeptsProcessed;

  const persistState = async (status, extra = {}) => {
    const last = results.at(-1);
    const elapsed = timeBudget.elapsedMinutes();
    const phaseUpdate = resolvePhaseTransition(rotation, catalog.length, currentIndex, initialDeptsProcessed);

    if (phaseUpdate.phase === 'refresh' && rotation.phase === 'initial') {
      console.log('[nightly] ✓ Couverture initiale terminée — maintenance continue');
    }
    if (phaseUpdate.refreshCycle > rotation.refreshCycle && rotation.phase === 'refresh') {
      console.log(`[nightly] ✓ Tour de France #${phaseUpdate.refreshCycle} terminé`);
    }

    await writeRotation(buildRotationPayload(rotation, {
      ...phaseUpdate,
      nextDeptIndex: currentIndex,
      deptDurations: mergeDeptDurations(rotation, durationUpdates),
      lastRunAt: new Date().toISOString(),
      lastDepartment: last?.code ?? rotation.lastDepartment,
      lastStatus: status,
      lastRowCount: last?.rowCount ?? rotation.lastRowCount ?? 0,
      lastBatchSize: processed,
      lastBatchResults: results,
      lastRunDurationMinutes: Math.round(elapsed * 10) / 10,
      monthlyBudget: applyMonthlyBudgetAfterRun(monthlyBudget, elapsed),
      ...extra,
    }));
  };

  onRunnerTermination(async () => {
    stoppedEarly = true;
    stopReason = 'timeout';
    await persistState('timeout', { lastError: 'SIGTERM runner GitHub Actions' });
  });

  const phaseLabel = isRefresh ? `refresh · cycle ${rotation.refreshCycle + 1}` : 'initial';
  console.log(`[nightly] Phase ${phaseLabel} — batch temps-réel (cap ${hardCap} dept)`);

  for (const entry of queue) {
    if (processed >= hardCap) break;

    const job = jobsByCode.get(entry.dept.code);
    const csvValidation = await validateCsv(path.join(root, departmentCsvPath(entry.dept.code)));
    const plannedMode = isRefresh
      ? (await resolveRefreshMode(entry.dept, { job, csvValidation, rotation })).mode
      : (csvValidation.ok && !csvValidation.empty && rotation.skipExistingCsvInInitial ? 'skip_csv' : 'full');
    const estimateMin = estimateForMode(plannedMode, entry.dept.code, rotation);

    if (!timeBudget.canStartDepartment(estimateMin)) {
      stoppedEarly = true;
      stopReason = 'partial';
      console.warn(
        `[limits] Budget ${maxRuntimeMinutes} min — stop après ${processed} dept `
        + `(reste ~${timeBudget.remainingMinutes().toFixed(0)} min, besoin ~${estimateMin} min)`,
      );
      break;
    }

    console.log(
      `[nightly] Slot ${processed + 1}+ · ~${timeBudget.remainingMinutes().toFixed(0)} min restantes `
      + `· estimé ${estimateMin} min (${plannedMode})`,
    );

    try {
      const outcome = await processDepartmentEntry(entry, {
        rotation,
        jobsByCode,
        bdnbReady,
        timeBudget,
        isRefresh,
      });
      results.push(outcome);
      durationUpdates[outcome.code] = outcome.durationMinutes;
      currentIndex = (outcome.index + 1) % catalog.length;
      if (rotation.phase === 'initial') initialDeptsProcessed += 1;
      processed += 1;
    } catch (err) {
      await persistState('failed', {
        nextDeptIndex: entry.index,
        lastDepartment: entry.dept.code,
        lastError: err.message,
      });
      console.error(`[nightly] Échec ${entry.dept.code}:`, err.message);
      process.exit(1);
    }
  }

  const finalStatus = stoppedEarly ? stopReason : (isRefresh ? 'refreshed' : 'done');
  await persistState(finalStatus);

  console.log(`\n[nightly] Batch ${stoppedEarly ? `partial (${stopReason})` : 'terminé'} :`);
  for (const r of results) {
    console.log(`  ${r.code} → ${r.status} [${r.mode}] (${r.rowCount ?? 0} lignes, ${r.durationMinutes?.toFixed(1)} min)`);
  }
  console.log(`[nightly] Prochain index: ${currentIndex} (${catalog[currentIndex]?.code})`);
  console.log(`[nightly] Durée: ${timeBudget.elapsedMinutes().toFixed(1)} min · ${processed} dept(s)`);
  process.exit(0);
}

main();
