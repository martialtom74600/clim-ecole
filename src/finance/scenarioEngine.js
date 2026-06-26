import { config } from '../config.js';
import { capexHtFromTtc, MAX_PUBLIC_SUBSIDY_HT_RATE } from './subsidyEngine.js';
import {
  computeAnnualAmortization,
  MGPE_DUREE_CONTRAT_ANS,
  MGPE_PART_SERVICES_RATE,
} from './energyEconomics.js';
import { computeFondsRoiYears } from './roiEngine.js';
import {
  buildAdaptivePessimisticProfile,
  buildAdaptiveContextFromRow,
} from './adaptiveScenarioContext.js';

/** Je plafonne le taux pessimiste au montant subventions optimiste (80 % HT CGCT). */
function capAdaptivePessimisticSubsidy(optimistProfile, pessimistProfile, capexTotalTtc) {
  const optSub = computeScenarioSubventions(capexTotalTtc, optimistProfile).Subventions_Etat_Euros;
  const pesSub = computeScenarioSubventions(capexTotalTtc, pessimistProfile).Subventions_Etat_Euros;

  if (pesSub <= optSub) {
    return pessimistProfile;
  }

  const capex = Math.max(0, Number(capexTotalTtc) || 0);
  if (capex <= 0) {
    return pessimistProfile;
  }

  const cappedRate = optSub / capex;
  const meta = pessimistProfile._adaptiveMeta ?? {};

  return {
    ...pessimistProfile,
    subsidyRate: cappedRate,
    _adaptiveMeta: {
      ...meta,
      subsidyRatePct: Math.round(cappedRate * 1000) / 10,
      subsidyCappedToOptimiste: true,
    },
  };
}

/** Profil plafond — base d'affichage optimiste et plafond subventions CGCT */
export const SCENARIO_OPTIMISTE = 'optimiste';

/** Profil stress-test — je retiens ce scénario pour le statut financement et le closing */
export const SCENARIO_PESSIMISTE = 'pessimiste';

const DEFAULT_PROFILES = {
  [SCENARIO_OPTIMISTE]: {
    label: 'Optimiste',
    economieRealisationRate: 0.75,
    subsidyRateOn: 'HT',
    subsidyRate: MAX_PUBLIC_SUBSIDY_HT_RATE,
    mgpeInterestRate: 0.04,
    mgpeDurationYears: MGPE_DUREE_CONTRAT_ANS,
  },
  [SCENARIO_PESSIMISTE]: {
    label: 'Pessimiste',
    economieRealisationRate: 0.55,
    subsidyRateOn: 'TTC',
    subsidyRate: 0.45,
    mgpeInterestRate: 0.055,
    mgpeDurationYears: MGPE_DUREE_CONTRAT_ANS,
  },
};

function resolveProfiles() {
  const f = config.finance.scenarios ?? {};
  return {
    [SCENARIO_OPTIMISTE]: {
      ...DEFAULT_PROFILES[SCENARIO_OPTIMISTE],
      ...(f.optimiste ?? {}),
    },
    [SCENARIO_PESSIMISTE]: {
      ...DEFAULT_PROFILES[SCENARIO_PESSIMISTE],
      ...(f.pessimiste ?? {}),
    },
  };
}

/** Je calcule les subventions selon le profil de risque (HT plafond vs TTC stressé). */
export function computeScenarioSubventions(capexTotalTtc, profile) {
  const capex = Math.max(0, Number(capexTotalTtc) || 0);
  const capexHt = capexHtFromTtc(capex);

  if (profile.subsidyRateOn === 'TTC') {
    return {
      Subventions_Etat_Euros: Math.round(capex * profile.subsidyRate),
      CAPEX_HT_Euros: Math.round(capexHt),
    };
  }

  return {
    Subventions_Etat_Euros: Math.round(capexHt * profile.subsidyRate),
    CAPEX_HT_Euros: Math.round(capexHt),
  };
}

