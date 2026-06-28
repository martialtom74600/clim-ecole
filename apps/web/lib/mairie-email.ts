import type { MarketplaceBuilding } from './types';
import type { ClientPersona } from './brand';
import { formatEur } from './format';

export function buildMairieEmail(params: {
  building: MarketplaceBuilding;
  territoryName: string;
  packCapexTotal: number;
  gainNetMairieTotal: number;
  persona: ClientPersona;
  senderName?: string;
  senderCompany?: string;
}): { subject: string; body: string; mailto: string } {
  const { building, territoryName, packCapexTotal, gainNetMairieTotal, persona, senderName, senderCompany } =
    params;

  const sign = senderName
    ? `${senderName}${senderCompany ? ` — ${senderCompany}` : ''}`
    : 'Votre interlocuteur';

  const intro =
    persona === 'amo'
      ? `En tant qu'assistant à maîtrise d'ouvrage, nous accompagnons les collectivités sur la rénovation énergétique du patrimoine scolaire.`
      : persona === 'be'
        ? `Notre bureau d'études intervient sur le diagnostic et le montage financier de projets de performance énergétique des bâtiments publics.`
        : `Notre entreprise intervient en rénovation énergétique tertiaire (PAC, isolation) sur le patrimoine public.`;

  const subject = `Rénovation énergétique — ${building.publicCommune} (${territoryName})`;

  const body = [
    `Madame, Monsieur le Maire,`,
    ``,
    `Je me permets de vous contacter concernant la rénovation énergétique de ${building.publicName} à ${building.publicCommune}.`,
    ``,
    intro,
    ``,
    `Sur votre territoire (${territoryName}), nos estimations indiquent :`,
    `• Un potentiel de travaux d'environ ${formatEur(packCapexTotal, true)} (périmètre écoles / patrimoine scolaire)`,
    `• Un gain net estimé pour la collectivité de l'ordre de ${formatEur(gainNetMairieTotal, true)}/an après montage MGPE-PD`,
    building.classeDpe ? `• DPE actuel de l'établissement : ${building.classeDpe.charAt(0).toUpperCase()}` : null,
    ``,
    `Seriez-vous disponible pour un échange de 20 minutes afin de présenter les subventions mobilisables (Fonds Vert, DETR) et un scénario de reste à charge maîtrisé ?`,
    ``,
    `Bien cordialement,`,
    sign,
  ]
    .filter(Boolean)
    .join('\n');

  const to = building.emailMairie ?? '';
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailto };
}
