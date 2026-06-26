/** Évite les requêtes dupliquées simultanées (même clé → une seule promesse en vol) */
const inflight = new Map();

export function singleflight(key, fn) {
  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = Promise.resolve()
    .then(fn)
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export function singleflightSize() {
  return inflight.size;
}
