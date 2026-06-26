import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { setupGracefulShutdown, isShutdownRequested } from './utils/shutdown.js';
import {
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
  getSchoolState,
  recordSchoolOutcome,
  appendResult,
  syncCheckpointStats,
} from './utils/checkpoint.js';
import { clearPersistentCache } from './utils/persistentCache.js';
import { resetAllApiPressure } from './utils/apiClients.js';
import { sleep } from './utils/sleep.js';
import { runPool, createLock } from './utils/concurrency.js';
import { loadEligibleCommunes } from './services/communesService.js';
import { fetchPatrimoineAssets } from './services/patrimoineImportService.js';
import {
  enrichPatrimoineBuilding,
  prefetchBdnbForSchools,
  estimateBdnbCallsPerRnb,
  estimateBdnbCallsForSchools,
  collectRnbIdsFromSchools,
} from './services/buildingsService.js';
import {
  evaluateEetAssetFilter,
  evaluateEetSourcingFilter,
  formatEetFilterLog,
  detectPatrimoineCategory,
  getAssetKey,
  validateEetConfig,
  rowToEetFilterInput,
  filterEetExportRows,
  resolveProprietaireFfoExportFields,
} from './services/patrimoineFilter.js';
import { BdnbQuotaExhaustedError } from './errors/bdnbQuotaError.js';
import { resetBdnbQuotaBlock, loadBdnbQuotaState, isBdnbQuotaBlocked, blockBdnbQuota } from './services/bdnbQuotaState.js';
import { initBdnbLocalStore } from './services/bdnbLocalStore.js';
import { loadArtisansIndex, findBestArtisan, formatTrancheEffectif } from './services/artisansService.js';
import { fetchMairieEmail } from './services/mairiesService.js';
import { evaluateSchoolDpe, isDpeDuplicate, computeProspectionEconomics } from './services/dpeService.js';
import { exportProspectionCsv } from './export/csvExporter.js';
import { generateArgumentaireLoiElan } from './utils/legalText.js';
import { initPrixKwhMoyenTertiaire } from './services/energyPriceService.js';
import { enrichRowWithFinance } from './finance/financeProcessor.js';
import { generateFinancialPackages } from './finance/poolingEngine.js';
import { ensureEpciMapping } from './services/epciMappingService.js';
import { savePopulationCache } from './dashboard/populationCache.js';
import { writePipelineLock, clearPipelineLock } from './dashboard/pipelineStats.js';
import { saveArtisansCache } from './dashboard/artisansCache.js';
import { resolveSchoolCoordinates } from './dashboard/schoolCoordsService.js';
import { attachIndustrialProfile } from './industrial/index.js';
import { appendPipelineLog, appendPipelineProgress } from './utils/pipelineLogBus.js';

const FINAL_OUTCOMES = new Set([
  'exported',
  'filtered',
  'filtered_dpe',
  'dpe_duplicate',
  'no_artisan',
  'no_rnb',
  'fatal_error',
]);