/** Je dérive Ft, St, Lt et le gain net mairie pour un profil donné. */
export function computeScenarioMgpeAndGain({
  capexTotalTtc,
  partFondsEuros,
  economieContractuelleEuros,
  profile,
}) {
  const capex = Math.max(0, Number(capexTotalTtc) || 0);
  const partFonds = Math.max(0, Number(partFondsEuros) || 0);
  const contract = Math.max(0, Number(economieContractuelleEuros) || 0);

  const economieRealisteEuros = Math.round(contract * profile.economieRealisationRate);
  const ftAnnual = computeAnnualAmortization(
    partFonds,
    profile.mgpeDurationYears ?? MGPE_DUREE_CONTRAT_ANS,
    profile.mgpeInterestRate,
  );
  const redevanceFt = Math.round(ftAnnual);
  const partServicesSt = Math.round(capex * MGPE_PART_SERVICES_RATE);
  const loyerLt = redevanceFt + partServicesSt;
  const gainNetAnnuelMairie = Math.round(economieRealisteEuros - loyerLt);
  const fondsRoiAnnees = computeFondsRoiYears(partFonds, gainNetAnnuelMairie);

  return {
    Economie_Realiste_Euros: economieRealisteEuros,
    MGPE_Redevance_Ft_Euros: redevanceFt,
    MGPE_Part_Services_St_Euros: partServicesSt,
    MGPE_Loyer_Lt_Euros: loyerLt,
    MGPE_Duree_Contrat_Ans: profile.mgpeDurationYears ?? MGPE_DUREE_CONTRAT_ANS,
    MGPE_Taux_Interet_Pct: Math.round(profile.mgpeInterestRate * 1000) / 10,
    Gain_Net_Annuel_Mairie_Euros: gainNetAnnuelMairie,
    Fonds_ROI_Annees: fondsRoiAnnees,
    Part_Fonds_Euros: partFonds,
  };
}

/** Je calcule un profil complet (subventions → part fonds → MGPE-PD → ROI). */
export function computeScenarioFinancials({
  capexTotalTtc,
  ceeEuros,
  economieContractuelleEuros,
  scenarioKey,
  profileOverride = null,
}) {
  const profiles = resolveProfiles();
  const baseProfile = profiles[scenarioKey] ?? profiles[SCENARIO_OPTIMISTE];
  const profile = profileOverride ? { ...baseProfile, ...profileOverride } : baseProfile;
  const sub = computeScenarioSubventions(capexTotalTtc, profile);
  const cee = Math.max(0, Number(ceeEuros) || 0);
  const partFondsRaw = capexTotalTtc - cee - sub.Subventions_Etat_Euros;
  const partFonds = Math.max(0, partFondsRaw);

  const mgpe = computeScenarioMgpeAndGain({
    capexTotalTtc,
    partFondsEuros: partFonds,
    economieContractuelleEuros,
    profile,
  });

  return {
    scenarioKey,
    scenarioLabel: profile.label,
    ...sub,
    CEE_Euros: cee,
    Part_Fonds_Euros: partFonds,
    _partFondsRaw: partFondsRaw,
    ...mgpe,
  };
}

export function formatEuroRange(minEuros, maxEuros, formatter) {
  const fmt =
    formatter ??
    ((n) =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(n));
  const lo = Math.min(minEuros, maxEuros);
  const hi = Math.max(minEuros, maxEuros);
  return `${fmt(lo)} à ${fmt(hi)}`;
}

export function formatYearRange(minYears, maxYears) {
  const pes = minYears != null && Number.isFinite(minYears) ? minYears : null;
  const opt = maxYears != null && Number.isFinite(maxYears) ? maxYears : null;
  if (pes == null && opt == null) return '—';
  if (pes == null) return `— à ${opt} ans`;
  if (opt == null) return `${pes} ans —`;
  if (pes === opt) return `${pes} ans`;
  return `${Math.min(pes, opt)} à ${Math.max(pes, opt)} ans`;
}

