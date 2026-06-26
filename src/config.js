import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const cacheDir = process.env.CACHE_DIR ?? '.cache';

function parseDepartments(value) {
  const raw = (value || '073,074').trim();
  if (/^(all|france|metropole)$/i.test(raw)) {
    return [
      ...Array.from({ length: 95 }, (_, i) => String(i + 1).padStart(3, '0')),
      '2A',
      '2B',
    ];
  }
  if (/^aura$/i.test(raw)) {
    return ['001', '003', '007', '015', '026', '038', '042', '043', '063', '069', '073', '074'];
  }
  return raw
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
}

function parseRetryPasses(value) {
  return (value || '30,60,120,300')
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => !Number.isNaN(v) && v > 0);
}

function parseExcludeGrades(value) {
  return new Set(
    (value || 'A,B,C')
      .split(',')
      .map((grade) => grade.trim().toUpperCase())
      .filter(Boolean),
  );
}

const DEFAULT_ELIGIBLE_PUBLIC_KEYWORDS =
  'ecole,maternelle,elementaire,primaire,scolaire,mairie,hotel de ville,bibliotheque,centre de loisir,accueil de loisir';
const DEFAULT_BANNED_PUBLIC_KEYWORDS =
  'restaurant,restauration,pharmacie,psychologue,psy,macon,kinesitherapeute,agence,banque,auto-ecole,conduite,college,lycee,hopital';

