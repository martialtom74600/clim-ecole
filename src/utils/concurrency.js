/**
 * Exécute des tâches async avec un nombre max de workers parallèles.
 */
export async function runPool(items, worker, { concurrency = 2 } = {}) {
  if (items.length === 0) {
    return [];
  }

  const limit = Math.max(1, concurrency);
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runWorker());
  await Promise.all(workers);
  return results;
}

export function createLock() {
  let chain = Promise.resolve();

  return function withLock(fn) {
    const run = chain.then(fn);
    chain = run.catch(() => {});
    return run;
  };
}
