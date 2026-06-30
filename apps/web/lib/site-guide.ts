/** Parcours guidés — vocabulaire pédagogique unifié sur tout le site */

export interface GuideStep {
  step: number;
  title: string;
  description: string;
}

export const DOSSIER_UNLOCKED_GUIDE: GuideStep[] = [
  {
    step: 1,
    title: 'Lisez le verdict',
    description:
      'Une phrase résume si le territoire vaut le coup — budget, écoles F/G et niveau d’aides.',
  },
  {
    step: 2,
    title: 'Prospectez le terrain',
    description:
      'Parcourez la liste triée par score, utilisez la carte et contactez les mairies en un clic.',
  },
  {
    step: 3,
    title: 'Validez le montage',
    description:
      'Simulez le reste à charge et ouvrez le montage avancé (MGPE, ESCO) si besoin.',
  },
  {
    step: 4,
    title: 'Exportez et suivez',
    description:
      'Pitch maire, CSV CRM ou note technique — puis avancez le statut dans Mon compte.',
  },
];

export const DOSSIER_LOCKED_GUIDE: GuideStep[] = [
  {
    step: 1,
    title: 'Lisez le verdict',
    description:
      'Score, tranche budget et profil DPE : suffisant pour décider si ce territoire vaut le coup.',
  },
  {
    step: 2,
    title: 'Parcourez le terrain',
    description:
      'Aperçu des écoles et de la carte — noms et contacts exacts après déblocage.',
  },
  {
    step: 3,
    title: 'Débloquez pour agir',
    description:
      'L’achat révèle montants exacts, simulateur RAC, contacts et exports prêts pour vos RDV.',
  },
];

export const EXPLORER_GUIDE: GuideStep[] = [
  {
    step: 1,
    title: 'Choisissez votre filtre',
    description: 'BTP, BE, AMO, ESCO ou CEE : chaque profil met en avant ce qui compte pour votre métier.',
  },
  {
    step: 2,
    title: 'Repérez un département',
    description: 'Cliquez sur la carte ou parcourez la liste — les badges signalent urgence et AO actif.',
  },
  {
    step: 3,
    title: 'Ouvrez le dossier',
    description: 'Gratuit = priorisation. Débloqué = tout le détail pour prospecter.',
  },
];

export const COMPTE_PIPELINE_GUIDE: GuideStep[] = [
  {
    step: 1,
    title: 'Contactez',
    description: 'Passez en « Contacté » dès le premier échange mairie ou DGS.',
  },
  {
    step: 2,
    title: 'Planifiez le RDV',
    description: '« RDV planifié » quand une réunion ou visite est calée.',
  },
  {
    step: 3,
    title: 'Clôturez',
    description: 'Marquez Gagné ou Perdu pour mesurer votre taux de conversion.',
  },
];

export const DOSSIER_SECTIONS = [
  { id: 'prospecter', label: 'Prospecter', shortLabel: 'Prospecter' },
  { id: 'financer', label: 'Financer', shortLabel: 'Finance' },
  { id: 'closer', label: 'Argumentaire', shortLabel: 'Pitch' },
  { id: 'exporter', label: 'Exporter', shortLabel: 'Export' },
] as const;

export const PAYWALL_INCLUDES = [
  'Montants exacts : budget travaux, aides publiques, reste à financer',
  'Liste complète des écoles avec diagnostic énergétique et contacts mairie',
  'Simulateur de financement et pitch prêt-à-l\'emploi pour le maire',
  'Carte GPS des établissements et artisans certifiés à proximité',
  'Exports tableur, dossier tiers-financement et synthèse pour élus',
] as const;

export const PERSONA_DOSSIER_TIPS = {
  btp: {
    title: 'Vous êtes entreprise de travaux',
    tips: [
      'Priorisez le CAPEX total et le nombre d’écoles pour dimensionner vos équipes.',
      'Vérifiez les alertes PAC et la période idéale de chantier par école.',
      'Contactez les mairies tôt si un AO actif est signalé sur ce territoire.',
    ],
  },
  be: {
    title: 'Vous êtes bureau d’études',
    tips: [
      'Analysez le profil DPE et les consommations kWh/m² école par école.',
      'Repérez les surdimensionnements PAC signalés avant votre audit.',
      'Exportez le CSV complet pour alimenter vos études thermiques.',
    ],
  },
  amo: {
    title: 'Vous montez le financement public',
    tips: [
      'Comparez subventions, part Fonds Vert et reste à charge après aides.',
      'Utilisez la section MGPE et la note PDF pour convaincre le DGS.',
      'Le simulateur RAC teste la sensibilité du montage aux variations d’aides.',
    ],
  },
  esco: {
    title: 'Vous mutualisez l\'exploitation-maintenance',
    tips: [
      'Priorisez les territoires 5+ écoles — volume critique pour un CPE global.',
      'Intégrez GTB / décret BACS dans votre offre mutualisée.',
      'Modélisez le gain net contractuel sur 15–20 ans avant l\'approche EPCI.',
    ],
  },
  cee: {
    title: 'Vous originez du cumac tertiaire',
    tips: [
      'Ciblez les passoires F/G — fiches BAT-TH-163 (PAC) et BAT-TH-104 (isolation).',
      'Vérifiez l\'antériorité CEE avant publication de l\'appel d\'offres.',
      'Proposez le préfinancement en échange de la cession exclusive des CEE.',
    ],
  },
} as const;
