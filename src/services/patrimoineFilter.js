import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { isBlacklistedEntry, resolveBlacklistIds } from '../utils/blacklistManager.js';

/** Je normalise le texte pour la recherche sémantique (accents, casse). */
export function normalizeEetText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/** Je concatène nom + adresse + secteur en un seul haystack analysable. */
export function buildEetSemanticHaystack(...parts) {
  return normalizeEetText(parts.filter(Boolean).join(' '));
}

/**
 * Je parse une surface en m² de façon tolérante (nombre, chaîne, espaces, virgule décimale).
 * Retourne null si absent, NaN, négatif ou nul.
 */
export function parseSurfaceM2(value) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  const cleaned = String(value).replace(/\s/g, '').replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function containsKeyword(haystack, keyword) {
  const needle = normalizeEetText(keyword);
  return needle.length > 0 && haystack.includes(needle);
}

/** Je détecte un mot-clé d'exclusion issu de BANNED_PUBLIC_KEYWORDS. */
export function matchesBannedPublicKeyword(haystack) {
  const text = typeof haystack === 'string' ? haystack : buildEetSemanticHaystack(haystack);
  return config.eet.bannedPublicKeywords.some((kw) => containsKeyword(text, kw));
}

/** Je détecte un mot-clé d'inclusion issu de ELIGIBLE_PUBLIC_KEYWORDS (Sweet Spot EET). */
export function matchesEligiblePublicKeyword(haystack) {
  const text = typeof haystack === 'string' ? haystack : buildEetSemanticHaystack(haystack);
  return config.eet.eligiblePublicKeywords.some((kw) => containsKeyword(text, kw));
}

/**
 * Je vérifie la surface au regard du Décret Tertiaire (ELIGIBLE_SURFACE_MIN).
 * Règle absolue : ≥ seuil ou rejet (surface inconnue/nulle incluse).
 */
export function passesEetSurfaceFilter(surfaceM2) {
  const surface = parseSurfaceM2(surfaceM2);
  if (surface == null) {
    return false;
  }
  return surface >= config.eet.eligibleSurfaceMin;
}

/** Je valide la configuration EET au démarrage (fail-fast). */
export function validateEetConfig(eet = config.eet) {
  const errors = [];
  if (!Number.isFinite(eet?.eligibleSurfaceMin) || eet.eligibleSurfaceMin <= 0) {
    errors.push('ELIGIBLE_SURFACE_MIN invalide ou absent');
  }
  if (!Array.isArray(eet?.eligiblePublicKeywords) || eet.eligiblePublicKeywords.length === 0) {
    errors.push('ELIGIBLE_PUBLIC_KEYWORDS vide');
  }
  if (!Array.isArray(eet?.bannedPublicKeywords) || eet.bannedPublicKeywords.length === 0) {
    errors.push('BANNED_PUBLIC_KEYWORDS vide');
  }
  if (!eet?.publicOwnerLegalForms?.size) {
    errors.push('PUBLIC_OWNER_LEGAL_FORMS vide');
  }
  if (!eet?.privateOwnerLegalForms?.size) {
    errors.push('PRIVATE_OWNER_LEGAL_FORMS vide');
  }
  if (errors.length > 0) {
    throw new Error(`Configuration EET invalide : ${errors.join(' ; ')}`);
  }
}

/** Je normalise un enregistrement proprietaire.csv BDNB (FFO / MAJIC open). */
export function normalizeOwnerRecord(row = {}) {
  return {
    personneId: row.personne_id ?? null,
    siren: row.siren ?? null,
    formeJuridique: String(row.forme_juridique ?? '').trim().toUpperCase(),
    denomination: String(row.denomination ?? '').trim(),
    codePostal: row.code_postal ?? null,
    libelleCommune: row.libelle_commune ?? null,
    dansMajicPm: row.dans_majic_pm === '1' || row.dans_majic_pm === true,
  };
}

