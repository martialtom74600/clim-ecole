import express from 'express';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { loadCommuneDossier, loadDashboardData } from './dashboard/dataService.js';
import { buildMapData } from './dashboard/mapDataService.js';
import { loadPipelineStats } from './dashboard/pipelineStats.js';
import { getDepartmentBoundariesGeoJson } from './dashboard/departmentBoundariesService.js';
import { getOrchestratorSnapshot } from './utils/apiClients.js';
import { runPipeline } from './index.js';
import { exportProspectionCsv } from './export/csvExporter.js';
import { generateMgpePdPdfBuffer } from './legal/mgpePdPdf.js';
import { initPrixKwhMoyenTertiaire } from './services/energyPriceService.js';
import { initBdnbLocalStore } from './services/bdnbLocalStore.js';
import { loadBdnbQuotaState, isBdnbQuotaBlocked } from './services/bdnbQuotaState.js';
import {
  appendPipelineLog,
  getPipelineLogs,
  subscribePipelineLogs,
} from './utils/pipelineLogBus.js';
import { addToBlacklist, resolveBlacklistIds } from './utils/blacklistManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = config.dashboard.port;

let isPipelineRunning = false;
const sseClients = new Set();
let bdnbLocalStatus = { loadedDepts: [], totalEntries: 0 };
/** Je mémorise le bootstrap tant que le CSV / checkpoint n'ont pas changé (évite 20+ s à chaque refresh). */
let bootstrapCache = { cacheKey: null, payload: null };

export function clearBootstrapCache() {
  bootstrapCache = { cacheKey: null, payload: null };
}

async function outputCsvMtimeMs() {
  const outputPath = path.isAbsolute(config.outputFile)
    ? config.outputFile
    : path.resolve(process.cwd(), config.outputFile);
  try {
    const stat = await fs.stat(outputPath);
    return stat.mtimeMs;
  } catch {
    return null;
  }
}

async function checkpointUpdatedAtMs() {
  try {
    const stat = await fs.stat(path.join(config.cacheDir, 'checkpoint.json'));
    return stat.mtimeMs;
  } catch {
    return null;
  }
}

async function blacklistMtimeMs() {
  const filePath = path.isAbsolute(config.blacklistFile)
    ? config.blacklistFile
    : path.resolve(process.cwd(), config.blacklistFile);
  try {
    const stat = await fs.stat(filePath);
    return stat.mtimeMs;
  } catch {
    return null;
  }
}

function bootstrapCacheKey(csvMtimeMs, checkpointMtimeMs, blMtimeMs) {
  return `${csvMtimeMs ?? 'no-csv'}:${checkpointMtimeMs ?? 'no-checkpoint'}:${blMtimeMs ?? 'no-bl'}`;
}

function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

function broadcastSse(payload) {
  const data = JSON.stringify(payload);
  for (const res of sseClients) {
    res.write(`data: ${data}\n\n`);
  }
}

function broadcastPipelineStatus() {
  broadcastSse({ type: 'status', running: isPipelineRunning });
}

subscribePipelineLogs((entry) => {
  if (entry.kind === 'progress') {
    broadcastSse({ type: 'progress', ...entry });
    return;
  }
  broadcastSse({ type: 'log', ...entry });
});

function requireDashboardAuth(req, res, next) {
  const token = config.dashboard.apiToken;
  if (!token) {
    return next();
  }
  const auth = req.headers.authorization ?? '';
  if (auth === `Bearer ${token}`) {
    return next();
  }
  res.status(401).json({ error: 'Token API requis (Authorization: Bearer …)' });
}

app.use(securityHeaders);
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'frontend'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
}));

app.get('/api/commune/:codeInsee', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const dossier = await loadCommuneDossier(req.params.codeInsee);
    res.json(dossier);
  } catch (error) {
    res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ error: error.message });
  }
});

