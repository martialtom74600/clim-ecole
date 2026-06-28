export const BRAND = {
  name: 'Clim École',
  descriptor: 'Rénovation scolaire · France',
  region: 'France',
  promise: 'Sourcez les marchés de rénovation scolaire avant l\'appel d\'offres',
  promiseLead: 'L\'information décisive sur la rénovation des écoles —',
  promiseAccent: 'avant tout le monde.',
  tagline:
    'Nous croisons la base nationale des bâtiments, les DPE et les dispositifs de financement public pour révéler, territoire par territoire, les écoles passoires thermiques (F/G), le budget travaux, les subventions mobilisables et le reste à charge — des mois avant la publication du moindre appel d\'offres.',
  pitch:
    'La salle de décision qui transforme une intention de rénovation en marché actionnable : CAPEX, reste à charge, montage MGPE-PD et contacts mairie, prêts pour votre prochain rendez-vous.',
  colors: {
    primary: '#18181B',
    accent: '#18181B',
    heat: '#DC2626',
    surface: '#FFFFFF',
    card: '#FFFFFF',
  },
} as const;

export type ClientPersona = 'btp' | 'be' | 'amo' | 'esco' | 'cee';

export interface PersonaDefinition {
  id: ClientPersona;
  label: string;
  shortLabel: string;
  headline: string;
  tagline: string;
  description: string;
  valueProp: string;
  metricLabel: string;
  landingPath: string;
}

export const PERSONAS: Record<ClientPersona, PersonaDefinition> = {
  btp: {
    id: 'btp',
    label: 'Entreprises de travaux',
    shortLabel: 'BTP',
    headline: 'Vous chiffrez des chantiers publics',
    tagline: 'Volume · Marge · Sourcing avant AO',
    description:
      'Voyez combien de travaux représente un territoire (PAC, isolation…) et priorisez les dossiers > 400 k€ avant vos concurrents.',
    valueProp: 'Chiffrage territorial prêt',
    metricLabel: 'Budget travaux',
    landingPath: '/btp',
  },
  be: {
    id: 'be',
    label: 'Bureaux d\'études',
    shortLabel: 'BE',
    headline: 'Vous auditez et dimensionnez',
    tagline: 'DPE · Surfaces · Faisabilité',
    description:
      'Accédez au profil thermique du parc scolaire : passoires F/G, surfaces, consommations — pour cibler vos missions d\'ingénierie.',
    valueProp: 'Données techniques consolidées',
    metricLabel: 'Écoles passoires F/G',
    landingPath: '/be',
  },
  amo: {
    id: 'amo',
    label: 'AMO & montage financier',
    shortLabel: 'AMO',
    headline: 'Vous montez le financement public',
    tagline: 'Subventions · Reste à charge · MGPE-PD',
    description:
      'Visualisez le potentiel Fonds Vert, le reste à charge collectivité et les ratios de subvention pour convaincre le DGS.',
    valueProp: 'Argumentaire financier prêt',
    metricLabel: 'Subventions estimées',
    landingPath: '/amo',
  },
  esco: {
    id: 'esco',
    label: 'ESCO & exploitants',
    shortLabel: 'ESCO',
    headline: 'Vous mutualisez les CPE territoriaux',
    tagline: 'Volume · OPEX 15–20 ans · GTB',
    description:
      'Repérez les EPCI avec 5+ écoles passoires pour proposer un marché global mutualisé et sécuriser l\'exploitation-maintenance.',
    valueProp: 'Parc mutualisable identifié',
    metricLabel: 'Écoles mutualisables',
    landingPath: '/esco',
  },
  cee: {
    id: 'cee',
    label: 'Délégataires CEE',
    shortLabel: 'CEE',
    headline: 'Vous originez du cumac tertiaire',
    tagline: 'Fiches BAT · Passoires F/G · Préfinancement',
    description:
      'Segmentez les écoles F/G, estimez le kWh cumac par territoire et remplacez le phoning par de la prospection déterministe.',
    valueProp: 'Cumac estimé par territoire',
    metricLabel: 'CEE estimés',
    landingPath: '/cee',
  },
};

export const PERSONA_LIST = [
  PERSONAS.btp,
  PERSONAS.be,
  PERSONAS.amo,
  PERSONAS.esco,
  PERSONAS.cee,
];

export const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Parcourez gratuitement',
    body: 'Consultez la carte des intercommunalités. Pour chaque territoire : budget travaux, subventions, nombre d\'écoles, score de priorité.',
  },
  {
    step: '2',
    title: 'Repérez les bons dossiers',
    body: 'Filtrez par métier (BTP, BE, AMO, ESCO, CEE). Les dossiers prioritaires combinent un bon score et un budget > 400 k€.',
  },
  {
    step: '3',
    title: 'Débloquez l\'identité',
    body: 'Quand un territoire vaut le coup : noms des communes et écoles, contacts mairies, export PDF. À l\'unité (290 € HT) ou en abonnement.',
  },
] as const;

export function isClientPersona(value: string): value is ClientPersona {
  return value in PERSONAS;
}