/** École Education nationale — secteur public certifié par l'API (exception propriété foncière). */
export function isEducationPublicAsset(asset = {}) {
  return asset.source === 'education';
}

export const EDUCATION_FFO_FORME = 'ETAT';
export const EDUCATION_FFO_DENOMINATION = "MINISTERE DE L'EDUCATION NATIONALE";

/** Je déduis la source patrimoine d'une ligne exportée (CSV / checkpoint). */
export function inferExportRowSource(row = {}) {
  if (row.source === 'education' || row.source === 'bdnb-local') {
    return row.source;
  }
  const uai = String(row.Code_UAI ?? '');
  return uai && !uai.startsWith('BDNB-') ? 'education' : 'bdnb-local';
}

/**
 * Colonnes Proprietaire_FFO_* pour l'export CSV et le dashboard.
 * BDNB : forme juridique + dénomination DGFiP (proprietaire.csv).
 * Education : fallback ministériel (secteur Public certifié API).
 */
export function resolveProprietaireFfoExportFields(row = {}, landOwner = null) {
  const source = inferExportRowSource(row);
  if (source === 'education') {
    return {
      Proprietaire_FFO_Forme: EDUCATION_FFO_FORME,
      Proprietaire_FFO_Denomination: EDUCATION_FFO_DENOMINATION,
    };
  }

  const owner = landOwner
    ?? row._bdnbLandOwner
    ?? (row.Proprietaire_FFO_Forme
      ? {
        formeJuridique: row.Proprietaire_FFO_Forme,
        denomination: row.Proprietaire_FFO_Denomination ?? '',
      }
      : null);

  return {
    Proprietaire_FFO_Forme: owner?.formeJuridique ?? '',
    Proprietaire_FFO_Denomination: owner?.denomination ?? '',
  };
}

export function isBdnbPatrimoineAsset(asset = {}) {
  return asset.source === 'bdnb-local'
    || String(asset.numero_uai ?? '').startsWith('BDNB-')
    || Boolean(asset.bdnbGroupId);
}

/** EPA/EPIC : acceptés seulement si la dénomination mentionne une collectivité locale. */
const NATIONAL_PUBLIC_FORMS = new Set(['EPA', 'EPIC']);

/** Anciennes formes publiques hors périmètre territorial (État, département, syndicats, etc.). */
const KNOWN_NON_TERRITORIAL_PUBLIC_FORMS = new Set([
  'COME', 'COLL', 'SCOM', 'ETAT', 'EPA', 'EPIC', 'EPLS', 'EP', 'EE',
  'DEPT', 'REGI', 'SYCO', 'SYMC', 'SYMI', 'SIVU', 'SIVO', 'SDIS',
  'SEM', 'CCAS', 'CIAS', 'BDF', 'INP',
]);

/** Dénomination FFO évoquant une commune ou une communauté de communes. */
export function denominationMentionsCollectiviteLocale(denomination) {
  const text = normalizeEetText(denomination);
  return /commune|communaute/.test(text);
}

/**
 * Je classifie le propriétaire foncier (forme juridique FFO / MAJIC open BDNB).
 * Périmètre strict : collectivités territoriales (COM, CCOM, METROPOLE, CU, CA, CC).
 */