/**
 * Je calcule les deux profils de risque et les fourchettes d'affichage.
 * Le profil pessimiste est recalibré école par école si adaptiveContext est fourni.
 */
export function computeDualScenarioFinances({
  capexTotalTtc,
  ceeEuros,
  economieContractuelleEuros,
  adaptiveContext = null,
}) {
  const profiles = resolveProfiles();
  let pessimisticProfile = adaptiveContext
    ? buildAdaptivePessimisticProfile(profiles[SCENARIO_PESSIMISTE], adaptiveContext)
    : profiles[SCENARIO_PESSIMISTE];

  pessimisticProfile = capAdaptivePessimisticSubsidy(
    profiles[SCENARIO_OPTIMISTE],
    pessimisticProfile,
    capexTotalTtc,
  );

  const optimiste = computeScenarioFinancials({
    capexTotalTtc,
    ceeEuros,
    economieContractuelleEuros,
    scenarioKey: SCENARIO_OPTIMISTE,
  });
  const pessimiste = computeScenarioFinancials({
    capexTotalTtc,
    ceeEuros,
    economieContractuelleEuros,
    scenarioKey: SCENARIO_PESSIMISTE,
    profileOverride: pessimisticProfile,
  });

  const adaptiveMeta = pessimisticProfile._adaptiveMeta ?? null;

  return {
    optimiste,
    pessimiste,
    Subventions_Pessimiste_Euros: pessimiste.Subventions_Etat_Euros,
    Subventions_Optimiste_Euros: optimiste.Subventions_Etat_Euros,
    Part_Fonds_Pessimiste_Euros: pessimiste.Part_Fonds_Euros,
    Part_Fonds_Optimiste_Euros: optimiste.Part_Fonds_Euros,
    Gain_Net_Pessimiste_Euros: pessimiste.Gain_Net_Annuel_Mairie_Euros,
    Gain_Net_Optimiste_Euros: optimiste.Gain_Net_Annuel_Mairie_Euros,
    Fonds_ROI_Pessimiste_Annees: pessimiste.Fonds_ROI_Annees,
    Fonds_ROI_Optimiste_Annees: optimiste.Fonds_ROI_Annees,
    MGPE_Lt_Pessimiste_Euros: pessimiste.MGPE_Loyer_Lt_Euros,
    MGPE_Lt_Optimiste_Euros: optimiste.MGPE_Loyer_Lt_Euros,
    Taux_Subvention_Pessimiste_Pct: adaptiveMeta?.subsidyRatePct ?? Math.round(pessimisticProfile.subsidyRate * 1000) / 10,
    Taux_Eco_Realiste_Pessimiste_Pct: adaptiveMeta?.economieRealisationRatePct ?? Math.round(pessimisticProfile.economieRealisationRate * 1000) / 10,
    Subventions_Fourchette: `${pessimiste.Subventions_Etat_Euros} à ${optimiste.Subventions_Etat_Euros}`,
    Gain_Net_Fourchette: `${pessimiste.Gain_Net_Annuel_Mairie_Euros} à ${optimiste.Gain_Net_Annuel_Mairie_Euros}`,
    Fonds_ROI_Fourchette: formatYearRange(
      pessimiste.Fonds_ROI_Annees,
      optimiste.Fonds_ROI_Annees,
    ),
  };
}

export { buildAdaptiveContextFromRow };

export function formatDualScenarioLabels(dual, fmtEur) {
  const fmt =
    fmtEur ??
    ((n) =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(n));

  return {
    subventionsLabel: formatEuroRange(
      dual.Subventions_Pessimiste_Euros,
      dual.Subventions_Optimiste_Euros,
      fmt,
    ),
    gainNetLabel: `${formatEuroRange(dual.Gain_Net_Pessimiste_Euros, dual.Gain_Net_Optimiste_Euros, fmt)}/an`,
    roiLabel: formatYearRange(dual.Fonds_ROI_Pessimiste_Annees, dual.Fonds_ROI_Optimiste_Annees),
  };
}
