/**
 * Vérification rapide du dashboard — npm run verify
 */
const BASE = `http://localhost:${process.env.DASHBOARD_PORT ?? 3000}`;

const routes = [
  ['GET', '/api/health'],
  ['GET', '/api/bootstrap'],
  ['GET', '/api/data'],
  ['GET', '/api/map'],
  ['GET', '/api/departements-geojson'],
  ['GET', '/api/pipeline/status'],
  ['GET', '/api/orchestrator/stats'],
  ['GET', '/api/commune/01166'],
  ['GET', '/api/commune/01166/pdf'],
  ['GET', '/assets/app.js'],
];

let failed = 0;

for (const [method, path] of routes) {
  try {
    const res = await fetch(`${BASE}${path}`, { method, signal: AbortSignal.timeout(15000) });
    const ok = res.status >= 200 && res.status < 400;
    if (!ok) {
      const body = await res.text();
      console.error(`✗ ${res.status} ${path}`, body.slice(0, 120));
      failed += 1;
    } else {
      console.log(`✓ ${res.status} ${path}`);
    }
  } catch (error) {
    console.error(`✗ ERR ${path}`, error.message);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} échec(s) — le serveur tourne-t-il ? (npm run dashboard)`);
  process.exit(1);
}

console.log('\nToutes les routes OK');
process.exit(0);