export function classifyLandOwner(owner) {
  if (!owner) {
    return {
      isPublic: false,
      reason: 'proprietaire_absent',
      detail: 'propriétaire foncier FFO/MAJIC introuvable',
    };
  }

  const forme = String(owner.formeJuridique ?? owner.forme_juridique ?? '').trim().toUpperCase();
  const denomination = owner.denomination ?? '';

  if (forme && config.eet.privateOwnerLegalForms.has(forme)) {
    return {
      isPublic: false,
      reason: 'proprietaire_prive',
      detail: `propriétaire privé (${forme} — ${denomination.slice(0, 48) || 'sans libellé'})`,
    };
  }

  if (forme && NATIONAL_PUBLIC_FORMS.has(forme)) {
    if (denominationMentionsCollectiviteLocale(denomination)) {
      return {
        isPublic: true,
        reason: null,
        detail: `collectivité locale (${forme} — ${denomination.slice(0, 48)})`,
      };
    }
    return {
      isPublic: false,
      reason: 'proprietaire_public_non_territorial',
      detail: forme,
    };
  }

  if (forme && config.eet.publicOwnerLegalForms.has(forme)) {
    return {
      isPublic: true,
      reason: null,
      detail: `collectivité territoriale (${forme})`,
    };
  }

  if (forme && KNOWN_NON_TERRITORIAL_PUBLIC_FORMS.has(forme)) {
    return {
      isPublic: false,
      reason: 'proprietaire_public_non_territorial',
      detail: forme,
    };
  }

  if (!forme && denominationMentionsCollectiviteLocale(denomination)) {
    return {
      isPublic: true,
      reason: null,
      detail: `collectivité territoriale (dénomination : ${denomination.slice(0, 48)})`,
    };
  }

  return {
    isPublic: false,
    reason: 'proprietaire_inconnu',
    detail: `forme juridique non territoriale (${forme || 'inconnue'})`,
  };
}

export function evaluateLandOwnershipRecord(owner) {
  const classification = classifyLandOwner(owner);
  if (!classification.isPublic) {
    return {
      pass: false,
      reason: classification.reason,
      detail: classification.detail,
    };
  }
  return { pass: true, reason: null, detail: classification.detail, owner };
}

export function evaluateLandOwnershipForAsset(asset = {}) {
  if (!config.eet.requireLandOwnershipForBdnb) {
    return { pass: true, reason: null };
  }
  if (isEducationPublicAsset(asset)) {
    return { pass: true, reason: null, detail: 'Education nationale — secteur public' };
  }
  if (!isBdnbPatrimoineAsset(asset)) {
    return { pass: true, reason: null };
  }

  const owner = asset.bdnbLandOwner ?? asset.landOwner ?? null;
  if (!owner) {
    return {
      pass: false,
      reason: 'proprietaire_absent',
      detail: 'propriétaire foncier FFO/MAJIC non résolu pour le groupe BDNB',
    };
  }

  return evaluateLandOwnershipRecord(owner);
}

export function assetToEetFilterInput(asset = {}) {
  const surfaceKnown = parseSurfaceM2(asset.bdnbSurfaceM2)
    ?? parseSurfaceM2(asset.dpeSurfaceUtile)
    ?? null;
  return {
    nom: asset.appellation_officielle ?? asset.denomination_principale,
    adresse: asset.adresse_uai,
    secteurActivite: asset.denomination_principale,
    typePatrimoine: asset.typePatrimoine,
    surfaceM2: surfaceKnown,
  };
}

export function rowToEetFilterInput(row = {}) {
  const source = inferExportRowSource(row);
  return {
    nom: row.Nom_Ecole,
    adresse: [row.Adresse, row.Commune].filter(Boolean).join(' ') || row.Commune,
    secteurActivite: row.Type_Patrimoine,
    typePatrimoine: row.Type_Patrimoine,
    surfaceM2: row.Surface_M2,
    source,
    bdnbLandOwner: row._bdnbLandOwner ?? (row.Proprietaire_FFO_Forme
      ? {
        formeJuridique: row.Proprietaire_FFO_Forme,
        denomination: row.Proprietaire_FFO_Denomination ?? '',
      }
      : null),
  };
}

function buildSurfaceRejectionDetail(surfaceM2) {
  const surface = parseSurfaceM2(surfaceM2);
  if (surface == null) {
    return `Surface finale inconnue — seuil Décret Tertiaire ${config.eet.eligibleSurfaceMin} m² requis`;
  }
  return `Surface finale ${surface} m² < ${config.eet.eligibleSurfaceMin} m² (Décret Tertiaire)`;
}

