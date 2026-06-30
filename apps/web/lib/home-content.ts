import type { ClientPersona } from './brand';
import { PERSONA_LANDINGS } from './gtm';

/** Copy homepage — qualification & conversion (ROI acheteur d'abord). */

export const HOME_HERO = {
  eyebrow: 'Intelligence commerciale · Marchés publics scolaires',
  headline: 'Sécurisez les marchés de rénovation scolaire avant l\'appel d\'offres.',
  subline:
    'Clim École croise bâtiments publics, DPE et barèmes de subventions pour vous livrer le CAPEX, le reste à charge, les contacts mairie et le montage MGPE-PD — avant que l\'AO ne soit publié.',
  microProof:
    'Gratuit : carte, scores A–D, tranches budget. Déblocage dès 290 € HT quand vous êtes prêt à appeler.',
  ctaPrimary: 'Prioriser mes territoires',
  ctaDemo: 'Voir un dossier complet',
} as const;

export const HOME_PERSONA_SECTION = {
  label: 'Votre métier',
  title: 'Qui êtes-vous ?',
  description:
    'Choisissez votre profil — on vous montre le ROI qui vous concerne, pas celui des autres.',
  linkLabel: 'Voir votre solution',
  financeLinkLabel: 'Ouvrir le portefeuille national',
  fallback: 'Pas sûr ? Parcourir tous les territoires gratuitement',
} as const;

export type HomePersonaCard = {
  id: ClientPersona | 'finance';
  label: string;
  punchline: string;
  roiFlash: string;
  href: string;
  linkLabel?: string;
};

export const HOME_PERSONA_CARDS: HomePersonaCard[] = (
  ['btp', 'be', 'amo', 'esco', 'cee', 'finance'] as const
).map((id) => {
  const landing = PERSONA_LANDINGS[id];
  return {
    id,
    label: landing.personaLabel,
    punchline: landing.jobToBeDone,
    roiFlash: landing.roiTrigger,
    href: id === 'finance' ? '/portefeuille' : `/${id}`,
    linkLabel: id === 'finance' ? HOME_PERSONA_SECTION.financeLinkLabel : undefined,
  };
});

export const HOME_WAR_ROOM = {
  label: 'Le dossier type',
  title: 'À quoi ressemble une War Room Territoriale ?',
  description:
    'Ce que vous recevez quand vous débloquez un EPCI — lu en 30 secondes.',
  sampleVerdict: {
    territory: 'Collectivité · Région · Score A',
    verdict: '12 écoles F/G · 1,2 M€ CAPEX · RAC 180 k€ lissé sur 15 ans',
    decision: 'Prioritaire — AO actif ou consultation préalable en cours',
  },
  blocks: [
    {
      title: 'Le verdict',
      body: 'Budget, subventions, profil DPE — décidez avant de creuser.',
    },
    {
      title: 'Le terrain',
      body: 'Carte GPS, liste écoles, DPE bâtiment par bâtiment, contacts mairie.',
    },
    {
      title: 'Le financement',
      body: 'Simulateur RAC, empilement Fonds Vert + DETR + CEE, export MGPE-PD.',
    },
    {
      title: 'L\'action',
      body: 'Pitch maire PDF, email pré-rempli, export CRM, pipeline de suivi.',
    },
  ],
} as const;

export const HOME_ROI = {
  label: 'Retour sur investissement',
  title: 'Un territoire débloqué vaut plus qu\'un mois de prospection à l\'aveugle.',
  description:
    'Le coût n\'est pas l\'abonnement — c\'est le marché que vous ratez en appelant au mauvais endroit.',
  without: [
    'Appels mairies au hasard',
    'Zéro visibilité CAPEX',
    'Réponse AO en 15 jours (15 % win-rate)',
    '1 commercial × 3 semaines ≈ 4 500 € de coût interne',
    '1 marché perdu = −800 k€ de CA',
  ],
  with: [
    'Contacts ciblés, territoires > 400 k€ score A/B',
    'CAPEX exact + RAC + montage MGPE-PD',
    'Consultation préalable R2111-1 (70 % win-rate cible)',
    '1 dossier × 30 minutes = 290 € HT',
    '1 marché gagné = +1 M€ de CA',
  ],
  calc: {
    invest: '290 € HT / territoire (ou 990 €/mois illimité)',
    upside: '1 marché BTP > 1 M€ · 1 mission AMO 15–50 k€ · 1 convention CEE dès J+1',
    ratio: 'Ratio 1 : 3 000 minimum sur un seul closing.',
  },
  quote:
    'Le gratuit suffit pour prioriser. Le payant sert à chiffrer et appeler — pas avant.',
} as const;

export const HOME_OFFER = {
  title: 'Gratuit vs débloqué',
  description: 'Prioriser gratuitement. Payer quand vous êtes prêt à appeler une mairie.',
  free: {
    title: 'Prioriser un territoire',
    items: [
      'Carte + score + tranche budget',
      'Profil DPE agrégé',
      'Filtres par métier (BTP, BE, AMO, ESCO, CEE)',
    ],
  },
  paid: {
    title: 'Chiffrer et contacter',
    items: [
      'CAPEX exact + RAC + MGPE-PD',
      'Écoles + contacts mairie + carte GPS',
      'Simulateur + exports PDF/CSV',
    ],
  },
} as const;

export const HOME_FINAL_CTA = {
  title: 'Prêt à prospecter avant vos concurrents ?',
  description: 'Commencez par parcourir les territoires. Aucune carte bancaire.',
} as const;