app.get('/api/commune/:codeInsee/pdf', async (req, res) => {
  try {
    const dossier = await loadCommuneDossier(req.params.codeInsee);
    const buffer = await generateMgpePdPdfBuffer(dossier);
    const filename = `dossier-mgpe-pd-${req.params.codeInsee}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ error: error.message });
  }
});

app.get('/api/data', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const data = await loadDashboardData();
    res.json(data);
  } catch (error) {
    res.status(error.code === 'ENOENT' ? 404 : 500).json({
      error: error.code === 'ENOENT'
        ? `Fichier CSV introuvable (${config.outputFile}). Lancez d'abord le pipeline.`
        : error.message,
    });
  }
});

app.get('/api/orchestrator/stats', (_req, res) => {
  res.json(getOrchestratorSnapshot());
});

app.get('/api/departements-geojson', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  try {
    const geojson = await getDepartmentBoundariesGeoJson();
    res.json(geojson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bootstrap', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const csvMtimeMs = await outputCsvMtimeMs();
    const checkpointMtimeMs = await checkpointUpdatedAtMs();
    const blMtimeMs = await blacklistMtimeMs();
    const cacheKey = bootstrapCacheKey(csvMtimeMs, checkpointMtimeMs, blMtimeMs);
    if (bootstrapCache.payload && bootstrapCache.cacheKey === cacheKey) {
      res.json(bootstrapCache.payload);
      return;
    }
    const dashboard = await loadDashboardData();
    const map = await buildMapData(config.outputFile, dashboard);
    const payload = { dashboard, map };
    bootstrapCache = { cacheKey, payload };
    res.json(payload);
  } catch (error) {
    res.status(error.code === 'ENOENT' ? 404 : 500).json({
      error: error.code === 'ENOENT'
        ? `Fichier CSV introuvable (${config.outputFile}). Lancez d'abord le pipeline.`
        : error.message,
    });
  }
});

app.get('/api/map', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const data = await buildMapData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'clim-ecole',
    pipelineRunning: isPipelineRunning,
    runAuthRequired: Boolean(config.dashboard.apiToken),
    bdnb: {
      quotaBlocked: isBdnbQuotaBlocked(),
      localOnly: config.bdnb.localOnly,
      preferLocal: config.bdnb.preferLocal,
      localEntries: bdnbLocalStatus.totalEntries,
      localDepts: bdnbLocalStatus.loadedDepts?.length ?? 0,
      localDir: config.bdnb.localDir,
    },
  });
});

app.get('/api/pipeline/status', async (_req, res) => {
  const pipeline = await loadPipelineStats();
  res.json({
    running: isPipelineRunning || Boolean(pipeline?.isRunning),
    pipeline,
  });
});

