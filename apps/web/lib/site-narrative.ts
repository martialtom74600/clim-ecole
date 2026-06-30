/**
 * Copy narratif unifié — « verdict d'abord, action ensuite ».
 * Chaque page commence par une phrase qui interprète, pas une liste de features.
 */

export const SITE_JOURNEY = [
  {
    step: 1,
    title: 'Explorez',
    body: 'Carte par département, filtres métier et score A–D — repérez où prospecter.',
    href: '/explorer',
  },
  {
    step: 2,
    title: 'Lisez le verdict',
    body: "Budget, écoles F/G, niveau d'aides — décidez en 30 secondes si le territoire vaut le coup.",
    href: '/demo',
  },
  {
    step: 3,
    title: 'Débloquez & agissez',
    body: 'Contacts mairies, simulateur RAC, pitch maire et exports CRM.',
    href: '/tarifs',
  },
] as const;

export const PAGE_VERDICTS = {
  explorer: {
    label: 'Le parcours',
    headline: "Choisissez un territoire — le dossier vous dira s'il vaut le coup.",
    subline:
      'Gratuit : score, tranche budget et profil DPE. Débloqué : montants exacts, écoles et contacts.',
  },
  tarifs: {
    label: 'Le verdict',
    headline: 'Priorisez gratuitement. Payez quand vous êtes prêt à appeler une mairie.',
    subline:
      "L'explorateur suffit pour trier — le déblocage sert à chiffrer, contacter et exporter.",
  },
  compte: {
    label: 'Votre cockpit',
    headline: 'Suivez vos territoires du premier contact au marché gagné.',
    subline: 'Pipeline, alertes et territoires débloqués — synchronisés sur tous vos appareils.',
  },
  compare: {
    label: 'Le verdict',
    headline: 'Trois territoires, cinq dimensions — choisissez où prospecter en premier.',
    subline: 'Radar, CAPEX, subventions, urgence AO et ROI — classement transparent.',
  },
  parrainage: {
    label: 'Le programme',
    headline: 'Un collègue BTP, BE ou AMO gagne un mois Pro — vous aussi.',
    subline: 'Partagez votre code au premier achat de votre filleul.',
  },
  methodologie: {
    label: 'Comment ça marche',
    headline: "Des données publiques croisées pour révéler les marchés scolaires avant l'AO.",
    subline: 'BDNB, DPE, barèmes de subventions — estimations non contractuelles.',
  },
  portefeuille: {
    label: 'Le verdict',
    headline: 'Un parc scolaire entier, un véhicule finançable — CAPEX et RAC consolidés.',
    subline: 'Pour fonds infra, Banque des Territoires, SPL et tiers-financeurs.',
  },
  success: {
    label: "C'est débloqué",
    headline: 'Votre territoire est prêt — voici les 3 prochaines actions.',
    subline: 'Contactez, exportez, suivez dans le pipeline.',
  },
  onePager: {
    label: 'Pitch maire',
    headline: 'Une page pour convaincre en RDV — chiffres clés et montage.',
    subline: 'Imprimez ou exportez en PDF depuis le navigateur (Ctrl+P / ⌘P).',
  },
  note: {
    label: "Note d'opportunité",
    headline: 'Dossier technique complet — pour votre équipe interne.',
    subline: 'Marque blanche · détail école par école · non contractuel.',
  },
} as const;

/** Verdicts cockpit admin (Strate Studio). */
export const ADMIN_VERDICTS = {
  login: {
    label: 'Accès interne',
    headline: 'Cockpit origination — données complètes, non masquées.',
    subline: 'Réservé Strate Studio · prospection scolaire B2G.',
  },
  dashboard: {
    label: 'Cockpit',
    headline: 'Priorisez les territoires chauds avant vos appels mairies.',
    subline: 'KPIs, leads urgents et tri rapide — toutes les données visibles.',
  },
  epci: {
    label: 'Territoires',
    headline: 'Chaque ligne = un EPCI — plusieurs communes, un budget consolidé.',
    subline: 'Filtrez par chaleur commerciale, CAPEX ou statut pack.',
  },
  epciDetail: {
    label: 'Fiche territoire',
    headline: 'Verdict financier + liste écoles — prêt pour un appel DGS.',
    subline: 'Subventions, reste à charge et contacts en un seul écran.',
  },
  carte: {
    label: 'Carte',
    headline: 'Localisez les écoles passoires — cliquez pour ouvrir la fiche.',
    subline: 'Couverture progressive · données GPS non masquées.',
  },
  export: {
    label: 'Exports',
    headline: 'Extractions CSV pour CRM, analyse ou reporting interne.',
    subline: 'Source : output_prospection.csv consolidé.',
  },
  portefeuilles: {
    label: 'Pipeline interne',
    headline: 'Glissez vos dossiers de Repéré à Signé — suivi local sauvegardé.',
    subline: 'Chaque carte = une école ou un territoire entier.',
  },
  aide: {
    label: 'Aide',
    headline: 'Le jargon Clim École, traduit en français normal.',
    subline: 'MGPE, RAC, CEE, Fonds Vert — sans formation préalable.',
  },
} as const;
