/**
 * Estimation adaptive du temps par département (rolling average).
 */

const DEFAULT_ESTIMATE_MIN = Number(process.env.NIGHTLY_DEPT_ESTIMATE_MINUTES ?? 22);
const MAX_HISTORY = 3;

export function getDeptEstimateMinutes(deptCode, rotation) {
  const history = rotation?.deptDurations?.[deptCode];
  if (Array.isArray(history) && history.length > 0) {
    const sum = history.reduce((a, b) => a + b, 0);
    return Math.max(2, Math.ceil(sum / history.length));
  }
  return DEFAULT_ESTIMATE_MIN;
}

export function recordDeptDuration(rotation, deptCode, minutes) {
  const rounded = Math.round(minutes * 10) / 10;
  const prev = rotation.deptDurations ?? {};
  const history = [...(prev[deptCode] ?? []), rounded].slice(-MAX_HISTORY);
  return { ...prev, [deptCode]: history };
}

export function mergeDeptDurations(rotation, updates) {
  let deptDurations = { ...(rotation.deptDurations ?? {}) };
  for (const [code, minutes] of Object.entries(updates)) {
    deptDurations = recordDeptDuration({ deptDurations }, code, minutes);
  }
  return deptDurations;
}
