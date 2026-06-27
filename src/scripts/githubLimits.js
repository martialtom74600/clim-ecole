/**
 * Garde-fous GitHub Actions — une fonction par limitation connue.
 * Voir docs/DEPLOY.md § Limitations GitHub Actions.
 */

const MS_PER_MIN = 60_000;

/** Marge avant timeout job (commit + push + marge SIGTERM). */
export function resolveMaxRuntimeMinutes(rotation, phase = 'initial') {
  if (phase === 'initial') {
    const fromEnv = Number(process.env.NIGHTLY_INITIAL_MAX_RUNTIME_MINUTES);
    if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
    const fromRotation = Number(rotation?.initialMaxRuntimeMinutes);
    if (Number.isFinite(fromRotation) && fromRotation > 0) return fromRotation;
    const runnerTimeout = Number(process.env.GITHUB_RUNNER_TIMEOUT_MINUTES ?? 180);
    return Math.max(15, runnerTimeout - 15);
  }

  const fromEnv = Number(process.env.NIGHTLY_MAX_RUNTIME_MINUTES);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;

  const runnerTimeout = Number(process.env.GITHUB_RUNNER_TIMEOUT_MINUTES ?? 120);
  const buffer = Number(process.env.NIGHTLY_TIMEOUT_BUFFER_MINUTES ?? 15);
  const fromRotation = Number(rotation?.maxRuntimeMinutes);
  if (Number.isFinite(fromRotation) && fromRotation > 0) return fromRotation;

  return Math.max(15, runnerTimeout - buffer);
}

export function createTimeBudget(maxRuntimeMinutes) {
  const startedAt = Date.now();
  const budgetMs = maxRuntimeMinutes * MS_PER_MIN;

  return {
    startedAt,
    budgetMs,
    elapsedMs: () => Date.now() - startedAt,
    remainingMs: () => budgetMs - (Date.now() - startedAt),
    remainingMinutes: () => Math.max(0, (budgetMs - (Date.now() - startedAt)) / MS_PER_MIN),
    isExpired: () => Date.now() - startedAt >= budgetMs,
    /** Temps minimum estimé pour lancer un nouveau département (pipeline + sync). */
    canStartDepartment(estimateMinutes = 20) {
      return (budgetMs - (Date.now() - startedAt)) >= estimateMinutes * MS_PER_MIN;
    },
    elapsedMinutes: () => (Date.now() - startedAt) / MS_PER_MIN,
  };
}

/** Cap dur : ne jamais dépasser ce batch sur runner GHA (évite timeout). */
export function capBatchSize(requested, rotation) {
  const maxCap = Number(process.env.NIGHTLY_MAX_BATCH_SIZE ?? rotation?.maxBatchSize ?? 8);
  const cap = Number.isFinite(maxCap) && maxCap > 0 ? Math.floor(maxCap) : 8;
  return Math.min(requested, cap);
}

/** Budget minutes mensuel (repo privé Free ≈ 2000 min). En phase refresh, on continue quand même. */
export function readMonthlyBudget(rotation) {
  const raw = rotation?.monthlyBudget ?? {};
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

  let estimatedMinutes = Number(raw.estimatedMinutes ?? 0);
  if (raw.month !== monthKey) estimatedMinutes = 0;

  const limit = Number(
    process.env.NIGHTLY_MONTHLY_MINUTES_LIMIT
    ?? raw.limitMinutes
    ?? 800,
  );

  const skipWhenOver = raw.skipWhenOverBudget !== false;
  const skipOnlyInitial = raw.skipOnlyDuringInitial !== false;

  return {
    month: monthKey,
    estimatedMinutes,
    limitMinutes: limit,
    skipWhenOver,
    skipOnlyInitial,
    isOverBudget: () => estimatedMinutes >= limit,
    shouldSkipRun: (phase) => skipWhenOver && isInitialPhase(phase) && skipOnlyInitial && estimatedMinutes >= limit,
    remainingMinutes: () => Math.max(0, limit - estimatedMinutes),
  };
}

function isInitialPhase(phase) {
  return phase === 'initial';
}

export function applyMonthlyBudgetAfterRun(budget, elapsedMinutes) {
  return {
    month: budget.month,
    estimatedMinutes: Math.round((budget.estimatedMinutes + elapsedMinutes) * 10) / 10,
    limitMinutes: budget.limitMinutes,
    skipWhenOverBudget: budget.skipWhenOver,
    skipOnlyDuringInitial: budget.skipOnlyInitial,
  };
}

/** Espace disque runner (~14 Go utiles). BDNB peut peser plusieurs Go. */
export async function checkDiskSpace(minFreeMb = 2048) {
  if (process.env.SKIP_DISK_CHECK === '1') return { ok: true, freeMb: null };

  try {
    const { execSync } = await import('child_process');
    const out = execSync('df -Pm . | tail -1', { encoding: 'utf8' });
    const parts = out.trim().split(/\s+/);
    const freeMb = Number(parts[3]);
    if (!Number.isFinite(freeMb)) return { ok: true, freeMb: null };
    if (freeMb < minFreeMb) {
      return {
        ok: false,
        freeMb,
        message: `Espace disque insuffisant : ${freeMb} Mo libres (min ${minFreeMb} Mo)`,
      };
    }
    return { ok: true, freeMb };
  } catch {
    return { ok: true, freeMb: null };
  }
}

/** Réduit le batch si la dernière run a été tronquée (timeout/time budget). */
export function adaptiveBatchSize(requested, rotation) {
  let size = capBatchSize(requested, rotation);
  const last = rotation?.lastStatus;
  if (last === 'partial' || last === 'timeout') {
    const reduced = Math.max(1, Math.floor(size / 2));
    console.log(`[limits] Dernière run ${last} — batch réduit ${size} → ${reduced}`);
    size = reduced;
  }
  return size;
}

/** Enregistre SIGTERM (annulation GHA) pour sauvegarder la rotation. */
export function onRunnerTermination(handler) {
  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, () => {
      console.warn(`[limits] Signal ${sig} — arrêt gracieux`);
      Promise.resolve(handler(sig))
        .then(() => process.exit(0))
        .catch((err) => {
          console.error('[limits] Échec sauvegarde:', err.message);
          process.exit(1);
        });
    });
  }
}

export function formatLimitSummary({
  maxRuntimeMinutes,
  batchSize,
  budget,
  disk,
}) {
  const lines = [
    `[limits] Budget temps run : ${maxRuntimeMinutes} min`,
    `[limits] Batch effectif : ${batchSize} dept(s)`,
  ];
  if (budget) {
    lines.push(
      `[limits] Minutes mois ${budget.month} : ${budget.estimatedMinutes}/${budget.limitMinutes}`,
    );
  }
  if (disk?.freeMb != null) {
    lines.push(`[limits] Disque libre : ${disk.freeMb} Mo`);
  }
  return lines.join('\n');
}
