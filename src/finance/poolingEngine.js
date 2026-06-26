import { appendPipelineLog } from '../utils/pipelineLogBus.js';
import { config } from '../config.js';
import { resolveEpciForInsee, getEpciMappingSync } from '../services/epciMappingService.js';

export const FINANCE_STATUT_A_REGROUPER = 'À_REGROUPER';
export const FINANCE_STATUT_PACK_FINANÇABLE_EPCI = 'PACK_FINANÇABLE_EPCI';
export const STATUT_PROJET_GLOBAL_VALIDE = 'PROJET_GLOBAL_VALIDE';
export const STATUT_SOUS_SEUIL_A_CREUSER = 'SOUS_SEUIL_A_CREUSER';

function packIdFromEpci(codeEpci) {
  const code = String(codeEpci ?? '').trim();
  return code ? `EPCI-${code}` : 'EPCI-INCONNU';
}

function schoolCapex(row) {
  const direct = Number(row.CAPEX_Total ?? row._capexTotal ?? 0);
  if (direct > 0) return direct;
  return (
    (Number(row.Part_Fonds_Euros) || 0) +
    (Number(row.CEE_Euros) || 0) +
    (Number(row.Subventions_Pessimiste_Euros ?? row.Subventions_Etat_Euros) || 0)
  );
}

function schoolGainNetPessimiste(row) {
  return Number(row.Gain_Net_Pessimiste_Euros ?? row.Gain_Net_Annuel_Mairie_Euros ?? 0) || 0;
}

function schoolPartFonds(row) {
  return Number(row.Part_Fonds_Euros ?? 0) || 0;
}

/** Je calcule la synthèse financière d'un pack EPCI (CAPEX cumulé patrimoine + gains nets pessimistes). */
export function computeEpciPackSummary(schools) {
  const packCapexTotal = schools.reduce((sum, row) => sum + schoolCapex(row), 0);
  const packGainNetPessimisteTotal = schools.reduce(
    (sum, row) => sum + schoolGainNetPessimiste(row),
    0,
  );
  const partFondsTotal = schools.reduce((sum, row) => sum + schoolPartFonds(row), 0);
  const seuilCapexEpci = config.finance.minPackagePartFonds;
  return {
    packCapexTotal: Math.round(packCapexTotal),
    packGainNetPessimisteTotal: Math.round(packGainNetPessimisteTotal),
    partFondsTotal: Math.round(partFondsTotal),
    packFinancable: packGainNetPessimisteTotal > 0,
    statutProjetEpci: packCapexTotal >= seuilCapexEpci
      ? STATUT_PROJET_GLOBAL_VALIDE
      : STATUT_SOUS_SEUIL_A_CREUSER,
  };
}

/** Je regroupe les écoles par Code_EPCI et produis les lignes de synthèse pack. */
export function buildEpciGroups(schools, epciMapping = getEpciMappingSync()) {
  const groups = new Map();

  for (const school of schools) {
    const epci = resolveEpciForInsee(school.Code_INSEE, epciMapping);
    const codeEpci = epci.codeEpci || '__INCONNU__';

    if (!groups.has(codeEpci)) {
      groups.set(codeEpci, {
        codeEpci: epci.codeEpci,
        nomEpci: epci.nomEpci || 'EPCI non rattachée',
        schools: [],
      });
    }
    groups.get(codeEpci).schools.push(school);
  }

  return [...groups.values()].map((group) => {
    const summary = computeEpciPackSummary(group.schools);
    return {
      ...group,
      id: packIdFromEpci(group.codeEpci),
      ...summary,
      schoolCount: group.schools.length,
    };
  });
}

/**
 * Je regroupe toutes les écoles par EPCI et j'applique le filtre pack financiable.
 * Remplace l'ancien clustering géographique artisan / PKG / DRAFT.
 */
export function generateFinancialPackages(schools, options = {}) {
  const { log = false, epciMapping = getEpciMappingSync() } = options;
  const rows = schools.map((row) => ({ ...row }));
  const epciGroups = buildEpciGroups(rows, epciMapping);

  if (log) {
    appendPipelineLog({
      level: 'info',
      message: `[EPCI] ${epciGroups.length} pack(s) territorial(aux) — regroupement par Code_EPCI`,
    });
  }

  for (const group of epciGroups) {
    const { packCapexTotal, packGainNetPessimisteTotal, packFinancable, statutProjetEpci } = group;

    if (log) {
      appendPipelineLog({
        level: statutProjetEpci === STATUT_PROJET_GLOBAL_VALIDE ? 'success' : 'info',
        message: `[EPCI] ${group.nomEpci || group.codeEpci || 'inconnu'} : CAPEX ${packCapexTotal.toLocaleString('fr-FR')} €, gain net pessimiste ${packGainNetPessimisteTotal.toLocaleString('fr-FR')} €/an, ${group.schoolCount} bâtiment(s) — ${statutProjetEpci}`,
      });
    }

    for (const row of group.schools) {
      row.Code_EPCI = group.codeEpci ?? '';
      row.Nom_EPCI = group.nomEpci ?? '';
      row.Pack_CAPEX_Total = packCapexTotal;
      row.Pack_Gain_Net_Pessimiste_Total = packGainNetPessimisteTotal;
      row.Statut_Projet_EPCI = statutProjetEpci;

      if (row.Financement_Statut === 'FINANÇABLE_SOLO') {
        row.Package_ID = 'SOLO';
      } else {
        row.Package_ID = group.id;
        if (packFinancable && row.Financement_Statut === FINANCE_STATUT_A_REGROUPER) {
          row.Financement_Statut = FINANCE_STATUT_PACK_FINANÇABLE_EPCI;
        }
      }
    }
  }

  for (const row of rows) {
    delete row._capexTotal;
    delete row._fondsRoiYears;
  }

  if (log) {
    const financable = rows.filter((r) => r.Financement_Statut === FINANCE_STATUT_PACK_FINANÇABLE_EPCI).length;
    appendPipelineLog({
      level: 'success',
      message: `[EPCI] Terminé — ${financable} école(s) PACK_FINANÇABLE_EPCI`,
    });
  }

  return rows;
}

/** Je construis la liste des packs EPCI pour le dashboard (synthèse CAPEX + gains nets). */
export function buildEpciPackageGroups(schools, epciMapping = getEpciMappingSync()) {
  return buildEpciGroups(schools, epciMapping)
    .map((group) => ({
      id: group.id,
      codeEpci: group.codeEpci,
      nomEpci: group.nomEpci,
      capexTotal: group.packCapexTotal,
      gainNetPessimisteTotal: group.packGainNetPessimisteTotal,
      partFondsTotal: group.partFondsTotal,
      packFinancable: group.packFinancable,
      statutProjetEpci: group.statutProjetEpci,
      schoolCount: group.schoolCount,
      schools: group.schools.map((s) => ({
        codeUai: s.Code_UAI,
        nom: s.Nom_Ecole,
        commune: s.Commune,
        surfaceM2: s.Surface_M2,
        gainNetPessimiste: schoolGainNetPessimiste(s),
        financementStatut: s.Financement_Statut,
      })),
    }))
    .sort((a, b) => b.capexTotal - a.capexTotal);
}

/** @deprecated Alias — préférer buildEpciPackageGroups */
export function buildDraftPackageGroups(schools, epciMapping) {
  return buildEpciPackageGroups(schools, epciMapping);
}
