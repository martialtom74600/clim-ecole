import { config } from '../config.js';
import { RESILIATION_CLAUSE_MGPE_PD } from './resiliationClause.js';
import { simulateMgpePdLoyerFinancials } from '../finance/energyEconomics.js';

/** Prix de référence tertiaire SDES (€/kWh TTC) */
export function getPrixKwhReference() {
  return config.getPrixKwhTertiaire();
}

/** Références juridiques MGPE-PD (Loi 2023-222 + Décret 2023-913) */
export const MGPE_PD_REFERENCES = {
  loi: 'Loi n° 2023-222 du 30 mars 2023',
  decret: 'Décret n° 2023-913 du 3 octobre 2023',
  experimentalUntil: '2028-03-30',
  ccpMgp: 'Articles L. 2171-1 et suivants CCP',
  derogationPaiementDiffere: 'Article L. 2191-5 CCP (dérogation expérimentale)',
  maxSubventionPublique: 'Article L. 1111-10 CGCT (plafond 80 % HT)',
};

export const SUBSIDY_THRESHOLDS = {
  detrMinGainPct: 30,
  fondsVertMinGainPct: 40,
  dsilDecretTertiairePct: 40,
  maxPublicSubsidyPct: 80,
  minPerformancePenaltyPct: 66,
};

export const CEE_FICHES = {
  gtb: 'BAT-TH-116 (GTB classe A/B — NF EN ISO 52120-1)',
  isolationCombles: 'BAT-EN-101 (R ≥ 7 m².K/W)',
  isolationPlancher: 'BAT-EN-103 (R ≥ 3 m².K/W)',
  pacAirEau: 'BAT-TH-113 / BAT-TH-163 (PAC collectives — pas BAT-TH-157)',
  chaudiereBiomasse: 'BAT-TH-157 (biomasse collective uniquement)',
};

const CLAUSES_CONTRACTUELLES = [
  'Objectifs chiffrés GPE (kWh/m²/an énergie finale et/ou GES vs SdT)',
  'PMRV conforme IPMVP annexé avant toute demande CEE',
  'Pénalités sous-performance ≥ 66 % du coût énergie répercuté (100 % recommandé)',
  'Loyer synallagmatique modulé sur performance réelle (Lt = Ft + St ± Pt)',
  'Réversibilité — retour gratuit des installations au terme, sans hypothèque',
];

const PIECES_SUBVENTIONS = [
  'Audit énergétique NF EN 16247 (bureau RGE Études / OPQIBI 1905)',
  'DAAT (Diagnostic Amiante Avant Travaux) si construction < 1997',
  'Attestation de non-commencement avant accusé réception dossier préfecture',
  'Simulation thermique dynamique (Fonds Vert ÉduRénov — gain ≥ 40 %)',
];

const ALERTES_CEE = [
  'Lettre d\'engagement CEE / cadre de contribution AVANT notification du marché (R. 2182-4 CCP)',
  'Antériorité stricte PNCEE — aucune régularisation a posteriori',
  'GTB BAT-TH-116 non cumulable avec BAT-SE-103 ni BAT-EQ-127',
];

const ASSURANCES_REQUISES = [
  'RC Pro ≥ 5 M€ / sinistre',
  'Décennale lots ITE et CVC explicitement couverts',
  'GAPD 10 % montant travaux + retenue garantie 5 %',
  'Extension GPE-R (garantie performance énergétique post-réception)',
];

function instructeurSubventions(departement) {
  if (departement === '74') {
    return 'DDT 74 / Préfecture Haute-Savoie (DETR-DSIL via Démarches Simplifiées)';
  }
  if (departement === '73') {
    return 'DDT 73 / Commission DETR départementale (Savoie)';
  }
  return 'DDT départementale + DREAL Auvergne-Rhône-Alpes (Fonds Vert ÉduRénov)';
}

function instructeurSoutenabilite(departement) {
  if (departement === '74') {
    return 'DDFiP Haute-Savoie (Annecy) → Direction du Budget';
  }
  if (departement === '73') {
    return 'DDFiP Savoie (Chambéry) → Direction du Budget';
  }
  return 'DDFiP du département';
}

/**
 * Structure simplifiée du loyer synallagmatique Lt = Ft + St ± Pt
 * @param {{ capexTotal: number, partFonds: number, economiesAnnuelles: number, durationYears?: number }} params
 */
