import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { readCache, writeCache } from '../utils/persistentCache.js';
import { parseRnbField } from '../utils/parseRnb.js';
import { logger } from '../utils/logger.js';
import { BdnbQuotaExhaustedError } from '../errors/bdnbQuotaError.js';
import { blockBdnbQuota } from './bdnbQuotaState.js';
import {
  fetchBdnbBuildingData,
  prefetchBdnbForSchools,
  estimateBdnbCallsPerRnb,
  estimateBdnbCallsForSchools,
  collectRnbIdsFromSchools,
} from './bdnbApiService.js';
import {
  evaluateLandOwnershipForAsset,
  formatEetFilterLog,
  getAssetKey,
  parseSurfaceM2,
  passesEetSurfaceFilter,
} from './patrimoineFilter.js';
import { resolveGroupLandOwnership } from './bdnbLandOwnershipService.js';

const CACHE_NS = 'bdnb-building';

async function resolveAssetLandOwner(asset) {
  if (asset.bdnbLandOwner) {
    return asset.bdnbLandOwner;
  }
  const groupId = asset.bdnbGroupId ?? asset.building?.groupId ?? null;
  if (!groupId) {
    return null;
  }
  return resolveGroupLandOwnership(groupId, asset.code_departement);
}

async function rejectLandOwnershipFilter(asset) {
  const landOwner = await resolveAssetLandOwner(asset);
  const enrichedAsset = landOwner ? { ...asset, bdnbLandOwner: landOwner } : asset;
  const land = evaluateLandOwnershipForAsset(enrichedAsset);
  if (!land.pass) {
    return {
      status: 'filtered',
      reason: land.reason ?? 'proprietaire_foncier',
      eetDetail: land.detail,
      landOwner,
    };
  }
  return { asset: enrichedAsset, landOwner };
}

async function resolveRnbIdsFromCoordinates(latitude, longitude) {
  const cacheKey = `geo:${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const cached = await readCache(CACHE_NS, cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const data = await api.rnb.getJson(`${config.apis.rnb}/closest/`, {
    params: {
      point: `${latitude},${longitude}`,
      radius: 100,
      from: config.rnbFromEmail,
    },
    label: 'RNB closest',
  });

  const ids = (data.results ?? []).slice(0, 3).map((building) => building.rnb_id);
  await writeCache(CACHE_NS, cacheKey, ids);
  return ids;
}

async function collectBdnbCandidates(asset) {
  let rnbIds = parseRnbField(asset.rnb);

  if (rnbIds.length === 0 && asset.latitude && asset.longitude) {
    rnbIds = await resolveRnbIdsFromCoordinates(asset.latitude, asset.longitude);
  }

  if (rnbIds.length === 0) {
    return { status: 'no_rnb', candidates: [], apiErrors: 0 };
  }

  const deptHint = asset.code_departement ?? asset.code_commune?.slice(0, 2) ?? null;
  const candidates = [];
  let apiErrors = 0;
  const rnbBatch = rnbIds.slice(0, config.rnbCandidatesParallel);

  for (const rnbId of rnbBatch) {
    try {
      const data = await fetchBdnbBuildingData(rnbId, { departementHint: deptHint });
      if (data) {
        candidates.push(data);
      }
    } catch (error) {
      if (error instanceof BdnbQuotaExhaustedError) {
        blockBdnbQuota();
        apiErrors += 1;
        logger.warn(`Quota BDNB — RNB ${rnbId} indisponible (${getAssetKey(asset)})`);
        continue;
      }
      apiErrors += 1;
      logger.warn(`BDNB indisponible pour RNB ${rnbId} (${getAssetKey(asset)})`);
    }
  }

  if (candidates.length === 0 && apiErrors > 0) {
    return { status: 'api_error', candidates: [], apiErrors };
  }

  return { status: 'candidates', candidates, apiErrors };
}

function pickBuildingCandidate(candidates) {
  const eligible = candidates.filter(
    (b) =>
      b.anneeConstruction <= config.anneeConstructionMax
      && passesEetSurfaceFilter(b.surfaceM2),
  );
  if (eligible.length === 0) {
    return null;
  }
  return eligible.sort((a, b) => b.surfaceM2 - a.surfaceM2)[0];
}

function rejectSurfaceFilter(building, candidates) {
  if (!passesEetSurfaceFilter(building.surfaceM2)) {
    return {
      status: 'filtered',
      candidates,
      reason: 'decret_tertiaire_surface',
      building,
      eetDetail: parseSurfaceM2(building.surfaceM2) != null
        ? `Surface finale ${parseSurfaceM2(building.surfaceM2)} m² < ${config.eet.eligibleSurfaceMin} m² (Décret Tertiaire)`
        : `Surface finale inconnue — seuil Décret Tertiaire ${config.eet.eligibleSurfaceMin} m² requis`,
    };
  }
  return null;
}

/**
 * J'enrichis un bâtiment patrimonial via RNB/BDNB avec double verrouillage :
 * Surface finale ≥ ELIGIBLE_SURFACE_MIN ET propriétaire foncier = personne publique (FFO/MAJIC).
 */
export async function enrichPatrimoineBuilding(asset) {
  const landGate = await rejectLandOwnershipFilter(asset);
  if (landGate?.status === 'filtered') {
    logger.info(
      `  → ${formatEetFilterLog({ pass: false, reason: landGate.reason, detail: landGate.eetDetail })} (${getAssetKey(asset)})`,
    );
    return landGate;
  }
  const workingAsset = landGate?.asset ?? asset;

  if (workingAsset.bdnbSurfaceM2 != null && workingAsset.bdnbAnneeConstruction != null) {
    const building = {
      rnbId: workingAsset.rnb,
      groupId: workingAsset.bdnbGroupId,
      surfaceM2: workingAsset.bdnbSurfaceM2,
      anneeConstruction: workingAsset.bdnbAnneeConstruction,
    };
    if (building.anneeConstruction > config.anneeConstructionMax) {
      return { status: 'filtered', candidates: [building], reason: 'annee_construction' };
    }
    const surfaceReject = rejectSurfaceFilter(building, [building]);
    if (surfaceReject) {
      return surfaceReject;
    }
    return { status: 'ok', building, landOwner: workingAsset.bdnbLandOwner };
  }

  const collected = await collectBdnbCandidates(workingAsset);
  if (collected.status === 'no_rnb') {
    return { status: 'no_rnb' };
  }
  if (collected.status === 'api_error') {
    return { status: 'api_error', apiErrors: collected.apiErrors };
  }

  const building = pickBuildingCandidate(collected.candidates);
  if (!building) {
    return { status: 'filtered', candidates: collected.candidates, reason: 'annee_construction' };
  }

  const surfaceReject = rejectSurfaceFilter(building, collected.candidates);
  if (surfaceReject) {
    return surfaceReject;
  }

  const groupLand = await rejectLandOwnershipFilter({
    ...workingAsset,
    bdnbGroupId: building.groupId ?? workingAsset.bdnbGroupId,
  });
  if (groupLand?.status === 'filtered') {
    return groupLand;
  }

  return {
    status: 'ok',
    building,
    landOwner: groupLand?.landOwner ?? workingAsset.bdnbLandOwner,
  };
}

/** @deprecated Alias — préférer enrichPatrimoineBuilding */
export async function enrichSchoolBuilding(school, options = {}) {
  return enrichPatrimoineBuilding(school, options);
}

export {
  prefetchBdnbForSchools,
  estimateBdnbCallsPerRnb,
  estimateBdnbCallsForSchools,
  collectRnbIdsFromSchools,
};
