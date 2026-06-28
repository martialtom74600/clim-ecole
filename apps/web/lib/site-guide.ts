/** Parcours guidés — vocabulaire pédagogique unifié sur tout le site */

export interface GuideStep {
  step: number;
  title: string;
  description: string;
}

export const DOSSIER_UNLOCKED_GUIDE: GuideStep[] = [
  {
    step: 1,
    title: 'Prospectez les écoles',
    description:
      'Parcourez la liste triée par score, utilisez la carte et contactez les mairies en un clic.',
  },
  {
    step: 2,
    title: 'Validez le montage',
    description:
      'Simulez le reste à charge et vérifiez la répartition subventions / RAC.',
  },
  {
    step: 3,
    title: 'Préparez votre pitch',
    description:
      'Copiez l’argumentaire MGPE-PD et adaptez-le à votre rendez-vous DGS ou mairie.',
  },
  {
    step: 4,
    title: 'Exportez et suivez',
    description:
      'Téléchargez CSV, dossier MGPE ou note PDF — puis avancez le statut dans Mon compte.',
  },
];

export const DOSSIER_LOCKED_GUIDE: GuideStep[] = [
  {
    step: 1,
    title: 'Évaluez le potentiel',
    description:
      'Score Radar, tranche budget et profil DPE : suffisant pour décider si ce territoire vaut le coup.',
  },
  {
    step: 2,
    title: 'Comparez si besoin',
    description:
      'Ajoutez jusqu’à 3 territoires au comparateur Scorecard pour choisir où prospecter en premier.',
  },
  {
    step: 3,
    title: 'Débloquez pour agir',
    description:
      'L’achat révèle noms, contacts, montants exacts et exports prêts pour votre CRM ou vos rendez-vous.',
  },
];

export const EXPLORER_GUIDE: GuideStep[] = [
  {
    step: 1,
    title: 'Choisissez votre filtre',
    description: 'BTP, BE ou AMO : chaque profil met en avant ce qui compte pour votre métier.',
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
  'Montants exacts : CAPEX, subventions, reste à charge, Fonds Vert',
  'Liste complète des écoles avec DPE, surfaces et contacts mairie',
  'Simulateur de financement et argumentaires MGPE / Loi ELAN',
  'Carte des établissements et artisans RGE à proximité',
  'Exports CSV, dossier MGPE HTML et note d’opportunité PDF',
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
} as const;