async function processPatrimoineAsset(asset, artisans) {
  const eetCheck = evaluateEetAssetFilter(asset);
  if (!eetCheck.pass) {
    return {
      outcome: 'filtered',
      school: asset,
      enrichment: {
        reason: eetCheck.reason,
        eetDetail: eetCheck.detail,
        eetFilter: eetCheck.reason === 'blacklist' || Boolean(eetCheck.reason?.startsWith('proprietaire')),
      },
    };
  }

  const enrichment = await enrichPatrimoineBuilding(asset);

  if (enrichment.status === 'api_error') {
    return { outcome: 'api_error', school: asset, enrichment };
  }

  if (enrichment.status === 'no_rnb') {
    return { outcome: 'no_rnb', school: asset };
  }

  if (enrichment.status !== 'ok') {
    return {
      outcome: 'filtered',
      school: asset,
      enrichment: {
        ...enrichment,
        reason: enrichment.reason ?? enrichment.status,
        eetDetail: enrichment.eetDetail,
        eetFilter: enrichment.reason?.startsWith('proprietaire') ?? false,
      },
    };
  }

  const { building } = enrichment;
  const dpeEvaluation = await evaluateSchoolDpe(asset);

  if (dpeEvaluation.shouldExclude) {
    return {
      outcome: 'filtered_dpe',
      school: asset,
      building,
      dpe: dpeEvaluation.dpe,
      excludeReason: dpeEvaluation.excludeReason,
    };
  }

  const artisan = findBestArtisan(asset, artisans, building.surfaceM2);

  if (!artisan) {
    return { outcome: 'no_artisan', school: asset, building, dpe: dpeEvaluation.dpe };
  }

  let emailMairie = '';
  try {
    emailMairie = await fetchMairieEmail(asset.code_commune);
  } catch {
    logger.warn(`  → Email mairie indisponible pour ${asset.code_commune}`);
  }

  const nomBatiment = asset.appellation_officielle ?? asset.denomination_principale;
  const typePatrimoine = asset.typePatrimoine ?? detectPatrimoineCategory(nomBatiment, asset.adresse_uai);
  const landOwner = enrichment.landOwner ?? asset.bdnbLandOwner ?? null;
  const ffoFields = resolveProprietaireFfoExportFields(
    { ...asset, Code_UAI: asset.numero_uai },
    landOwner,
  );
  const draftRow = {
    Code_UAI: asset.numero_uai,
    Nom_Ecole: nomBatiment,
    Type_Patrimoine: typePatrimoine,
    Commune: asset.libelle_commune,
    Surface_M2: building.surfaceM2,
    source: asset.source,
    _bdnbLandOwner: landOwner,
    ...ffoFields,
  };
  const exportGate = evaluateEetSourcingFilter(rowToEetFilterInput(draftRow));
  if (!exportGate.pass) {
    return {
      outcome: 'filtered',
      school: asset,
      building,
      enrichment: {
        reason: exportGate.reason,
        eetDetail: exportGate.detail,
        eetFilter: true,
      },
    };
  }

  const economics = computeProspectionEconomics(building.surfaceM2, dpeEvaluation.dpe);
  const classeDpe = dpeEvaluation.dpe?.grade ?? 'Estimé';
  const effectif = formatTrancheEffectif(artisan.trancheEffectif);

  return {
    outcome: 'exported',
    row: attachIndustrialProfile({
      Code_UAI: asset.numero_uai,
      Code_INSEE: asset.code_commune,
      Nom_Ecole: nomBatiment,
      Type_Patrimoine: typePatrimoine,
      Commune: asset.libelle_commune,
      Surface_M2: building.surfaceM2,
      Annee_Construction: building.anneeConstruction,
      Statut_DPE: dpeEvaluation.dpe?.statutDpe ?? 'Absent',
      Annee_DPE: dpeEvaluation.dpe?.anneeDpe ?? '',
      Classe_DPE: classeDpe,
      Conso_Annuelle_kWh: economics.consoAnnuelleKwh,
      Conso_Specifique_kWh_M2: economics.consoSpecifiqueKwhM2 ?? economics.consoDpeM2,
      Facture_Annuelle_Euros: economics.factureAnnuelleEuros,
      Economie_Annuelle_Euros: economics.economieAnnuelleEuros,
      Argumentaire_Loi_ELAN: generateArgumentaireLoiElan(nomBatiment, building.surfaceM2),
      Email_Mairie: emailMairie,
      Latitude: asset.latitude,
      Longitude: asset.longitude,
      Artisan_Nom: artisan.nom,
      Artisan_SIRET: artisan.siret ?? '',
      Artisan_Latitude: artisan.latitude,
      Artisan_Longitude: artisan.longitude,
      Artisan_Distance_KM: artisan.distanceKm,
      Artisan_Email: artisan.email,
      Artisan_Tranche_Effectif: effectif.code,
      Artisan_Effectif_Label: effectif.label,
      Artisan_Effectif_Min: effectif.min,
      ...ffoFields,
      _bdnbLandOwner: landOwner,
      _numero_dpe: dpeEvaluation.dpe?.numeroDpe ?? null,
    }),
    building,
    artisan,
    dpe: dpeEvaluation.dpe,
  };
}

function shouldProcessInMainPass(checkpoint, uai) {
  const state = getSchoolState(checkpoint, uai);
  if (!state) {
    return true;
  }
  return !FINAL_OUTCOMES.has(state.outcome) && state.outcome !== 'api_error' && state.outcome !== 'error';
}

