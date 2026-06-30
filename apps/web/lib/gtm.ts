import type { ClientPersona } from './brand';
import { PRICING, formatAmount } from './pricing';

export interface PersonaLandingContent {
  id: ClientPersona | 'finance';
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
  jobToBeDone: string;
  useCase: string;
  roiTrigger: string;
  metrics: { label: string; value: string }[];
  playbookSteps: { title: string; body: string }[];
  ctaLabel: string;
  ctaHref: string;
  pricingHint: string;
}

export const PERSONA_LANDINGS: Record<ClientPersona | 'finance', PersonaLandingContent> = {
  btp: {
    id: 'btp',
    slug: 'btp',
    heroTitle: 'Sourcer les marchés scolaires avant l\'appel d\'offres',
    heroSubtitle:
      'Identifiez les EPCI à fort CAPEX, démarchez les maires avec un pré-montage MGPE-PD et orientez le CCTP vers votre solution.',
    jobToBeDone: 'Passer d\'une réponse AO réactive (15 % win-rate) à un sourcing proactif (R2111-1).',
    useCase:
      'War Room territoriale : 12 écoles F/G, 1,2 M€ CAPEX, RAC 180 k€ lissé sur 15 ans — présentation clé en main au président d\'EPCI.',
    roiTrigger: '1 marché sécurisé > 1 M€ vs abonnement 990 €/mois.',
    metrics: [
      { label: 'Win-rate cible', value: '70 %' },
      { label: 'CAPEX min. actionnable', value: '400 k€' },
      { label: 'Délai sourcing', value: 'Avant AO' },
    ],
    playbookSteps: [
      { title: 'Repérer', body: 'Filtrez les territoires > 400 k€ avec score A/B et AO actif.' },
      { title: 'Démarcher', body: 'Email mairie + one-pager RAC / MGPE-PD pré-calculé.' },
      { title: 'Co-construire', body: 'Consultation préalable — orientez le marché vers MGPE-PD.' },
      { title: 'Clôturer', body: 'Suivez Contacté → RDV → Gagné dans le pipeline.' },
    ],
    ctaLabel: 'Ouvrir l\'explorateur BTP',
    ctaHref: '/explorer?filter=btp',
    pricingHint: '290 € / territoire · 990 €/mois illimité',
  },
  be: {
    id: 'be',
    slug: 'be',
    heroTitle: 'Vendre l\'AMO avec le Reste à Charge comme lead magnet',
    heroSubtitle:
      'Démontrez en 5 minutes que la commune peut financer l\'étude grâce à EduRénov / ACTEE — avant qu\'elle n\'hésite sur le coût des travaux.',
    jobToBeDone: 'Transformer la prudence budgétaire de l\'élu en mandat d\'ingénierie (15–50 k€).',
    useCase:
      '« Monsieur le Maire, 80 % du projet est subventionnable — mandatez notre AMO pour sécuriser le montage. »',
    roiTrigger: '1 mission AMO remboursée couvre des années d\'abonnement.',
    metrics: [
      { label: 'Mission AMO type', value: '15–50 k€' },
      { label: 'Cible', value: 'Écoles F/G / territoire' },
      { label: 'Prise en charge études', value: 'EduRénov / ACTEE' },
    ],
    playbookSteps: [
      { title: 'Auditer', body: 'Profil DPE F/G, surfaces, consommations kWh/m².' },
      { title: 'Simuler', body: 'RAC post-subventions + potentiel Fonds Vert 40 %.' },
      { title: 'Proposer', body: 'Note PDF + dossier MGPE pour le conseil municipal.' },
      { title: 'Mandater', body: 'Mission AMO financée par guichet public.' },
    ],
    ctaLabel: 'Territoires BE / AMO',
    ctaHref: '/explorer?filter=be',
    pricingHint: '290 € / territoire · exports CSV complets',
  },
  amo: {
    id: 'amo',
    slug: 'amo',
    heroTitle: 'Monter le MGPE-PD avant que la collectivité ne bloque',
    heroSubtitle:
      'Subventions, Fonds Vert, loyer LT, redevance FT — argumentaire financier prêt pour le DGS et le contrôle de légalité.',
    jobToBeDone: 'Résoudre l\'équation RAC + faisabilité juridique MGPE-PD en amont du vote.',
    useCase:
      'Simulateur interactif : durée contrat 10–25 ans, scénarios pessimiste/optimiste, checklist antériorité CEE.',
    roiTrigger: '1 montage validé = plusieurs centaines de k€ d\'honoraires AMO.',
    metrics: [
      { label: 'Ratio subventions cible', value: '> 40 %' },
      { label: 'Durée MGPE', value: '10–20 ans' },
      { label: 'Gain net mairie', value: 'Modélisé' },
    ],
    playbookSteps: [
      { title: 'Empiler', body: 'Fonds Vert + DETR + CEE — vérifiez le gain 40 % requis.' },
      { title: 'Simuler', body: 'RAC, loyer LT, ROI mairie sur 15 ans.' },
      { title: 'Rédiger', body: 'Export MGPE HTML + note PDF marque blanche.' },
      { title: 'Valider', body: 'Étude de soutenabilité budgétaire (Fin Infra 4 sem.).' },
    ],
    ctaLabel: 'Dossiers montage financier',
    ctaHref: '/explorer?filter=amo',
    pricingHint: '990 €/mois · tous territoires',
  },
  esco: {
    id: 'esco',
    slug: 'esco',
    heroTitle: 'Massifier les CPE sur un parc scolaire entier',
    heroSubtitle:
      'Identifiez les grappes d\'écoles mutualisables à l\'échelle EPCI pour déployer GTB, PAC et exploitation 15–20 ans.',
    jobToBeDone: 'Atteindre le volume critique pour un MGPE mutualisé rentable.',
    useCase:
      '8+ écoles F/G sur un même territoire → proposition CPE global avec Energy Manager dédié.',
    roiTrigger: 'OPEX récurrent 15–20 ans vs coût fixe de transaction par école isolée.',
    metrics: [
      { label: 'Écoles min. mutualisation', value: '5+' },
      { label: 'Durée exploitation', value: '15–20 ans' },
      { label: 'Décret BACS', value: 'GTB incluse' },
    ],
    playbookSteps: [
      { title: 'Cartographier', body: 'Filtrez territoires mutualisables (5+ écoles, > 800 k€).' },
      { title: 'Modéliser', body: 'Gain net contractuel MGPE + GPE sur le parc entier.' },
      { title: 'Proposer', body: 'Marché global EPCI — pas école par école.' },
      { title: 'Exploiter', body: 'Phase EM 15 ans — flux récurrent sécurisé.' },
    ],
    ctaLabel: 'Territoires ESCO',
    ctaHref: '/explorer?filter=esco',
    pricingHint: '990 €/mois · alertes AO',
  },
  cee: {
    id: 'cee',
    slug: 'cee',
    heroTitle: 'Originer du cumac sur les passoires thermiques scolaires',
    heroSubtitle:
      'Listes F/G, fiches BAT-TH, estimation kWh cumac — remplacez le phoning aléatoire par de la prospection déterministe.',
    jobToBeDone: 'Sécuriser des volumes cumac P6 à faible coût d\'acquisition.',
    useCase:
      'Cibler les écoles fioul → PAC (BAT-TH-163) avec préfinancement et cession CEE exclusive.',
    roiTrigger: '290 € absorbés dès la 1ère convention CEE signée.',
    metrics: [
      { label: 'Fiches BAT', value: '5 principales' },
      { label: 'Valorisation cumac', value: 'Indicative' },
      { label: 'Antériorité PNCEE', value: 'Checklist intégrée' },
    ],
    playbookSteps: [
      { title: 'Segmenter', body: 'Filtrez F/G + chauffage fossile + cumac > seuil.' },
      { title: 'Chiffrer', body: 'Estimation cumac kWh par école et par territoire.' },
      { title: 'Préfinancer', body: 'Proposition clé en main à la mairie — convention avant AO.' },
      { title: 'Valoriser', body: 'Cession CEE P6 — traçabilité PNCEE.' },
    ],
    ctaLabel: 'Territoires CEE',
    ctaHref: '/explorer?filter=cee',
    pricingHint: '2 990 €/mois · module Origination CEE',
  },
  finance: {
    id: 'finance',
    slug: 'finance',
    heroTitle: 'Data Room nationale pour déployer du capital territorial',
    heroSubtitle:
      'SPL, STF, fonds Greenfin : bundling de dizaines d\'écoles en portefeuille SPV, API et fraîcheur garantie.',
    jobToBeDone: 'Agréger des micro-projets scolaires en actifs infrastructure dé-risqués.',
    useCase:
      '40 écoles / département → 25 M€ CAPEX, 10 M€ subventions, 15 M€ à financer via MGPE-PD.',
    roiTrigger: 'Rendement long terme souverain — risque collectivité quasi nul.',
    metrics: [
      { label: 'Bundling', value: 'Multi-EPCI' },
      { label: 'Accès', value: 'API + exports' },
      { label: 'Fraîcheur', value: 'Sync nightly' },
    ],
    playbookSteps: [
      { title: 'Scanner', body: 'Cartographie nationale passoires + RAC agrégé.' },
      { title: 'Structurer', body: 'SPV + consortium EG / exploitant.' },
      { title: 'Déployer', body: 'Préfinancement intégral du RAC collectivités.' },
      { title: 'Rembourser', body: 'Loyers lissés sur économies d\'énergie 15 ans.' },
    ],
    ctaLabel: 'Nous contacter',
    ctaHref: '/tarifs?plan=dataroom',
    pricingHint: '5 000 €/mois · Data Room National',
  },
};