/**
 * Filtre sémantique (import / pré-enrichissement) : exclusion puis inclusion Sweet Spot.
 * La surface est évaluée séparément quand elle est connue.
 */
export function evaluateEetSemanticFilter({ nom, adresse, secteurActivite, typePatrimoine } = {}) {
  const haystack = buildEetSemanticHaystack(nom, adresse, secteurActivite, typePatrimoine);

  if (!haystack.trim()) {
    return { pass: false, reason: 'hors_cible', detail: 'libellé vide', haystack };
  }
  if (matchesBannedPublicKeyword(haystack)) {
    return { pass: false, reason: 'banni', detail: 'mot-clé exclus (BANNED_PUBLIC_KEYWORDS)', haystack };
  }
  if (!matchesEligiblePublicKeyword(haystack)) {
    return { pass: false, reason: 'hors_cible', detail: 'hors Sweet Spot EET (ELIGIBLE_PUBLIC_KEYWORDS)', haystack };
  }
  return { pass: true, reason: null, haystack };
}

/** Barrière prioritaire — blacklist manuelle (UAI / batiment_groupe_id). */
export function evaluateBlacklistFilter(entry = {}) {
  if (!isBlacklistedEntry(entry)) {
    return { pass: true, reason: null };
  }
  const detail = entry.Code_UAI
    ?? entry.numero_uai
    ?? entry.id
    ?? resolveBlacklistIds(entry)[0]
    ?? '—';
  return {
    pass: false,
    reason: 'blacklist',
    detail: String(detail),
  };
}

/** Je filtre un asset patrimonial (blacklist + sémantique + surface si déjà connue à l'import). */
export function evaluateEetAssetFilter(asset) {
  const blacklist = evaluateBlacklistFilter(asset);
  if (!blacklist.pass) {
    return blacklist;
  }

  const input = assetToEetFilterInput(asset);
  const semantic = evaluateEetSemanticFilter(input);
  if (!semantic.pass) {
    return semantic;
  }

  const land = evaluateLandOwnershipForAsset(asset);
  if (!land.pass) {
    return { ...land, haystack: semantic.haystack };
  }

  if (input.surfaceM2 != null && !passesEetSurfaceFilter(input.surfaceM2)) {
    return {
      pass: false,
      reason: 'surface_insuffisante',
      detail: buildSurfaceRejectionDetail(input.surfaceM2),
      haystack: semantic.haystack,
    };
  }
  return { pass: true, reason: null, haystack: semantic.haystack };
}

/** Je filtre un bâtiment ou une ligne exportée (sémantique + propriété publique + surface). */
export function evaluateEetSourcingFilter({
  nom,
  adresse,
  secteurActivite,
  typePatrimoine,
  surfaceM2,
  source,
  bdnbLandOwner,
} = {}) {
  const semantic = evaluateEetSemanticFilter({ nom, adresse, secteurActivite, typePatrimoine });
  if (!semantic.pass) {
    return semantic;
  }

  const land = evaluateLandOwnershipForAsset({
    source,
    bdnbLandOwner,
    numero_uai: source === 'education' ? 'education' : 'BDNB-export',
  });
  if (!land.pass) {
    return { ...land, haystack: semantic.haystack };
  }

  if (!passesEetSurfaceFilter(surfaceM2)) {
    return {
      pass: false,
      reason: 'surface_insuffisante',
      detail: buildSurfaceRejectionDetail(surfaceM2),
      haystack: semantic.haystack,
    };
  }

  return { pass: true, reason: null, haystack: semantic.haystack };
}

/** Gate unique — une ligne CSV/checkpoint est-elle exportable ? */
export function isExportableEetRow(row) {
  const blacklist = evaluateBlacklistFilter(row);
  if (!blacklist.pass) {
    return false;
  }
  return evaluateEetSourcingFilter(rowToEetFilterInput(row)).pass;
}