function getRetryCandidates(checkpoint, schools) {
  return schools.filter((school) => {
    const state = getSchoolState(checkpoint, school.numero_uai);
    if (!state) {
      return false;
    }
    if (state.outcome !== 'api_error' && state.outcome !== 'error') {
      return false;
    }
    return (state.retries ?? 0) < config.maxApiRetryPasses;
  });
}

function logOutcome(processed) {
  switch (processed.outcome) {
    case 'api_error':
      logger.warn(`  → Reportée (API BDNB — retry automatique)`);
      break;
    case 'filtered':
    case 'no_rnb':
      if (
        processed.enrichment?.eetFilter
        || processed.enrichment?.reason === 'blacklist'
        || processed.enrichment?.reason?.startsWith('proprietaire')
      ) {
        logger.info(`  → ${formatEetFilterLog({
          pass: false,
          reason: processed.enrichment.reason,
          detail: processed.enrichment.eetDetail,
        })}`);
      } else if (processed.enrichment?.reason === 'decret_tertiaire_surface') {
        logger.info(
          `  → ${formatEetFilterLog({
            pass: false,
            reason: 'surface_insuffisante',
            detail: processed.enrichment.eetDetail
              ?? `Surface finale ${processed.enrichment.building?.surfaceM2 ?? '?'} m² < ${config.eet.eligibleSurfaceMin} m²`,
          })}`,
        );
      } else {
        logger.info(`  → Écarté (filtre passoire thermique / année de construction)`);
      }
      break;
    case 'filtered_dpe':
      if (processed.excludeReason === 'grade_abc') {
        logger.info(
          `  → Écartée (DPE classe ${processed.dpe?.grade ?? 'A/B/C'} — travaux déjà réalisés)`,
        );
      } else {
        logger.info(
          `  → Écartée (DPE récent performant : ${processed.dpe?.statutDpe ?? 'N/A'} — rénovation existante)`,
        );
      }
      break;
    case 'dpe_duplicate':
      logger.info(
        `  → Écartée (doublon DPE ${processed.dpe?.numeroDpe ?? 'N/A'} déjà associé à une autre école)`,
      );
      break;
    case 'no_artisan':
      logger.warn(`  → Aucun artisan RGE éligible (< ${config.artisanRayonKm} km, capacité chantier adaptée)`);
      break;
    case 'exported':
      logger.success(
        `  → Artisan : ${processed.artisan.nom} (${processed.artisan.distanceKm} km, score ${processed.artisan.matchScore ?? '—'}, tranche ${processed.artisan.trancheEffectif}) · ${processed.row?.Type_Travaux ?? ''} · ${processed.row?.Periode_Ideale_Chantier ?? ''}`,
      );
      break;
    default:
      break;
  }
}

function emitCheckpointProgress(checkpoint) {
  syncCheckpointStats(checkpoint);
  appendPipelineProgress(checkpoint.stats);
}

async function applyProcessed(checkpoint, processed, populationByInsee) {
  const uai = processed.school?.numero_uai ?? processed.row?.Code_UAI;
  const previous = getSchoolState(checkpoint, uai);

  if (processed.outcome === 'exported') {
    const numeroDpe = processed.row?._numero_dpe ?? processed.dpe?.numeroDpe ?? null;
    if (isDpeDuplicate(checkpoint, numeroDpe)) {
      recordSchoolOutcome(checkpoint, uai, { outcome: 'dpe_duplicate' });
      return { outcome: 'dpe_duplicate', school: processed.school, dpe: processed.dpe };
    }

    const financialRow = enrichRowWithFinance(
      attachIndustrialProfile(processed.row),
      populationByInsee,
    );
    recordSchoolOutcome(checkpoint, uai, { outcome: 'exported' });
    const appended = appendResult(checkpoint, financialRow);
    if (!appended) {
      recordSchoolOutcome(checkpoint, uai, { outcome: 'filtered', filterReason: 'eet_export_gate' });
      logger.warn(`  → ${formatEetFilterLog({ pass: false, detail: 'gate EET export (checkpoint/CSV)' })} — ${uai}`);
      return { outcome: 'filtered', school: processed.school, enrichment: { reason: 'eet_export_gate', eetFilter: true } };
    }
    await exportProspectionCsv(checkpoint.results, config.outputFile);
    return { ...processed, row: financialRow };
  }

  if (processed.outcome === 'api_error' || processed.outcome === 'error') {
    recordSchoolOutcome(checkpoint, uai, {
      outcome: processed.outcome,
      retries: (previous?.retries ?? 0) + 1,
    });
    return processed;
  }

  recordSchoolOutcome(checkpoint, uai, { outcome: processed.outcome });
  return processed;
}

