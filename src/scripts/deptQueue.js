/**
 * File d'attente départements — priorité initiale + refresh par last_sync_at.
 */
import { INITIAL_PRIORITY_CODES } from '../data/franceDepartments.js';

/** Phase initial : priorité métier puis ordre catalogique depuis nextDeptIndex. */
export function buildInitialQueue(catalog, rotation) {
  const start = rotation.nextDeptIndex ?? 0;
  const seen = new Set();
  const queue = [];

  for (const code of INITIAL_PRIORITY_CODES) {
    const index = catalog.findIndex((d) => d.code === code);
    if (index === -1 || seen.has(code)) continue;
    seen.add(code);
    queue.push({ index, dept: catalog[index], reason: 'priority' });
  }

  for (let i = 0; i < catalog.length; i += 1) {
    const index = (start + i) % catalog.length;
    const dept = catalog[index];
    if (seen.has(dept.code)) continue;
    seen.add(dept.code);
    queue.push({ index, dept, reason: 'sequential' });
  }

  return queue;
}

/** Phase refresh : les plus anciennement synchronisés en premier. */
export function buildRefreshQueue(catalog, jobs) {
  const jobsByCode = new Map((jobs ?? []).map((j) => [j.department_code, j]));

  return catalog
    .map((dept, index) => {
      const job = jobsByCode.get(dept.code);
      return {
        index,
        dept,
        lastSync: job?.last_sync_at ?? null,
        status: job?.status ?? 'pending',
      };
    })
    .sort((a, b) => {
      if (a.status === 'empty' && b.status !== 'empty') return 1;
      if (b.status === 'empty' && a.status !== 'empty') return -1;
      if (!a.lastSync && !b.lastSync) return a.index - b.index;
      if (!a.lastSync) return -1;
      if (!b.lastSync) return 1;
      return Date.parse(a.lastSync) - Date.parse(b.lastSync);
    })
    .map(({ index, dept, lastSync, status }) => ({
      index,
      dept,
      reason: `refresh:${status}:${lastSync ?? 'never'}`,
    }));
}