export function simulateMgpePdLoyer(params) {
  const {
    capexTotal,
    partFonds,
    economiesAnnuelles,
    durationYears,
    interestRate,
  } = params;

  return simulateMgpePdLoyerFinancials({
    capexTotal,
    partFonds,
    economiesAnnuelles,
    durationYears,
    interestRate,
  });
}

/** Colonnes CSV MGPE-PD dérivées du simulateur loyer */
export function computeMgpePdRowFinancials(row) {
  const capex = row.CAPEX_Total ?? row._capexTotal ?? 0;
  const partFonds = row.Part_Fonds_Euros ?? 0;
  const sim = simulateMgpePdLoyer({
    capexTotal: capex,
    partFonds,
    economiesAnnuelles: row.Economie_Annuelle_Euros ?? 0,
  });
  return {
    MGPE_Loyer_Lt_Euros: sim.loyerSynallagmatiqueEstime,
    MGPE_Redevance_Ft_Euros: sim.redevanceFinanciereFt,
    MGPE_Part_Services_St_Euros: sim.partServicesSt,
    MGPE_Duree_Contrat_Ans: sim.dureeContratAns,
  };
}

export function buildAdministrativeTimeline(dossier) {
  const dept = dossier.departement ?? '73';
  const instructeur = instructeurSubventions(dept);
  const ddfip = instructeurSoutenabilite(dept);

  return [
    {
      step: 1,
      title: 'Contribution incitative CEE',
      description: 'Signature de la convention CEE / lettre d\'engagement de l\'obligé ou du tiers-financeur.',
      alert: true,
      alertText: 'Impératif AVANT toute notification du marché (R. 2182-4 CCP — antériorité PNCEE).',
      status: 'critical',
    },
    {
      step: 2,
      title: 'Dépôt dossier subventions d\'État',
      description: `Instruction ${instructeur} — DETR (≥ ${SUBSIDY_THRESHOLDS.detrMinGainPct} %), DSIL, Fonds Vert ÉduRénov (≥ ${SUBSIDY_THRESHOLDS.fondsVertMinGainPct} %).`,
      alert: true,
      alertText: 'Attestation de non-commencement requise — aucun ordre de service avant accusé réception préfecture.',
      status: 'warning',
    },
    {
      step: 3,
      title: 'Avis Fin Infra & DDFiP',
      description: `EPMR transmise à Fin Infra (1 mois, tacite) + ESB instruite par ${ddfip} (avis ministre Budget sous 1 mois).`,
      alert: false,
      status: 'info',
    },
    {
      step: 4,
      title: 'Délibération Conseil Municipal',
      description: 'Présentation obligatoire ESB, EPMR et avis Fin Infra/DDFiP avant vote d\'autorisation de signature.',
      alert: true,
      alertText: 'Délibération sans dossier complet = vice de forme (L. 2121-13 CGCT) — nullité possible.',
      status: 'warning',
    },
    {
      step: 5,
      title: 'Notification du MGPE-PD',
      description: 'Notification au groupement titulaire — figeage de l\'acte d\'engagement juridique (Loi 2023-222 / Décret 2023-913).',
      alert: true,
      alertText: 'Postérieure à la signature CEE — postérieure aux avis Fin Infra et Budget.',
      status: 'critical',
    },
  ];
}

/**
 * Analyse de sensibilité prix kWh (IPMVP) — impact commune vs protection fonds
 * @param {object} dossier
 * @param {number} variationPct — variation en % vs prix référence (-30 à +100)
 */