async function runPatrimoineBatch(assets, artisans, checkpoint, populationByInsee, { labelPrefix = '' } = {}) {
  const withCheckpointLock = createLock();
  let schoolsSinceSave = 0;

  async function maybeSaveCheckpoint(force = false) {
    schoolsSinceSave += 1;
    if (force || schoolsSinceSave >= config.checkpointSaveEvery) {
      await saveCheckpoint(checkpoint);
      schoolsSinceSave = 0;
    }
  }

  await runPool(
    assets,
    async (asset, index) => {
      if (isShutdownRequested()) {
        return;
      }

      const assetLabel = `${asset.appellation_officielle ?? asset.denomination_principale} (${asset.libelle_commune})`;
      logger.step(index + 1, assets.length, `${labelPrefix}${assetLabel} — enrichissement RNB/BDNB/DPE...`);

      let processed;
      try {
        processed = await processPatrimoineAsset(asset, artisans);
      } catch (error) {
        if (error instanceof BdnbQuotaExhaustedError) {
          blockBdnbQuota();
          logger.warn(`Quota BDNB — ${getAssetKey(asset)} reporté en retry`);
          processed = { outcome: 'api_error', school: asset, enrichment: { status: 'api_error', apiErrors: 1 } };
        } else {
          logger.error(`Erreur inattendue pour ${getAssetKey(asset)}`, error);
          processed = { outcome: 'error', school: asset };
        }
      }

      if (processed.outcome === 'exported') {
        logger.success(
          `  → Bâtiment validé (${processed.building.surfaceM2} m², ${processed.building.anneeConstruction}, DPE: ${processed.dpe?.statutDpe ?? 'Absent'})`,
        );
      }

      const finalProcessed = await withCheckpointLock(async () => {
        const applied = await applyProcessed(checkpoint, processed, populationByInsee);
        await maybeSaveCheckpoint(applied.outcome === 'exported');
        emitCheckpointProgress(checkpoint);
        return applied;
      });

      logOutcome(finalProcessed);
    },
    { concurrency: config.schoolConcurrency },
  );

  if (schoolsSinceSave > 0) {
    await saveCheckpoint(checkpoint);
  }

  if (isShutdownRequested()) {
    logger.warn('Arrêt demandé — checkpoint sauvegardé, relancez npm start pour reprendre');
  }
}

async function finalizePortfolioExport(checkpoint, populationByInsee) {
  appendPipelineLog({ level: 'info', message: '[EPCI] Regroupement territorial par Code_EPCI…' });
  const epciMapping = await ensureEpciMapping();
  const { kept } = filterEetExportRows(checkpoint.results);
  checkpoint.results = kept;
  const enriched = checkpoint.results.map((row) =>
    enrichRowWithFinance(attachIndustrialProfile(row), populationByInsee),
  );
  const withCoords = await resolveSchoolCoordinates(enriched);
  checkpoint.results = generateFinancialPackages(withCoords, { log: true, epciMapping });
}

async function exportFinalResults(checkpoint, populationByInsee) {
  await finalizePortfolioExport(checkpoint, populationByInsee);
  await exportProspectionCsv(checkpoint.results, config.outputFile);
}

function computeStats(checkpoint) {
  syncCheckpointStats(checkpoint);
  return checkpoint.stats;
}

async function runSchoolBatchWithBdnbPrefetch(assets, artisans, checkpoint, populationByInsee, options) {
  if (config.bdnb.batchPrefetch && assets.length > 0) {
    await prefetchBdnbForSchools(assets);
  }
  await runPatrimoineBatch(assets, artisans, checkpoint, populationByInsee, options);
}

