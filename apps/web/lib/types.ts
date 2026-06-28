/** 74 colonnes — output_prospection.csv */

import type { ClientPersona } from './brand';

export type { ClientPersona };

export type FinancementStatut =
  | 'FINANÇABLE_SOLO'
  | 'PACK_FINANÇABLE_EPCI'
  | 'À_REGROUPER'
  | 'À_PACKAGER'
  | string;

export type StatutProjetEpci =
  | 'PROJET_GLOBAL_VALIDE'
  | 'SOUS_SEUIL_A_CREUSER'
  | string;

export interface ProspectRow {
  codeUai: string;
  codeInsee: string;
  codeEpci: string;
  nomEpci: string;
  nomEcole: string;
  typePatrimoine: string;
  proprietaireFfoForme: string;
  proprietaireFfoDenomination: string;
  commune: string;
  surfaceM2: number;
  anneeConstruction: number;
  statutDpe: string;
  anneeDpe: number;
  classeDpe: string;
  consoAnnuelleKwh: number;
  consoSpecifiqueKwhM2: number;
  factureAnnuelleEuros: number;
  economieAnnuelleEuros: number;
  economieRealisteEuros: number;
  economiePlancher66pctEuros: number;
  modeleFinancement: string;
  capexTotal: number;
  capexHtEuros: number;
  subventionsEtatEuros: number;
  subventionsPessimisteEuros: number;
  subventionsOptimisteEuros: number;
  subventionsFourchetteLabel: string;
  ceeEuros: number;
  partFondsEuros: number;
  partFondsPessimisteEuros: number;
  partFondsOptimisteEuros: number;
  packCapexTotal: number;
  packGainNetPessimisteTotal: number;
  financementStatut: FinancementStatut;
  statutProjetEpci: StatutProjetEpci;
  packageId: string;
  argumentaireLoiElan: string;
  argumentaireMgpePd: string;
  mgpeLoyerLtEuros: number;
  mgpeRedevanceFtEuros: number;
  mgpePartServicesStEuros: number;
  mgpeDureeContratAns: number;
  gainNetContractuelEuros: number;
  gainNetAnnuelMairieEuros: number;
  gainNetPessimisteEuros: number;
  gainNetOptimisteEuros: number;
  gainNetFourchetteLabel: string;
  gainNetPlancher66pctEuros: number;
  fondsRoiAnnees: number;
  fondsRoiPessimisteAnnees: number;
  fondsRoiOptimisteAnnees: number;
  fondsRoiFourchetteLabel: string;
  tauxSubventionPessimistePct: number;
  tauxEcoRealistePessimistePct: number;
  ratioPacWM2: number;
  alerteSurdimensionnement: boolean;
  alerteSurdimensionnementNote: string;
  scoreEligibiliteClosing: number;
  closingTemperature: string;
  alerteFinancement: string;
  emailMairie: string;
  artisanNom: string;
  artisanDistanceKm: number;
  artisanEmail: string;
  artisanTrancheEffectif: string;
  artisanEffectifLabel: string;
  artisanEffectifMin: number;
  typeTravaux: string;
  puissancePacKw: number;
  ouvriersRequis: number;
  dureeEstimeeSemaines: number;
  periodeIdealeChantier: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ProspectionMeta {
  filePath: string;
  rowCount: number;
  loadedAt: string;
  fileMtimeMs: number;
}

export interface ProspectionDataset {
  meta: ProspectionMeta;
  rows: ProspectRow[];
}

export interface DashboardKpis {
  totalCapex: number;
  totalBatiments: number;
  epciUniques: number;
  leadsChauds: number;
  leadsTiedes: number;
  soloFinancables: number;
  packEpciFinancables: number;
}

export interface EpciTriageRow {
  codeEpci: string;
  nomEpci: string;
  packCapexTotal: number;
  packGainNetPessimiste: number;
  batimentCount: number;
  financementStatut: FinancementStatut;
  statutProjetEpci: StatutProjetEpci;
  scoreMax: number;
}

export type ClosingLevel = 'chaud' | 'tiede' | 'froid';

export interface EpciSummaryRow {
  codeEpci: string;
  nomEpci: string;
  displayName: string;
  communesLabel: string;
  batimentCount: number;
  packCapexTotal: number;
  gainNetMairieTotal: number;
  temperatureGlobale: string;
  temperatureLevel: ClosingLevel;
  statutProjetEpci: StatutProjetEpci;
  scoreMax: number;
}

export interface EpciDetail {
  codeEpci: string;
  nomEpci: string;
  displayName: string;
  communesLabel: string;
  packCapexTotal: number;
  subventionsTotal: number;
  resteAChargeTotal: number;
  gainNetMairieTotal: number;
  temperatureGlobale: string;
  temperatureLevel: ClosingLevel;
  statutProjetEpci: StatutProjetEpci;
  batimentCount: number;
  batiments: ProspectRow[];
}

export interface SoloOpportunity {
  row: ProspectRow;
  tier: 'chaud' | 'qualified';
}

export interface PortfolioData {
  solosChauds: SoloOpportunity[];
  solosQualified: SoloOpportunity[];
  packsValides: EpciSummaryRow[];
}

export interface MapMarker {
  id: string;
  codeUai: string;
  codeEpci: string;
  lat: number;
  lon: number;
  dpe: string;
  statutDpe: string;
  capex: number;
  resteACharge: number;
  gainNetMairie: number;
  surfaceM2: number;
  nomEcole: string;
  commune: string;
  temperature: string;
  temperatureLevel: ClosingLevel;
  financementStatut: string;
}

export type PipelineStage =
  | 'identifie'
  | 'qualifie'
  | 'dossier'
  | 'proposition'
  | 'signe';

export interface PipelineStateEntry {
  stage: PipelineStage;
  note?: string;
  followUpDate?: string;
  updatedAt: string;
}

export interface PipelineStore {
  items: Record<string, PipelineStateEntry>;
}

export interface PipelineCard {
  id: string;
  type: 'school' | 'epci';
  stage: PipelineStage;
  note?: string;
  followUpDate?: string;
  title: string;
  subtitle: string;
  capex: number;
  temperature: string;
  temperatureLevel: ClosingLevel;
  href: string;
}

export interface SearchResult {
  id: string;
  type: 'school' | 'epci';
  title: string;
  subtitle: string;
  href: string;
  meta?: string;
}

export const PIPELINE_STAGES: { id: PipelineStage; label: string; hint: string; color: string }[] = [
  { id: 'identifie', label: 'Repéré', hint: 'Tu as repéré l’opportunité, pas encore contacté.', color: 'border-zinc-600' },
  { id: 'qualifie', label: 'Intéressant', hint: 'La collectivité est réceptive ou le dossier tient la route.', color: 'border-sky-500/50' },
  { id: 'dossier', label: 'Dossier monté', hint: 'Chiffrage, subventions et montage financier en cours.', color: 'border-amber-500/50' },
  { id: 'proposition', label: 'Proposition', hint: 'Offre ou contrat MGPE-PD envoyé au décideur.', color: 'border-violet-500/50' },
  { id: 'signe', label: 'Signé', hint: 'Contrat validé — chantier à lancer.', color: 'border-zen-teal-dim/50' },
];

/** Données publiques marketplace — aucune PII */
export interface MarketplaceGlobalStats {
  totalPackCapex: number;
  totalBatiments: number;
  epciCount: number;
  qualifiedCount: number;
  leadsChauds: number;
  totalResteACharge: number;
  totalSubventions: number;
  totalGainMairie: number;
  totalCeeEuros: number;
  totalCumacKwh: number;
  departmentCount: number;
}

export interface MarketplacePack {
  packId: string;
  publicName: string;
  publicZone: string;
  department: string;
  batimentCount: number;
  packCapexTotal: number;
  resteAChargeTotal: number;
  subventionsTotal: number;
  fondsVertPotential: number;
  gainNetMairieTotal: number;
  roiAnnees: number;
  subventionRatio: number;
  temperatureLevel: ClosingLevel;
  statutProjetEpci: StatutProjetEpci;
  isHot: boolean;
  isNew: boolean;
  /** Deal Room curated — score B+ et CAPEX actionnable */
  isQualified: boolean;
  /** Places restantes pour achat unitaire */
  slotsRemaining: number;
  slotsMax: number;
  soldOut: boolean;
  /** Tranche affichée en gratuit */
  budgetRange: string;
  /** Niveau de subventions affiché en gratuit */
  subventionLevelLabel: string;
  /** Montants exacts réservés au dossier débloqué */
  financialsHidden?: boolean;
  /** Tags algorithmiques — un deal peut en cumuler plusieurs */
  personas: ClientPersona[];
  primaryPersona: ClientPersona;
  radarScore: number;
  radarGrade: 'A' | 'B' | 'C' | 'D';
  /** Appel d'offres BOAMP actif détecté sur ce territoire */
  hasActiveTender?: boolean;
  tenderTitle?: string;
  /** CEE agrégés territoire */
  ceeEurosTotal?: number;
  cumacKwhTotal?: number;
  /** 5+ écoles et CAPEX > 800 k€ */
  isMutualizable?: boolean;
}

export interface MarketplaceBuilding {
  buildingId: string;
  publicName: string;
  publicCommune: string;
  /** Masqué en gratuit — champs à 0 / « ? » côté serveur */
  surfaceM2: number;
  classeDpe: string;
  capexTotal: number;
  resteACharge: number;
  gainNetMairie: number;
  roiAnnees: number;
  closingTemperature: string;
  /** Détail financier réservé au dossier débloqué */
  detailsHidden?: boolean;
  /** Présent uniquement si dossier débloqué */
  realName?: string;
  realCommune?: string;
  emailMairie?: string;
  alerteSurdimensionnement?: boolean;
  /** Part Fonds Vert pessimiste (≠ RAC post-MGPE) */
  partFondsVert?: number;
  /** CAPEX − subventions pessimistes */
  resteAChargeAfterSubs?: number;
  codeUai?: string;
  typeTravaux?: string;
  puissancePacKw?: number;
  dureeEstimeeSemaines?: number;
  periodeIdealeChantier?: string;
  alerteFinancement?: string;
  alerteSurdimensionnementNote?: string;
  factureAnnuelleEuros?: number;
  consoSpecifiqueKwhM2?: number;
  anneeDpe?: number;
  scoreEligibiliteClosing?: number;
  ceeEuros?: number;
  anneeConstruction?: number;
  artisanNom?: string;
  artisanEmail?: string;
  artisanDistanceKm?: number;
  artisanEffectifLabel?: string;
  latitude?: number | null;
  longitude?: number | null;
  emailMissing?: boolean;
}

export interface MarketplaceMgpeSummary {
  loyerLtEuros: number;
  redevanceFtEuros: number;
  partServicesEuros: number;
  dureeContratAns: number;
  gainNetContractuelEuros: number;
  argumentaireLoiElan: string;
  argumentaireMgpePd: string;
}

export interface MarketplacePackDetail {
  pack: MarketplacePack;
  buildings: MarketplaceBuilding[];
  unlocked: boolean;
  /** Synthèse visible sans paiement (tranches, profil DPE agrégé) */
  freePreview?: import('./freemium').TerritoryFreePreview;
  personaExplanations?: import('./persona-engine').PersonaExplanation[];
  radarFactors?: string[];
  communesLabel?: string;
  nomEpci?: string;
  dataLoadedAt?: string;
  scoreClosingMax?: number;
  financementStatut?: string;
  mgpe?: MarketplaceMgpeSummary;
  /** Somme CAPEX − subventions au niveau pack */
  resteAChargeAfterSubsTotal?: number;
}
