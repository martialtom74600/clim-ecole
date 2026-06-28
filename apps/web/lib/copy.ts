/** Vocabulaire unifié — tout le site parle la même langue */

export const COPY = {
  productName: 'Clim École',
  explorer: 'Explorateur',
  region: 'France',
  subscription: 'Abonnement territorial',

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
  partFondsVert: 'Part Fonds Vert (pessimiste)',
  partFondsVertHint: 'Estimation prudente de la part couverte par le Fonds Vert — à valider avec le montage financier',
  resteAChargeAfterSubs: 'Reste à charge après subventions',
  resteAChargeAfterSubsHint: 'Budget travaux moins subventions publiques estimées (hors MGPE-PD)',
  gainNetMairie: 'Gain net mairie / an',
  gainNetMairieHint: 'Économies nettes estimées pour la collectivité après redevance',
  statutProjet: 'Statut projet EPCI',
  scoreClosing: 'Score closing',
  dataFreshness: 'Données mises à jour le',
  methodologyLink: 'Méthodologie & sources',
  exportMgpeHtml: 'Dossier MGPE (HTML)',
  exportCsvFull: 'Export CSV complet',
  emailMissing: 'Email mairie non renseigné',
  ecoles: 'Écoles concernées',
  scorePriorite: 'Score de priorité',
  scorePrioriteHint: 'Note de A (excellent) à D (faible). B+ et budget > 400 k€ = dossier prioritaire.',

  qualifiedCriteria: 'Score B ou mieux et budget travaux supérieur à 400 000 €',

  paywallTitle: 'Débloquer ce territoire',
  paywallDesc: 'Montants exacts, liste école par école, contacts mairies, simulateur RAC et export PDF.',

  freePreviewTitle: 'Aperçu gratuit',
  freePreviewHint: 'Tranches et profil énergétique — pas les montants exacts ni les contacts.',
  budgetRangeHint: 'Tranche indicative — montant exact après déblocage',

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
  esco: { short: 'ESCO', long: 'Exploitants & CPE' },
  cee: { short: 'CEE', long: 'Délégataires CEE' },
} as const;