async function runPipeline({ embedded = false, resetCheckpoint = config.resetCheckpoint } = {}) {
  try {
    if (resetCheckpoint) {
      resetBdnbQuotaBlock();
    } else {
      await loadBdnbQuotaState();
    }

    logger.info('Démarrage du pipeline patrimoine public territorial (Décret Tertiaire + EPCI)');
    validateEetConfig();
    logger.info(`Départements : ${config.departments.join(', ')}`);
    logger.info(
      `Filtre EET — surface min ${config.eet.eligibleSurfaceMin} m², `
      + `${config.eet.eligiblePublicKeywords.length} mots-clés éligibles, `
      + `${config.eet.bannedPublicKeywords.length} mots-clés exclus`,
    );
    logger.info(`Concurrence traitement : ${config.schoolConcurrency} — orchestrateur HTTP actif (token bucket + AIMD + singleflight)`);

    await initPrixKwhMoyenTertiaire();

    if (resetCheckpoint) {
      await clearPersistentCache({ preserveDirs: [config.bdnb.localDir] });
      logger.info(`Cache persistant vidé (${config.cacheDir}/, BDNB local conservé)`);
      await clearCheckpoint();
      const outputPath = path.isAbsolute(config.outputFile)
        ? config.outputFile
        : path.resolve(process.cwd(), config.outputFile);
      try {
        await fs.unlink(outputPath);
        logger.info(`CSV supprimé (${config.outputFile})`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      logger.info('Reprise à zéro — checkpoint et cache effacés');
    } else {
      logger.info('Reprise partielle — écoles déjà traitées conservées');
    }

    const bdnbLocal = await initBdnbLocalStore();
    if (config.bdnb.localOnly) {
      logger.info(`BDNB : mode local uniquement — ${bdnbLocal.totalEntries} RNB indexés (${bdnbLocal.loadedDepts.length} dépt.)`);
      if (bdnbLocal.totalEntries === 0) {
        logger.warn('Aucun index BDNB local — lancez : npm run bdnb:setup');
      }
    } else if (isBdnbQuotaBlocked()) {
      logger.warn('Quota BDNB API épuisé — cache et index local uniquement jusqu\'au reset mensuel');
    } else if (bdnbLocal.totalEntries > 0) {
      logger.info(`BDNB local : ${bdnbLocal.totalEntries} RNB indexés (${bdnbLocal.loadedDepts.length} dépt.)`);
    }

    let checkpoint = await loadCheckpoint(config.departments);
    checkpoint.totalSchools = 0;
    checkpoint.maxApiRetryPasses = config.maxApiRetryPasses;

    const { eligible, inseeCodes, postalCodes } = await loadEligibleCommunes();
    const populationByInsee = new Map(eligible.map((commune) => [commune.code, commune.population]));
    await savePopulationCache(eligible);
    await writePipelineLock();

    if (!embedded) {
      setupGracefulShutdown(async () => {
        finalizePortfolioExport(checkpoint, populationByInsee);
        await saveCheckpoint(checkpoint);
        await exportProspectionCsv(checkpoint.results, config.outputFile);
        await clearPipelineLock();
      });
    }

    const patrimoineAssets = await fetchPatrimoineAssets(inseeCodes, eligible);
    checkpoint.totalSchools = patrimoineAssets.length;
    emitCheckpointProgress(checkpoint);
    const artisans = await loadArtisansIndex(postalCodes);
    await saveArtisansCache(artisans);

    const mainBatch = patrimoineAssets.filter((asset) => shouldProcessInMainPass(checkpoint, asset.numero_uai));
    logger.info(`${mainBatch.length}/${patrimoineAssets.length} bâtiments à traiter (checkpoint + reprise)`);
    const rnbInEducation = collectRnbIdsFromSchools(mainBatch);
    const estBdnbCalls = estimateBdnbCallsForSchools(mainBatch.length, rnbInEducation.length);
    if (config.bdnb.apiToken) {
      logger.info(`BDNB : clé API configurée (Open Plus / Expert — en-tête X-Gravitee-Api-Key)`);
    } else {
      logger.warn(
        `BDNB : mode Open sans clé — quota 10 000 req/mois, ~${Math.ceil(estBdnbCalls)} appels estimés (~${estimateBdnbCallsPerRnb()}/RNB). `
        + 'Si 429 persistant : quota mensuel épuisé ou demander une clé sur https://api-portail.bdnb.io/',
      );
    }

    try {
      await runSchoolBatchWithBdnbPrefetch(mainBatch, artisans, checkpoint, populationByInsee, {
        labelPrefix: '',
      });

      for (let pass = 0; pass < config.maxApiRetryPasses; pass += 1) {
        if (isShutdownRequested()) {
          break;
        }

        const retryBatch = getRetryCandidates(checkpoint, patrimoineAssets);
        if (retryBatch.length === 0) {
          break;
        }

        const cooldownSec = config.apiRetryCooldownsSec[pass] ?? config.apiRetryCooldownsSec.at(-1) ?? 60;
        logger.info('—'.repeat(60));
        logger.info(
          `Passe retry ${pass + 1}/${config.maxApiRetryPasses} : ${retryBatch.length} bâtiments — pause BDNB ${cooldownSec}s`,
        );
        resetAllApiPressure();
        await sleep(cooldownSec * 1000);

        await runSchoolBatchWithBdnbPrefetch(retryBatch, artisans, checkpoint, populationByInsee, {
          labelPrefix: `[retry ${pass + 1}] `,
        });
      }
    } catch (error) {
      if (error instanceof BdnbQuotaExhaustedError) {
        await saveCheckpoint(checkpoint);
        emitCheckpointProgress(checkpoint);
        logger.error(error.message);
        logger.warn('Pipeline interrompu — quota BDNB. Reprise possible après clé API ou reset mensuel.');
        return {
          stats: computeStats(checkpoint),
          exported: checkpoint.results.length,
          quotaBlocked: true,
        };
      }
      throw error;
    }

    await exportFinalResults(checkpoint, populationByInsee);
    const stats = computeStats(checkpoint);
    emitCheckpointProgress(checkpoint);

    const soloCount = checkpoint.results.filter((r) => r.Financement_Statut === 'FINANÇABLE_SOLO').length;
    const projetValideCount = new Set(
      checkpoint.results
        .filter((r) => r.Statut_Projet_EPCI === 'PROJET_GLOBAL_VALIDE')
        .map((r) => r.Code_EPCI),
    ).size;
    const packageCount = new Set(
      checkpoint.results.map((r) => r.Package_ID).filter((id) => String(id).startsWith('EPCI-')),
    ).size;

    logger.info('—'.repeat(60));
    logger.success(`Pipeline terminé : ${checkpoint.results.length} lignes exportées → ${config.outputFile}`);
    logger.info(`Bâtiments analysés : ${stats.totalSchools}`);
    logger.info(`Bâtiments exportés : ${stats.exported}`);
    logger.info(`Dossiers FINANÇABLE_SOLO : ${soloCount}`);
    logger.info(`EPCI PROJET_GLOBAL_VALIDE (CAPEX ≥ ${config.finance.minPackagePartFonds.toLocaleString('fr-FR')} €) : ${projetValideCount}`);
    logger.info(`EPCI cartographiés : ${packageCount}`);
    logger.info(`Écoles écartées (bâtiment) : ${stats.filtered}`);
    logger.info(`Écoles écartées (DPE performant / rénové) : ${stats.filteredDpe}`);
    logger.info(`Écoles écartées (doublon DPE) : ${stats.dpeDuplicate}`);
    logger.info(`Écoles sans artisan proche : ${stats.noArtisan}`);
    logger.info(`Écoles non traitées (API) : ${stats.unresolvedApi}`);
    if (stats.pendingRetry > 0) {
      logger.warn(`${stats.pendingRetry} écoles encore en attente — relancez npm start pour continuer`);
    }
    logger.info(`Cache persistant : ${config.cacheDir}/`);

    return {
      stats,
      exported: checkpoint.results.length,
      soloCount,
      packageCount,
      projetValideCount,
    };
  } finally {
    await clearPipelineLock();
  }
}

export { runPipeline };

const isCliEntry =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCliEntry) {
  runPipeline({ embedded: false }).catch(async (error) => {
    await clearPipelineLock();
    logger.error('Échec fatal du pipeline', error);
    process.exit(1);
  });
}