function parseKeywordCsv(value, fallback) {
  const raw = (value ?? fallback ?? '').trim();
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

function parseEligibleSurfaceMin() {
  const raw = process.env.ELIGIBLE_SURFACE_MIN ?? process.env.SURFACE_MIN_M2 ?? 1000;
  const parsed = Number.parseFloat(String(raw).trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
}

function parseLegalFormSet(value, fallback) {
  const raw = (value ?? fallback ?? '').trim();
  if (!raw) {
    return new Set();
  }
  return new Set(
    raw
      .split(',')
      .map((form) => form.trim().toUpperCase())
      .filter(Boolean),
  );
}

const DEFAULT_PUBLIC_OWNER_LEGAL_FORMS = 'COM,CCOM,METROPOLE,CU,CA,CC';
const DEFAULT_PRIVATE_OWNER_LEGAL_FORMS =
  'SCI,SARL,SAS,SA,SNC,SC,SCPI,SCM,SCOP,SCA,SCCP,AUPM,AUPE,AUDP,AUDA,ASS,FON,EARL,GAEC,GFA,GFR,GFO,GAF,STE,SLRL,SAM,SAFR,COAG,GIE,MUT,OPRO,SCEA,SICA';

const eligibleSurfaceMin = parseEligibleSurfaceMin();

function parseBoundedInt(value, fallback, { min = 1, max } = {}) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  const clamped = Math.max(min, parsed);
  return max != null ? Math.min(max, clamped) : clamped;
}

export const config = {
  departments: parseDepartments(process.env.DEPARTEMENTS),
  regionLabel: process.env.REGION_LABEL?.trim() || null,
  populationMin: Number(process.env.POPULATION_MIN ?? 2000),
  populationMax: Number(process.env.POPULATION_MAX ?? 15000),
  anneeConstructionMax: Number(process.env.ANNEE_CONSTRUCTION_MAX ?? 1990),
  surfaceMinM2: eligibleSurfaceMin,
  eet: {
    eligibleSurfaceMin,
    eligiblePublicKeywords: parseKeywordCsv(
      process.env.ELIGIBLE_PUBLIC_KEYWORDS,
      DEFAULT_ELIGIBLE_PUBLIC_KEYWORDS,
    ),
    bannedPublicKeywords: parseKeywordCsv(
      process.env.BANNED_PUBLIC_KEYWORDS,
      DEFAULT_BANNED_PUBLIC_KEYWORDS,
    ),
    publicOwnerLegalForms: parseLegalFormSet(
      process.env.PUBLIC_OWNER_LEGAL_FORMS,
      DEFAULT_PUBLIC_OWNER_LEGAL_FORMS,
    ),
    privateOwnerLegalForms: parseLegalFormSet(
      process.env.PRIVATE_OWNER_LEGAL_FORMS,
      DEFAULT_PRIVATE_OWNER_LEGAL_FORMS,
    ),
    requireLandOwnershipForBdnb: process.env.EET_REQUIRE_LAND_OWNERSHIP !== '0',
  },
  artisanRayonKm: Number(process.env.ARTISAN_RAYON_KM ?? 30),
  minTrancheEffectif: Number(process.env.MIN_TRANCHE_EFFECTIF ?? 11),
  outputFile: process.env.OUTPUT_FILE ?? 'output_prospection.csv',
  blacklistFile: process.env.BLACKLIST_FILE ?? 'data/blacklist.json',
  cacheDir,
  resetCheckpoint: process.env.RESET_CHECKPOINT === '1',
  maxApiRetryPasses: Number(process.env.MAX_API_RETRY_PASSES ?? 4),
  apiRetryCooldownsSec: parseRetryPasses(process.env.API_RETRY_COOLDOWNS_SEC),
  dpe: {
    geoRadiusM: Number(process.env.DPE_GEO_RADIUS_M ?? 200),
    excludeGrades: parseExcludeGrades(process.env.DPE_EXCLUDE_GRADES),
    postYearThreshold: Number(process.env.DPE_POST_YEAR_THRESHOLD ?? 2022),
    lowConsumptionMax: Number(process.env.DPE_LOW_CONSUMPTION_MAX ?? 150),
  },
  cpe: {
    prixKwhMoyenTertiaire: Number(process.env.PRIX_KWH_MOYEN_TERTIAIRE ?? 0.22),
    prixKwhMoyenTertiaireFallback: Number(process.env.PRIX_KWH_MOYEN_TERTIAIRE ?? 0.22),
    objectifGainCpe: Number(process.env.OBJECTIF_GAIN_CPE ?? 0.45),
    tvaCollectivites: Number(process.env.TVA_COLLECTIVITES ?? 0.2),
    prixKwhSource: 'fallback',
    prixKwhPeriod: null,
  },
  delays: {
    education: Number(process.env.DELAY_EDUCATION_MS ?? 250),
    rnb: Number(process.env.DELAY_RNB_MS ?? 300),
    annuaire: Number(process.env.DELAY_ANNUAIRE_MS ?? 200),
    dpe: Number(process.env.DELAY_DPE_MS ?? 200),
    geo: Number(process.env.DELAY_GEO_MS ?? 100),
    ademe: Number(process.env.DELAY_ADEME_MS ?? 200),
    sdes: Number(process.env.DELAY_SDES_MS ?? 300),
  },
  http: {
    maxBackoffMs: Number(process.env.HTTP_MAX_BACKOFF_MS ?? 300_000),
    initialBackoffMs: Number(process.env.HTTP_INITIAL_BACKOFF_MS ?? 2000),
    logEveryAttempts: Number(process.env.HTTP_LOG_EVERY_N_RETRIES ?? 5),
  },
  sirene: {
    minIntervalMs: Number(process.env.DELAY_SIRENE_MS ?? 350),
    maxIntervalMs: Number(process.env.SIRENE_MAX_INTERVAL_MS ?? 8000),
    backoffMultiplier: Number(process.env.SIRENE_BACKOFF_MULTIPLIER ?? 1.4),
    circuitFailureThreshold: Number(process.env.SIRENE_CIRCUIT_FAILURE_THRESHOLD ?? 5),
    circuitCooldownMs: Number(process.env.SIRENE_CIRCUIT_COOLDOWN_MS ?? 30000),
  },
  bdnb: {
    minIntervalMs: Number(process.env.BDNB_MIN_INTERVAL_MS ?? 3000),
    maxIntervalMs: Number(process.env.BDNB_MAX_INTERVAL_MS ?? 15000),
    backoffMultiplier: Number(process.env.BDNB_BACKOFF_MULTIPLIER ?? 1.5),
    recoveryMultiplier: Number(process.env.BDNB_RECOVERY_MULTIPLIER ?? 0.88),
    recoverySuccessThreshold: Number(process.env.BDNB_RECOVERY_SUCCESS_THRESHOLD ?? 15),
    circuitFailureThreshold: Number(process.env.BDNB_CIRCUIT_FAILURE_THRESHOLD ?? 3),
    circuitCooldownMs: Number(process.env.BDNB_CIRCUIT_COOLDOWN_MS ?? 90000),
    apiToken:
      process.env.BDNB_API_TOKEN?.trim()
      || process.env.BDNB_API_KEY?.trim()
      || null,
    /** PostgREST embed : 1 requête/RNB au lieu de 3 (repli auto si refusé) */
    singleRequestEmbed: process.env.BDNB_SINGLE_REQUEST_EMBED !== '0',
    /** Prefetch par lots de N RNB avant le traitement des écoles */
    batchPrefetch: process.env.BDNB_BATCH_PREFETCH !== '0',
    batchSize: parseBoundedInt(process.env.BDNB_BATCH_SIZE, 50, { min: 5, max: 100 }),
    /** Export CSV BDNB (bdnb.io/download) → index via npm run bdnb:build-index */
    localDir: process.env.BDNB_LOCAL_DIR?.trim() || path.join(cacheDir, 'bdnb-local'),
    preferLocal: process.env.BDNB_PREFER_LOCAL !== '0',
    /** 1 = jamais d'appel API BDNB (cache + index local uniquement) */
    localOnly: process.env.BDNB_LOCAL_ONLY === '1',
    millesime: process.env.BDNB_MILLESIME?.trim() || '2026-02-a',
  },
  rnbFromEmail: process.env.RNB_FROM_EMAIL ?? 'contact@example.com',
  maxSchools: Number(process.env.MAX_SCHOOLS ?? 0),
  /** 1 = repli API ADEME DPE si CSV BDNB patrimoine absents (déconseillé si zip local disponible) */
  patrimoineImportDpe: process.env.PATRIMOINE_IMPORT_DPE === '1',
  schoolConcurrency: parseBoundedInt(process.env.SCHOOL_CONCURRENCY, 1, { min: 1, max: 2 }),
  checkpointSaveEvery: parseBoundedInt(process.env.CHECKPOINT_SAVE_EVERY, 5, { min: 1 }),
  rnbCandidatesParallel: parseBoundedInt(process.env.RNB_CANDIDATES_PARALLEL, 1, { min: 1, max: 3 }),
  finance: {
    /** realiste (défaut) | optimiste (legacy cumul DETR+DSIL+FV sur TTC) */
    subsidyStacking: (process.env.SUBSIDY_STACKING ?? 'realiste').trim().toLowerCase(),
    fondsVertRealisticRate: Number(process.env.FONDS_VERT_REALISTIC_RATE ?? 0.3),
    cpeRealisationRate: Number(process.env.CPE_REALISATION_RATE ?? 0.75),
    mgpePerformanceFloor: Number(process.env.MGPE_PERFORMANCE_FLOOR ?? 0.66),
    ceeConsoReferenceKwhM2: Number(process.env.CEE_CONSO_REFERENCE_KWH_M2 ?? 140),
    ceeKwhCumacValorisation: Number(process.env.CEE_KWH_CUMAC_VALORISATION ?? 0.008),
    ceeMaxShareOfCapexHt: Number(process.env.CEE_MAX_SHARE_CAPEX_HT ?? 0.12),
    subsidyThresholdSmall: Number(process.env.SUBSIDY_THRESHOLD_SMALL ?? 5000),
    subsidyThresholdMedium: Number(process.env.SUBSIDY_THRESHOLD_MEDIUM ?? 15000),
    subsidyRateSmall: Number(process.env.SUBSIDY_RATE_SMALL ?? 0.5),
    subsidyRateMedium: Number(process.env.SUBSIDY_RATE_MEDIUM ?? 0.4),
    subsidyRateLarge: Number(process.env.SUBSIDY_RATE_LARGE ?? 0.3),
    maxFondsRoiYearsSolo: Number(process.env.MAX_FONDS_ROI_YEARS_SOLO ?? 12),
    minPartFondsSolo: Number(process.env.MIN_PART_FONDS_SOLO ?? 100000),
    minPackagePartFonds: Number(process.env.MIN_PACKAGE_PART_FONDS ?? 1000000),
    /** Profils fourchette optimiste / pessimiste — coefficients surchargeables par .env */
    scenarios: {
      optimiste: {
        economieRealisationRate: Number(process.env.SCENARIO_OPT_ECO_RATE ?? 0.75),
        subsidyRateOn: 'HT',
        subsidyRate: Number(process.env.SCENARIO_OPT_SUBSIDY_RATE ?? 0.8),
        mgpeInterestRate: Number(process.env.SCENARIO_OPT_MGPE_RATE ?? 0.04),
      },
      pessimiste: {
        economieRealisationRate: Number(process.env.SCENARIO_PES_ECO_RATE ?? 0.55),
        subsidyRateOn: 'TTC',
        subsidyRate: Number(process.env.SCENARIO_PES_SUBSIDY_RATE ?? 0.45),
        mgpeInterestRate: Number(process.env.SCENARIO_PES_MGPE_RATE ?? 0.055),
      },
    },
    /** Recalibrage adaptatif école par école (population, DPE, Type_Travaux) */
    adaptive: {
      ruralPopulationThreshold: Number(process.env.ADAPTIVE_RURAL_POP_THRESHOLD ?? 3500),
      subsidyPessimisteRuralRate: Number(process.env.ADAPTIVE_SUBSIDY_RURAL_RATE ?? 0.65),
      subsidyPessimisteUrbainRate: Number(process.env.ADAPTIVE_SUBSIDY_URBAIN_RATE ?? 0.45),
      subsidyPessimisteDpeFgBonus: Number(process.env.ADAPTIVE_SUBSIDY_DPE_FG_BONUS ?? 0.05),
      ecoPessimisteLourdeRate: Number(process.env.ADAPTIVE_ECO_LOURDE_RATE ?? 0.7),
      ecoPessimisteMoyenneLegereRate: Number(process.env.ADAPTIVE_ECO_MOYENNE_RATE ?? 0.55),
      pacSurdimensionnementSeuilWM2: Number(process.env.ADAPTIVE_PAC_SEUIL_W_M2 ?? 60),
    },
  },
  dashboard: {
    port: Number(process.env.DASHBOARD_PORT ?? 3000),
    commissionRate: Number(process.env.COMMISSION_RATE ?? 0.04),
    autoRefreshSec: Number(process.env.DASHBOARD_AUTO_REFRESH_SEC ?? 30),
    apiToken: process.env.DASHBOARD_API_TOKEN?.trim() || null,
    /** 1 = recalcul finance + regroupement EPCI à chaque chargement ; 0 = fidèle au CSV exporté */
    recomputeFinance: process.env.DASHBOARD_RECOMPUTE_FINANCE === '1',
  },
  epci: {
    /** CSV Code_INSEE, Code_EPCI, Nom_EPCI — sinon cache .cache/insee-epci.json ou geo.api.gouv.fr */
    mappingFile: process.env.EPCI_MAPPING_FILE ?? 'data/insee_epci.csv',
  },
  apis: {
    education:
      'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre',
    rnb: 'https://rnb-api.beta.gouv.fr/api/alpha/buildings',
    bdnb: 'https://api.bdnb.io/v1/bdnb/donnees',
    rge: 'https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines',
    annuaire:
      'https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records',
    geo: 'https://geo.api.gouv.fr',
    sirene: 'https://recherche-entreprises.api.gouv.fr',
    dpeTertiaire: 'https://data.ademe.fr/data-fair/api/v1/datasets/dpe-tertiaire/lines',
    sdesDido: 'https://data.statistiques.developpement-durable.gouv.fr/dido/api',
    sdesIndustrialElectricityRid: '1d1b0e79-0979-4db9-98e6-ec7c0dea68d2',
  },
};

/** Prix kWh tertiaire TTC — initialisé par energyPriceService (SDES) au démarrage pipeline/serveur */
config.getPrixKwhTertiaire = function getPrixKwhTertiaire() {
  return config.cpe.prixKwhMoyenTertiaire;
};