app.post('/api/blacklist', async (req, res) => {
  try {
    const codeUai = String(req.body?.id ?? req.body?.codeUai ?? '').trim();
    if (!codeUai) {
      return res.status(400).json({ error: 'Identifiant requis (id ou codeUai)' });
    }

    const ids = resolveBlacklistIds({ Code_UAI: codeUai, ...req.body });
    const { added, total } = await addToBlacklist(ids);
    clearBootstrapCache();
    res.status(200).json({ ok: true, added, total, ids: [...new Set([...added, ...ids])] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/export', requireDashboardAuth, async (_req, res) => {
  try {
    const outputPath = path.isAbsolute(config.outputFile)
      ? config.outputFile
      : path.resolve(process.cwd(), config.outputFile);

    try {
      await fs.access(outputPath);
      return res.download(outputPath, path.basename(outputPath));
    } catch {
      /* génération à la volée */
    }

    const data = await loadDashboardData();
    if (!data.schools.length) {
      return res.status(404).json({ error: 'Aucune donnée à exporter' });
    }

    const tmpFile = path.join(os.tmpdir(), `clim-ecole-export-${Date.now()}.csv`);
    await exportProspectionCsv(data.schools, tmpFile);
    res.download(tmpFile, path.basename(outputPath), () => {
      fs.unlink(tmpFile).catch(() => {});
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/run', requireDashboardAuth, (req, res) => {
  if (isPipelineRunning) {
    return res.status(409).json({ error: 'Un chassage est déjà en cours' });
  }

  const mode = req.body?.mode === 'full' ? 'full' : 'resume';
  const resetCheckpoint = mode === 'full';

  isPipelineRunning = true;
  appendPipelineLog({
    level: resetCheckpoint ? 'warn' : 'info',
    message: resetCheckpoint
      ? '🔄 Chassage complet lancé — cache et checkpoint effacés'
      : '▶ Chassage reprise lancé — écoles déjà traitées conservées',
  });
  broadcastPipelineStatus();
  res.status(200).json({ status: 'started', mode });

  runPipeline({ embedded: true, resetCheckpoint })
    .then((result) => {
      appendPipelineLog({
        level: 'success',
        message: `✓ Chassage terminé — ${result.exported} écoles exportées, ${result.packageCount} packages`,
      });
    })
    .catch((error) => {
      appendPipelineLog({ level: 'error', message: `✗ Échec du chassage : ${error.message}` });
    })
    .finally(() => {
      isPipelineRunning = false;
      broadcastPipelineStatus();
    });
});

app.get('/api/stream-logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  for (const log of getPipelineLogs()) {
    if (log.kind === 'progress') {
      broadcastSseToClient(res, { type: 'progress', ...log });
    } else {
      broadcastSseToClient(res, { type: 'log', ...log });
    }
  }
  broadcastSseToClient(res, { type: 'status', running: isPipelineRunning });

  sseClients.add(res);

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

function broadcastSseToClient(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

app.get('/mairie/:codeInsee', (req, res) => {
  res.redirect(301, `/c/${req.params.codeInsee}`);
});

app.get('/c/:insee', (_req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/e/:uai', (_req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/carte', (_req, res) => {
  res.redirect(301, '/');
});

app.get('/dashboard', (_req, res) => {
  res.redirect('/');
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

app.use((error, _req, res, _next) => {
  console.error('[clim-ecole] Erreur serveur', error);
  res.status(500).json({ error: error.message ?? 'Erreur serveur interne' });
});

const server = app.listen(PORT, () => {
  console.log(`[clim-ecole] Application → http://localhost:${PORT}`);
  console.log(`[clim-ecole] Source CSV : ${config.outputFile}`);
  console.log(`[clim-ecole] Prix kWh tertiaire : ${config.getPrixKwhTertiaire()} € (${config.cpe.prixKwhSource})`);
  if (config.dashboard.apiToken) {
    console.log('[clim-ecole] Auth API activée (DASHBOARD_API_TOKEN)');
  }
});

initPrixKwhMoyenTertiaire()
  .then((prix) => {
    console.log(`[clim-ecole] Prix kWh SDES chargé : ${prix} € (${config.cpe.prixKwhSource})`);
  })
  .catch((error) => {
    console.warn(`[clim-ecole] Prix kWh SDES indisponible — fallback ${config.getPrixKwhTertiaire()} €`, error.message);
  });

Promise.all([loadBdnbQuotaState(), initBdnbLocalStore()])
  .then(([, local]) => {
    bdnbLocalStatus = local;
    if (isBdnbQuotaBlocked()) {
      console.warn('[clim-ecole] Quota BDNB API épuisé — cache/index local uniquement');
    }
    if (local.totalEntries > 0) {
      console.log(`[clim-ecole] BDNB local : ${local.totalEntries} RNB (${local.loadedDepts.length} dépt.)`);
    } else if (config.bdnb.localOnly) {
      console.warn('[clim-ecole] BDNB_LOCAL_ONLY=1 sans index — npm run bdnb:build-index');
    }
  })
  .catch((error) => {
    console.warn('[clim-ecole] Init BDNB local', error.message);
  });

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[clim-ecole] Port ${PORT} déjà utilisé.`);
    console.error(`  → L'application tourne peut-être déjà : http://localhost:${PORT}`);
    console.error(`  → Sinon, libérez le port : lsof -i :${PORT} puis kill <PID>`);
    console.error(`  → Ou changez DASHBOARD_PORT dans .env`);
    process.exit(1);
  }
  throw error;
});
