import {
  computeSchoolFinanceBase,
  assignFinancingStatus,
} from './roiEngine.js';
import { computeFinancingAlert } from './subsidyEngine.js';
import { generateFinancialPackages } from './poolingEngine.js';
import { generateArgumentaireMgpePdEcole } from '../legal/mgpePdFramework.js';
import { attachClosingScoreFields } from './closingScoreEngine.js';
import { computePerformanceFloorSavings } from './realisticEconomics.js';
import {
  computeDualScenarioFinances,
  formatDualScenarioLabels,
  buildAdaptiveContextFromRow,
} from './scenarioEngine.js';
import { computePacSurdimensionnementAlert } from './adaptiveScenarioContext.js';

export function enrichRowWithFinance(row, populationByInsee) {
  const population = populationByInsee.get(row.Code_INSEE) ?? null;
  const base = computeSchoolFinanceBase({
    surfaceM2: row.Surface_M2,
    capexTechniqueEur: row._capexTechnique,
    anneeConstruction: row.Annee_Construction,
  });

  const economieContractuelle = row.Economie_Annuelle_Euros ?? 0;
  const adaptiveContext = buildAdaptiveContextFromRow(row, population);
  const dual = computeDualScenarioFinances({
    capexTotalTtc: base._capexTotal,
    ceeEuros: base.CEE_Euros,
    economieContractuelleEuros: economieContractuelle,
    adaptiveContext,
  });

  const pacAlert = computePacSurdimensionnementAlert({
    typeTravaux: row.Type_Travaux,
    puissancePacKw: row.Puissance_PAC_kW,
    surfaceM2: row.Surface_M2,
  });

  const pessimiste = dual.pessimiste;
  const optimiste = dual.optimiste;
  const labels = formatDualScenarioLabels(dual);
  const economiePlancher66 = computePerformanceFloorSavings(economieContractuelle);

  const gainNetContractuel = Math.round(
    economieContractuelle - (pessimiste.MGPE_Loyer_Lt_Euros ?? 0),
  );
  const gainNetPlancher = Math.round(
    economiePlancher66 - (pessimiste.MGPE_Loyer_Lt_Euros ?? 0),
  );

  let alerteFinancement = computeFinancingAlert(
    base._capexTotal,
    optimiste.Subventions_Etat_Euros,
    base.CEE_Euros,
  );
  if (gainNetPlancher <= 0 && !alerteFinancement) {
    alerteFinancement =
      'Risque sous-performance IPMVP : gain net mairie ≤ 0 au plancher 66 % (vérifier Lt et objectifs GPE)';
  }
  if (pessimiste.Gain_Net_Annuel_Mairie_Euros <= 0 && !alerteFinancement) {
    alerteFinancement =
      `Scénario pessimiste adaptatif : gain net mairie ≤ 0 (subv. ${dual.Taux_Subvention_Pessimiste_Pct} % TTC, éco réaliste ${dual.Taux_Eco_Realiste_Pessimiste_Pct} %, Ft ${pessimiste.MGPE_Taux_Interet_Pct} %)`;
  }
  if (pacAlert.Alerte_Surdimensionnement) {
    alerteFinancement = alerteFinancement
      ? `${alerteFinancement} | ${pacAlert.Alerte_Surdimensionnement_Note}`
      : pacAlert.Alerte_Surdimensionnement_Note;
  }

  const financementStatut = assignFinancingStatus(
    pessimiste.Part_Fonds_Euros,
    pessimiste.Fonds_ROI_Annees,
    pessimiste.Gain_Net_Annuel_Mairie_Euros,
  );

  const merged = attachClosingScoreFields(
    {
      ...row,
      ...base,
      CAPEX_Total: base._capexTotal,
      Subventions_Etat_Euros: pessimiste.Subventions_Etat_Euros,
      Part_Fonds_Euros: pessimiste.Part_Fonds_Euros,
      Economie_Realiste_Euros: pessimiste.Economie_Realiste_Euros,
      MGPE_Loyer_Lt_Euros: pessimiste.MGPE_Loyer_Lt_Euros,
      MGPE_Redevance_Ft_Euros: pessimiste.MGPE_Redevance_Ft_Euros,
      MGPE_Part_Services_St_Euros: pessimiste.MGPE_Part_Services_St_Euros,
      MGPE_Duree_Contrat_Ans: pessimiste.MGPE_Duree_Contrat_Ans,
      MGPE_Taux_Interet_Pct: pessimiste.MGPE_Taux_Interet_Pct,
      Gain_Net_Contractuel_Euros: gainNetContractuel,
      Gain_Net_Annuel_Mairie_Euros: pessimiste.Gain_Net_Annuel_Mairie_Euros,
      Gain_Net_Plancher_66pct_Euros: gainNetPlancher,
      Fonds_ROI_Annees: pessimiste.Fonds_ROI_Annees,
      Financement_Statut: financementStatut,
      Alerte_Financement: alerteFinancement,
      Package_ID: 'SOLO',
      Subventions_Pessimiste_Euros: dual.Subventions_Pessimiste_Euros,
      Subventions_Optimiste_Euros: dual.Subventions_Optimiste_Euros,
      Part_Fonds_Pessimiste_Euros: dual.Part_Fonds_Pessimiste_Euros,
      Part_Fonds_Optimiste_Euros: dual.Part_Fonds_Optimiste_Euros,
      Gain_Net_Pessimiste_Euros: dual.Gain_Net_Pessimiste_Euros,
      Gain_Net_Optimiste_Euros: dual.Gain_Net_Optimiste_Euros,
      Fonds_ROI_Pessimiste_Annees: dual.Fonds_ROI_Pessimiste_Annees,
      Fonds_ROI_Optimiste_Annees: dual.Fonds_ROI_Optimiste_Annees,
      MGPE_Lt_Pessimiste_Euros: dual.MGPE_Lt_Pessimiste_Euros,
      MGPE_Lt_Optimiste_Euros: dual.MGPE_Lt_Optimiste_Euros,
      Economie_Realiste_Optimiste_Euros: optimiste.Economie_Realiste_Euros,
      Economie_Realiste_Pessimiste_Euros: pessimiste.Economie_Realiste_Euros,
      Subventions_Fourchette: dual.Subventions_Fourchette,
      Gain_Net_Fourchette: dual.Gain_Net_Fourchette,
      Fonds_ROI_Fourchette: dual.Fonds_ROI_Fourchette,
      Subventions_Fourchette_Label: labels.subventionsLabel,
      Gain_Net_Fourchette_Label: labels.gainNetLabel,
      Fonds_ROI_Fourchette_Label: labels.roiLabel,
      Taux_Subvention_Pessimiste_Pct: dual.Taux_Subvention_Pessimiste_Pct,
      Taux_Eco_Realiste_Pessimiste_Pct: dual.Taux_Eco_Realiste_Pessimiste_Pct,
      Alerte_Surdimensionnement: pacAlert.Alerte_Surdimensionnement,
      Alerte_Surdimensionnement_Note: pacAlert.Alerte_Surdimensionnement_Note,
      Ratio_PAC_W_M2: pacAlert.Ratio_PAC_W_M2,
      _partFondsRaw: pessimiste._partFondsRaw,
    },
    population,
  );

  return {
    ...merged,
    Argumentaire_MGPE_PD: generateArgumentaireMgpePdEcole(merged),
  };
}

export function enrichAndPackagePortfolio(rows, populationByInsee) {
  const enriched = rows.map((row) => enrichRowWithFinance(row, populationByInsee));
  return generateFinancialPackages(enriched);
}