/**
 * Je filtre un tableau de lignes exportées (checkpoint, CSV, dashboard).
 * Barrière finale anti-corruption.
 */
export function filterEetExportRows(rows, { onReject } = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { kept: [], removed: 0, rejections: [] };
  }

  const kept = [];
  const rejections = [];

  for (const row of rows) {
    const blacklist = evaluateBlacklistFilter(row);
    if (!blacklist.pass) {
      rejections.push({ row, evaluation: blacklist });
      onReject?.(row, blacklist);
      continue;
    }

    const evaluation = evaluateEetSourcingFilter(rowToEetFilterInput(row));
    if (evaluation.pass) {
      kept.push(row);
    } else {
      rejections.push({ row, evaluation });
      onReject?.(row, evaluation);
    }
  }

  return { kept, removed: rejections.length, rejections };
}

export function formatEetFilterLog(evaluation) {
  if (evaluation.pass) {
    return null;
  }
  if (evaluation.reason === 'blacklist') {
    return `[Filtré] - Blacklist manuelle (${evaluation.detail ?? 'écarter'})`;
  }
  if (evaluation.reason === 'proprietaire_public_non_territorial') {
    return `[Filtré] - Propriétaire public non territorial (${evaluation.detail ?? 'EPIC'})`;
  }
  const prefix = evaluation.reason?.startsWith('proprietaire')
    ? '[Filtré] - Propriété foncière non publique'
    : '[Filtré] - Hors-cible ou surface insuffisante';
  return `${prefix} (${evaluation.detail ?? evaluation.reason})`;
}

export function getAssetKey(asset) {
  if (!asset) {
    return 'unknown';
  }
  return (
    asset.assetId
    ?? asset.numero_uai
    ?? `PAT-${asset.code_commune}-${String(asset.appellation_officielle ?? '').slice(0, 48)}`
  );
}

/** Je déduis une catégorie patrimoniale à partir des mots-clés éligibles détectés. */
export function detectPatrimoineCategory(...parts) {
  const text = buildEetSemanticHaystack(...parts);
  if (/(mairie|hotel de ville|hotel-de-ville)/.test(text)) {
    return 'Mairie / Hôtel de ville';
  }
  if (/(bibliotheque|mediatheque)/.test(text)) {
    return 'Bibliothèque';
  }
  if (/(centre de loisir|accueil de loisir|centre de loisirs|accueil de loisirs)/.test(text)) {
    return 'Centre / Accueil de loisirs';
  }
  if (/(maternelle|elementaire|primaire|ecole|scolaire)/.test(text)) {
    return 'Enseignement';
  }
  return 'Patrimoine public communal';
}

/** Alias rétrocompatibles — délèguent au moteur EET dynamique. */
export function matchesPatrimoineKeyword(...parts) {
  const haystack = buildEetSemanticHaystack(...parts);
  return matchesEligiblePublicKeyword(haystack) && !matchesBannedPublicKeyword(haystack);
}

export function isPatrimoineSector(secteurActivite) {
  return evaluateEetSemanticFilter({ secteurActivite }).pass;
}

export function passesDecretTertiaireSurface(surfaceM2) {
  return passesEetSurfaceFilter(surfaceM2);
}

/** Je purge les résultats invalides d'un checkpoint (auto-correction au chargement). */
export function purgeInvalidEetCheckpointResults(checkpoint, { log = true } = {}) {
  if (!checkpoint?.results?.length) {
    return 0;
  }
  const before = checkpoint.results.length;
  const { kept, removed } = filterEetExportRows(checkpoint.results);
  checkpoint.results = kept;
  if (removed > 0 && log) {
    logger.warn(
      `Checkpoint — ${removed} ligne(s) EET invalide(s) purgée(s) (${before} → ${kept.length})`,
    );
  }
  return removed;
}