export function computeSensitivityAtPrice(dossier, variationPct) {
  const prixRef = config.getPrixKwhTertiaire();
  const prixScenario = prixRef * (1 + variationPct / 100);
  const gainCpe = config.cpe.objectifGainCpe;

  const factureAnnuelle = dossier.facture ?? dossier.economies ?? 0;
  const consoKwh = factureAnnuelle > 0 ? factureAnnuelle / prixRef : 0;
  const deltaEGarantiKwh = consoKwh * gainCpe;

  const sim = simulateMgpePdLoyer({
    capexTotal: dossier.capex ?? 0,
    partFonds: dossier.partFonds ?? 0,
    economiesAnnuelles: dossier.economies ?? 0,
  });

  const economieFinanciereBrute = Math.round(deltaEGarantiKwh * prixScenario);
  const economieTheoriqueFonds = Math.round(deltaEGarantiKwh * prixRef);
  const loyerLt = sim.loyerSynallagmatiqueEstime;
  const economieNetteCommune = economieFinanciereBrute - loyerLt;

  const deficitSousPerfPct = 0.2;
  const deltaEConstateKwh = deltaEGarantiKwh * (1 - deficitSousPerfPct);
  const penaliteMin = computeContractualPenalty(
    deltaEGarantiKwh - deltaEConstateKwh,
    prixScenario,
    SUBSIDY_THRESHOLDS.minPerformancePenaltyPct / 100,
  );
  const penaliteRecommandee = computePerformancePenalty(
    deltaEGarantiKwh,
    deltaEConstateKwh,
    prixScenario,
  );

  const couvertureFondsPct = sim.redevanceFinanciereFt > 0
    ? Math.round((economieTheoriqueFonds / sim.redevanceFinanciereFt) * 100)
    : null;

  return {
    variationPct,
    prixKwhRef: prixRef,
    prixKwhScenario: Math.round(prixScenario * 10000) / 10000,
    consoKwhAnnuelle: Math.round(consoKwh),
    deltaEnergieGarantieKwh: Math.round(deltaEGarantiKwh),
    economieFinanciereBrute,
    economieTheoriqueFonds,
    loyerLt,
    redevanceFt: sim.redevanceFinanciereFt,
    partServicesSt: sim.partServicesSt,
    economieNetteCommune,
    penaliteSousPerfMin66: penaliteMin,
    penaliteSousPerf100: penaliteRecommandee,
    couvertureFondsPct,
    fondsProtegeVolatilite: true,
  };
}

/** Courbe de sensibilité pour le graphique (-30 % à +100 %) */
export function buildSensitivityCurve(dossier, steps = 14) {
  const minPct = -30;
  const maxPct = 100;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const variationPct = minPct + ((maxPct - minPct) * i) / steps;
    const s = computeSensitivityAtPrice(dossier, variationPct);
    points.push({
      variationPct,
      economieNetteCommune: s.economieNetteCommune,
      economieTheoriqueFonds: s.economieTheoriqueFonds,
      loyerLt: s.loyerLt,
    });
  }
  return points;
}

/** Pénalité contractuelle (≥ 66 % du coût énergie ; 100 % en clause type) */
export function computeContractualPenalty(deficitKwh, prixKwhReel, penaltyRate = 1) {
  const minRate = SUBSIDY_THRESHOLDS.minPerformancePenaltyPct / 100;
  const applied = Math.max(penaltyRate, minRate);
  return Math.round(deficitKwh * prixKwhReel * applied);
}

/** Pénalité sous-performance : (ΔE_garanti - ΔE_constat) × P_reel (100 % recommandé) */
export function computePerformancePenalty(deltaEGarantiKwh, deltaEConstateKwh, prixKwhReel) {
  const deficit = Math.max(0, deltaEGarantiKwh - deltaEConstateKwh);
  return Math.round(deficit * prixKwhReel);
}

/** Argumentaire MGPE-PD pour une ligne école (post-finance fourchette) */
export function generateArgumentaireMgpePdEcole(row) {
  const subLabel =
    row.Subventions_Fourchette_Label ??
    (row.Subventions_Pessimiste_Euros != null && row.Subventions_Optimiste_Euros != null
      ? `${row.Subventions_Pessimiste_Euros} à ${row.Subventions_Optimiste_Euros} €`
      : null);

  const gainLabel = row.Gain_Net_Fourchette_Label ?? null;

  const base = generateArgumentaireMgpePdCommune({
    nomOfficiel: row.Commune,
    schoolCount: 1,
    surfaceM2: row.Surface_M2,
    departement: String(row.Code_INSEE ?? '').slice(0, 2),
    capex: row.CAPEX_Total,
    partFonds: row.Part_Fonds_Euros,
    economies: row.Economie_Annuelle_Euros,
    subventions: row.Subventions_Etat_Euros,
    cee: row.CEE_Euros,
  });

  const extra = [];
  if (subLabel) {
    extra.push(`Subventions attendues (fourchette) : ${subLabel}.`);
  }
  if (gainLabel) {
    extra.push(`Gain net annuel mairie (fourchette) : ${gainLabel}.`);
  }
  if (row.Fonds_ROI_Fourchette_Label) {
    extra.push(`ROI part fonds (fourchette) : ${row.Fonds_ROI_Fourchette_Label}.`);
  }

  return extra.length ? `${base} ${extra.join(' ')}` : base;
}

