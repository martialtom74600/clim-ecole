/** Vocabulaire unifié — tout le site parle la même langue */

export const COPY = {
  productName: 'Clim École',
  explorer: 'Explorateur',
  region: 'Auvergne-Rhône-Alpes',
  subscription: 'Abonnement AURA',

  territory: 'territoire',
  territoryPlural: 'territoires',
  dossier: 'dossier',

  viewDossier: 'Voir le dossier',
  openExplorer: 'Ouvrir l\'explorateur',
  backToExplorer: 'Retour à l\'explorateur',
  compare: 'Comparer',
  addToFavorites: 'Ajouter aux favoris',
  removeFromFavorites: 'Retirer des favoris',

  qualified: 'Dossier prioritaire',
  hot: 'Urgent',
  new: 'Nouveau',
  masked: 'Identité masquée',
  unlocked: 'Dossier débloqué',
  soldOut: 'Places épuisées',

  filterQualified: 'Prioritaires',
  filterAll: 'Tous',
  filterFavorites: 'Favoris',

  budgetTravaux: 'Budget travaux',
  budgetTravauxHint: 'Coût total estimé de la rénovation (PAC, isolation…)',
  resteACharge: 'Reste à charge collectivité',
  resteAChargeHint: 'Part payée par la mairie ou l\'intercommunalité après les subventions',
  subventions: 'Subventions publiques',
  subventionsHint: 'Aides de l\'État (Fonds Vert, DETR…) qui réduisent le coût',
  fondsVert: 'Potentiel Fonds Vert',
  fondsVertHint: 'Aide de l\'État pour la rénovation des bâtiments publics',
  ecoles: 'Écoles concernées',
  scorePriorite: 'Score de priorité',
  scorePrioriteHint: 'Note de A (excellent) à D (faible). B+ et budget > 400 k€ = dossier prioritaire.',

  qualifiedCriteria: 'Score B ou mieux et budget travaux supérieur à 400 000 €',

  paywallTitle: 'Débloquer ce territoire',
  paywallDesc: 'Noms des communes et écoles, contacts mairies, carte précise, export PDF.',

  accountNoAccess: 'Aucun achat actif sur cet navigateur',
  accountAccessHint: 'Après paiement, votre accès est mémorisé sur cet appareil (pas de mot de passe).',

  estimatesNote: 'Montants estimés à partir de données publiques — non contractuels.',
  mapFreeHint: 'Carte par département uniquement — la localisation exacte est réservée aux dossiers achetés',
} as const;

export const SCORE_GRADES = {
  A: 'Excellent — à traiter en premier',
  B: 'Bon — dossier actionnable',
  C: 'Moyen — à creuser',
  D: 'Faible — peu prioritaire',
} as const;

export const PERSONA_FILTER_LABELS = {
  btp: { short: 'BTP', long: 'Entreprises de travaux' },
  be: { short: 'BE', long: 'Bureaux d\'études' },
  amo: { short: 'AMO', long: 'Montage financier' },
} as const;
