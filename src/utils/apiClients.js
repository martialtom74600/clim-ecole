import { config } from '../config.js';
import { ApiOrchestratorClient } from './apiOrchestrator.js';
import { singleflightSize } from './singleflight.js';

function bdnbHeaders() {
  const token = config.bdnb?.apiToken;
  if (!token) {
    return {};
  }
  // Client officiel bdnb-client (Gravitee) — pas Authorization: Bearer
  return { 'X-Gravitee-Api-Key': token };
}

function makeClient(name, overrides = {}) {
  return new ApiOrchestratorClient(name, overrides);
}

/** Orchestrateur HTTP — une file + token bucket + AIMD + singleflight par API */
export const api = {
  bdnb: makeClient('BDNB', {
    minIntervalMs: config.bdnb.minIntervalMs,
    maxIntervalMs: config.bdnb.maxIntervalMs,
    backoffMultiplier: config.bdnb.backoffMultiplier,
    recoverySuccessThreshold: config.bdnb.recoverySuccessThreshold,
    recoveryMultiplier: config.bdnb.recoveryMultiplier,
    bucketCapacity: 1,
    extraHeaders: bdnbHeaders(),
  }),
  sirene: makeClient('SIRENE', {
    minIntervalMs: config.sirene.minIntervalMs,
    maxIntervalMs: config.sirene.maxIntervalMs ?? 8000,
    backoffMultiplier: config.sirene.backoffMultiplier ?? 1.4,
  }),
  education: makeClient('education.gouv.fr', {
    minIntervalMs: config.delays.education,
    maxIntervalMs: 4000,
    bucketCapacity: 2,
  }),
  geo: makeClient('geo.api.gouv.fr', {
    minIntervalMs: config.delays.geo ?? 100,
    maxIntervalMs: 3000,
    bucketCapacity: 3,
  }),
  rnb: makeClient('RNB', {
    minIntervalMs: config.delays.rnb,
    maxIntervalMs: 5000,
  }),
  dpe: makeClient('DPE ADEME', {
    minIntervalMs: config.delays.dpe,
    maxIntervalMs: 5000,
    bucketCapacity: 2,
  }),
  annuaire: makeClient('annuaire.service-public', {
    minIntervalMs: config.delays.annuaire,
    maxIntervalMs: 4000,
  }),
  ademe: makeClient('ADEME data-fair', {
    minIntervalMs: config.delays.ademe ?? 200,
    maxIntervalMs: 6000,
    bucketCapacity: 2,
  }),
  sdes: makeClient('SDES', {
    minIntervalMs: config.delays.sdes ?? 300,
    maxIntervalMs: 5000,
  }),
  default: makeClient('HTTP', {
    minIntervalMs: 100,
    maxIntervalMs: 4000,
    bucketCapacity: 2,
  }),
};

export async function getBdnbJson(path, { params, label }) {
  const url = `${config.apis.bdnb}${path}`;
  return api.bdnb.getJson(url, {
    params,
    label,
    dedupeKey: `bdnb:${path}:${JSON.stringify(params ?? {})}`,
  });
}

export async function getSireneJson(path, { params, label }) {
  const url = `${config.apis.sirene}${path}`;
  return api.sirene.getJson(url, {
    params,
    label,
    dedupeKey: `sirene:${path}:${JSON.stringify(params ?? {})}`,
  });
}

export function resetBdnbPressure() {
  api.bdnb.resetPressure();
}

export function resetAllApiPressure() {
  for (const client of Object.values(api)) {
    client.resetPressure();
  }
}

export function getOrchestratorSnapshot() {
  return {
    singleflightInflight: singleflightSize(),
    clients: Object.fromEntries(
      Object.entries(api).map(([key, client]) => [key, client.getSnapshot()]),
    ),
    updatedAt: new Date().toISOString(),
  };
}
