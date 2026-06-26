export const BRAND = {
  name: 'Clim École',
  descriptor: 'Rénovation scolaire · AURA',
  region: 'Auvergne-Rhône-Alpes',
  promise: 'Trouvez les prochains marchés publics de rénovation scolaire',
  tagline:
    'Nous recensons les écoles primaires passoires thermiques (DPE F/G), estimons le budget travaux et les subventions possibles — territoire par territoire, avant l\'appel d\'offres.',
  colors: {
    primary: '#18181B',
    accent: '#18181B',
    heat: '#DC2626',
    surface: '#FFFFFF',
    card: '#FFFFFF',
  },
} as const;

export type ClientPersona = 'btp' | 'be' | 'amo';

export interface PersonaDefinition {
  id: ClientPersona;
  label: string;
  shortLabel: string;
  headline: string;
  tagline: string;
  description: string;
  valueProp: string;
  metricLabel: string;
}

export const PERSONAS: Record<ClientPersona, PersonaDefinition> = {
  btp: {
    id: 'btp',
    label: 'Entreprises de travaux',
    shortLabel: 'BTP',
    headline: 'Vous chiffrez des chantiers publics',
    tagline: 'Volume · Marge · Avance sur le AO',
    description:
      'Voyez combien de travaux représente un territoire (PAC, isolation…) et priorisez les dossiers > 400 k€ avant vos concurrents.',
    valueProp: 'Chiffrage territorial prêt',
    metricLabel: 'Budget travaux',
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
  },
};

export const PERSONA_LIST = [PERSONAS.btp, PERSONAS.be, PERSONAS.amo];

export const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Parcourez gratuitement',
    body: 'Consultez la carte des intercommunalités. Pour chaque territoire : budget travaux, subventions, nombre d\'écoles, score de priorité.',
  },
  {
    step: '2',
    title: 'Repérez les bons dossiers',
    body: 'Filtrez par métier (travaux, ingénierie, financement). Les dossiers prioritaires combinent un bon score et un budget > 400 k€.',
  },
  {
    step: '3',
    title: 'Débloquez l\'identité',
    body: 'Quand un territoire vaut le coup : noms des communes et écoles, contacts mairies, export PDF. À l\'unité (290 € HT) ou en abonnement.',
  },
] as const;
