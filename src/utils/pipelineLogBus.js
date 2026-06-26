const MAX_LOGS = 1000;
const logs = [];
const subscribers = new Set();

export function appendPipelineLog(entry) {
  const log = {
    kind: 'log',
    level: entry.level ?? 'info',
    message: entry.message ?? '',
    ts: entry.ts ?? Date.now(),
  };
  logs.push(log);
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
  for (const fn of subscribers) {
    fn(log);
  }
  return log;
}

export function appendPipelineProgress(stats) {
  const total = stats.totalSchools ?? 0;
  const processed = stats.processed ?? 0;
  const entry = {
    kind: 'progress',
    ts: Date.now(),
    totalSchools: total,
    processed,
    progressPct: total > 0 ? Math.round((processed / total) * 100) : 0,
    exported: stats.exported ?? 0,
    filtered: stats.filtered ?? 0,
    filteredDpe: stats.filteredDpe ?? 0,
    noArtisan: stats.noArtisan ?? 0,
  };
  for (const fn of subscribers) {
    fn(entry);
  }
  return entry;
}

export function getPipelineLogs() {
  return [...logs];
}

export function subscribePipelineLogs(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function clearPipelineLogs() {
  logs.length = 0;
}