export function generateArgumentaireMgpePdCommune(dossier) {
  const nom = dossier.nomOfficiel ?? 'votre commune';
  const n = dossier.schoolCount ?? 0;
  const surface = Math.round(dossier.surfaceM2 ?? 0);
  const dept = dossier.departement ?? '73';
  const sim = simulateMgpePdLoyer({
    capexTotal: dossier.capex ?? 0,
    partFonds: dossier.partFonds ?? 0,
    economiesAnnuelles: dossier.economies ?? 0,
  });

  return (
    `Pour ${nom} (${dept}), le montage MGPE-PD (${MGPE_PD_REFERENCES.loi} / ${MGPE_PD_REFERENCES.decret}) permet de lancer la rénovation de ${n} école${n > 1 ? 's' : ''} ` +
    `(${surface} m²) sans immobiliser la capacité d'autofinancement : le tiers-financeur porte le CAPEX hors subventions, ` +
    `remboursé par un loyer lissé sur ${sim.dureeContratAns} ans (ordre de grandeur ${sim.loyerSynallagmatiqueEstime.toLocaleString('fr-FR')} €/an). ` +
    `Objectif GPE : −${sim.gainEnergieCiblePct} % d'énergie finale (compatible DETR ≥ ${SUBSIDY_THRESHOLDS.detrMinGainPct} % et Fonds Vert ≥ ${SUBSIDY_THRESHOLDS.fondsVertMinGainPct} %). ` +
    `La maîtrise d'ouvrage reste publique ; le contrat intègre PMRV (IPMVP), pénalités de sous-performance et réversibilité des équipements.`
  );
}

export function buildMgpePdBrief(dossier) {
  const dept = dossier.departement ?? '73';
  const simulation = simulateMgpePdLoyer({
    capexTotal: dossier.capex ?? 0,
    partFonds: dossier.partFonds ?? 0,
    economiesAnnuelles: dossier.economies ?? 0,
  });

  const tauxSubventionEstime = dossier.capex > 0
    ? Math.round(((dossier.subventions ?? 0) + (dossier.cee ?? 0)) / dossier.capex * 100)
    : 0;

  const alertes = [];
  if (tauxSubventionEstime > SUBSIDY_THRESHOLDS.maxPublicSubsidyPct) {
    alertes.push(`Taux subventions+CEE estimé (${tauxSubventionEstime} %) proche/plus du plafond 80 % CGCT — vérifier ESB.`);
  }
  if ((dossier.partFonds ?? 0) >= config.finance.minPackagePartFonds) {
    alertes.push('Ticket fonds ≥ 1 M€ — packaging territorial validé pour instruction groupée.');
  } else if ((dossier.partFonds ?? 0) >= config.finance.minPartFondsSolo) {
    alertes.push('Dossier finançable solo ou en couveuse DRAFT — viser co-instruction DETR + Fonds Vert.');
  }
  alertes.push('Ordre chronologique impératif : convention CEE signée AVANT notification du MGPE-PD.');

  return {
    references: MGPE_PD_REFERENCES,
    seuils: SUBSIDY_THRESHOLDS,
    fichesCee: CEE_FICHES,
    instructeurSubventions: instructeurSubventions(dept),
    instructeurSoutenabilite: instructeurSoutenabilite(dept),
    avisRequis: ['Fin Infra (EPMR — 1 mois)', 'DDFiP / Direction du Budget (ESB — 1 mois)'],
    simulation,
    tauxSubventionEstimePct: tauxSubventionEstime,
    timeline: buildAdministrativeTimeline(dossier),
    sensitivity: {
      prixKwhRef: config.getPrixKwhTertiaire(),
      variationMinPct: -30,
      variationMaxPct: 100,
      courbe: buildSensitivityCurve(dossier),
      scenarioReference: computeSensitivityAtPrice(dossier, 0),
    },
    resiliationClause: RESILIATION_CLAUSE_MGPE_PD,
    checklists: {
      contractuelles: CLAUSES_CONTRACTUELLES,
      subventions: PIECES_SUBVENTIONS,
      cee: ALERTES_CEE,
      assurances: ASSURANCES_REQUISES,
    },
    alertes,
    argumentaire: generateArgumentaireMgpePdCommune(dossier),
  };
}
