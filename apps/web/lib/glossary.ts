/** Glossaire en français simple — Clim École */

export interface GlossaryEntry {
  term: string;
  short: string;
  plain: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'Budget travaux',
    short: 'Budget travaux',
    plain: 'Montant total estimé de la rénovation (pompe à chaleur, isolation, etc.) pour les écoles d\'un territoire.',
  },
  {
    term: 'CAPEX',
    short: 'Budget travaux',
    plain: 'Montant global de la rénovation (PAC, isolation, etc.) pour un bâtiment ou un territoire.',
  },
  {
    term: 'Territoire',
    short: 'Intercommunalité',
    plain: 'Une intercommunalité (EPCI) regroupant plusieurs communes. C\'est souvent votre interlocuteur pour les écoles.',
  },
  {
    term: 'EPCI',
    short: 'Intercommunalité',
    plain: 'Regroupement de communes (communauté de communes, agglomération, métropole). C\'est souvent votre interlocuteur public pour les écoles.',
  },
  {
    term: 'Fonds Vert',
    short: 'Aide État',
    plain: 'Subvention de l\'État pour la rénovation énergétique des bâtiments publics (écoles, mairies…).',
  },
  {
    term: 'Score de priorité',
    short: 'Score de priorité',
    plain: 'Note de A à D (sur 100) qui classe les territoires : budget, subventions, nombre de passoires, timing. B+ = dossier prioritaire.',
  },
  {
    term: 'Score Radar',
    short: 'Score de priorité',
    plain: 'Note de A à D (sur 100) qui classe les territoires : budget, subventions, nombre de passoires, timing. B+ = dossier prioritaire.',
  },
  {
    term: 'BTP',
    short: 'Entreprises de travaux',
    plain: 'Entreprises qui réalisent les chantiers (PAC, isolation, génie civil).',
  },
  {
    term: 'BE',
    short: 'Bureaux d\'études',
    plain: 'Ingénieurs et auditeurs qui dimensionnent et certifient les projets de rénovation.',
  },
  {
    term: 'AMO',
    short: 'Montage financier',
    plain: 'Assistants à maîtrise d\'ouvrage qui montent le financement public (subventions, MGPE-PD).',
  },
  {
    term: 'BDNB',
    short: 'Base bâtiments publics',
    plain: 'Base de données nationale des bâtiments — source officielle pour les diagnostics énergétiques.',
  },
  {
    term: 'Passoire thermique',
    short: 'Bâtiment très énergivore',
    plain: 'Bâtiment classé DPE F ou G — priorité absolue pour la rénovation et les subventions.',
  },
  {
    term: 'Pack EPCI',
    short: 'Lot de plusieurs écoles',
    plain: 'Plusieurs bâtiments scolaires du même territoire regroupés pour financer les travaux ensemble et atteindre les seuils de subvention.',
  },
  {
    term: 'MGPE-PD',
    short: 'Contrat de performance énergétique',
    plain: 'Montage légal (Loi 2023) : la collectivité rembourse les travaux sur la durée grâce aux économies d’énergie réellement constatées, plutôt que tout payer d’un coup.',
  },
  {
    term: 'DPE',
    short: 'Diagnostic énergétique',
    plain: 'Note de A (très performant) à G (très énergivore) qui mesure la consommation du bâtiment. F et G = priorité rénovation.',
  },
  {
    term: 'Lead chaud',
    short: 'Opportunité prioritaire',
    plain: 'Dossier très favorable : bon score, bon financement, bon timing. À traiter en premier.',
  },
  {
    term: 'Lead tiède',
    short: 'Opportunité moyenne',
    plain: 'Potentiel réel mais avec un frein (seuil, ROI, regroupement à faire…).',
  },
  {
    term: 'Reste à charge (RAC)',
    short: 'Part payée par la collectivité',
    plain: 'Ce qui reste à financer après les subventions de l’État et les aides. C’est la part que le montage MGPE-PD peut lisser dans le temps.',
  },
  {
    term: 'Subventions',
    short: 'Aides publiques',
    plain: 'Argent de l’État (Fonds Vert, DETR, etc.) qui réduit le coût des travaux pour la collectivité.',
  },
  {
    term: 'ROI',
    short: 'Retour sur investissement',
    plain: 'Nombre d’années pour que les économies d’énergie « remboursent » la part investie. Plus c’est bas, plus c’est intéressant.',
  },
  {
    term: 'Gain net mairie',
    short: 'Économie annuelle pour la collectivité',
    plain: 'Argent que la mairie ou l’intercommunalité économise chaque année sur les factures, après déduction du contrat MGPE-PD.',
  },
  {
    term: 'Origination B2G',
    short: 'Prospection vers le public',
    plain: 'B2G = Business to Government. Tu identifies et qualifies des projets de rénovation auprès des collectivités, avant la vente/contrat.',
  },
  {
    term: 'Pipeline',
    short: 'Suivi commercial',
    plain: 'Où en est chaque dossier dans ton processus : repéré → qualifié → dossier monté → proposition → signé.',
  },
  {
    term: 'Quick Triage',
    short: 'Classement rapide',
    plain: 'Les 5 plus gros packs EPCI par budget travaux — pour décider où concentrer ton énergie commerciale.',
  },
  {
    term: 'Solo finançable',
    short: 'Une école seule suffit',
    plain: 'Le bâtiment peut être financé sans attendre de regrouper d’autres écoles du territoire.',
  },
  {
    term: 'Projet global validé',
    short: 'Pack prêt côté budget',
    plain: 'L’intercommunalité a un pack assez gros et cohérent pour lancer une opération globale.',
  },
  {
    term: 'Sous seuil à creuser',
    short: 'Pack trop petit pour l’instant',
    plain: 'Il manque peut-être des écoles ou du volume pour débloquer les meilleures aides — à investiguer.',
  },
  {
    term: 'Code UAI',
    short: 'Identifiant officiel de l’école',
    plain: 'Numéro unique du ministère de l’Éducation pour chaque établissement scolaire.',
  },
];

export function getGlossary(term: string): GlossaryEntry | undefined {
  const key = term.toLowerCase();
  return GLOSSARY.find(
    (g) =>
      g.term.toLowerCase() === key ||
      g.short.toLowerCase() === key,
  );
}