export const PRICING_TIERS = [
  {
    id: 'dossier',
    name: 'Un territoire',
    price: formatAmount(PRICING.dossier),
    period: '€ HT',
    desc: 'War Room complète — 1 EPCI, 30 jours.',
    features: ['CAPEX, RAC, MGPE-PD', 'Contacts mairies', 'Exports CSV / PDF', 'Email mairie pré-rempli'],
    highlight: false,
    checkout: true as const,
  },
  {
    id: 'pro',
    name: 'Radar Pro',
    price: formatAmount(PRICING.pro),
    period: '€ HT / mois',
    desc: 'Illimité France progressive — équipe commerciale.',
    features: ['Tous territoires', 'Alertes email', 'Pipeline CRM', '3 utilisateurs'],
    highlight: true,
    checkout: true as const,
  },
  {
    id: 'team',
    name: 'Radar Équipe',
    price: formatAmount(PRICING.team),
    period: '€ HT / mois',
    desc: 'Agence BET 5–10 commerciaux — pipeline partagé.',
    features: ['10 sièges', 'Watchlist équipe', 'Exports bulk', 'Support prioritaire'],
    highlight: false,
    checkout: false as const,
    contact: true,
  },
  {
    id: 'cee',
    name: 'Origination CEE',
    price: formatAmount(PRICING.cee),
    period: '€ HT / mois',
    desc: 'Délégataires — cumac, fiches BAT, campagnes.',
    features: ['Filtres F/G + cumac', 'Estimation kWh cumac', 'Export campagne', 'Alertes passoires'],
    highlight: false,
    checkout: false as const,
    contact: true,
  },
  {
    id: 'dataroom',
    name: 'Data Room National',
    price: formatAmount(PRICING.dataroom),
    period: '€ HT / mois',
    desc: 'SPL, fonds infra, majors — API & bundling.',
    features: ['Accès API', 'Bundling multi-EPCI', 'SLA fraîcheur', 'Account manager'],
    highlight: false,
    checkout: false as const,
    contact: true,
  },
] as const;

export const SALES_PLAYBOOK = [
  {
    phase: 'Sourcing (R2111-1)',
    steps: [
      'Consultation préalable mairie / EPCI — pas encore d\'AO',
      'One-pager RAC + MGPE-PD joint au premier contact',
      'Objectif : mandat AMO ou accord de principe sur le montage',
    ],
  },
  {
    phase: 'Montage financier',
    steps: [
      'Empilement Fonds Vert (gain 40 %) + DETR + CEE',
      'Simulateur RAC + scénarios pessimiste/optimiste',
      'Checklist antériorité CEE avant publication AO',
    ],
  },
  {
    phase: 'Closing',
    steps: [
      'RDV conseil municipal avec note PDF marque blanche',
      'Pipeline : Contacté → RDV → Gagné',
      'Partage dossier 7 j avec associé / BE',
    ],
  },
] as const;
