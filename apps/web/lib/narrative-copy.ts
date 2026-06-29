import { formatEur, formatPct } from '@/lib/format';

/** Transforme un montant brut en phrase lisible */
export function narrativeBudget(capex: number, schoolCount: number): string {
  const schools = `${schoolCount} école${schoolCount > 1 ? 's' : ''}`;
  return `Les travaux sur ${schools} représentent environ ${formatEur(capex, true)}`;
}

export function narrativeRac(rac: number, subventionRatio: number): string {
  return `Après les aides publiques (~${formatPct(subventionRatio)}), il reste ${formatEur(rac, true)} à financer pour la mairie`;
}

export function narrativeGain(gain: number): string {
  if (gain <= 0) return 'Les économies d’énergie couvrent le montage sur la durée du contrat';
  return `La commune économisera ${formatEur(gain, true)} / an sur ses factures d’énergie`;
}

export function narrativeRoi(years: number): string {
  if (years <= 0) return 'Le projet se rembourse grâce aux économies d’énergie';
  return `Les économies remboursent l’investissement en environ ${Math.round(years)} ans`;
}

export function narrativeSubventions(amount: number, ratio: number): string {
  return `L’État et les collectivités peuvent financer jusqu’à ${formatEur(amount, true)} (~${formatPct(ratio)}) des travaux`;
}

export function simplifyPitchForMayor(
  rawMgpe: string | undefined,
  rawElan: string | undefined,
  ctx: {
    territoryName: string;
    batimentCount: number;
    racTotal: number;
    gainNet: number;
    duree: number;
  },
): string {
  const schools = `${ctx.batimentCount} école${ctx.batimentCount > 1 ? 's' : ''}`;
  const intro =
    `Madame, Monsieur le Maire,\n\n` +
    `Notre diagnostic identifie ${schools} à rénover sur ${ctx.territoryName}, ` +
    `sans avance de trésorerie pour la commune.\n\n` +
    `Le principe : un partenaire finance et réalise les travaux. ` +
    `La commune rembourse uniquement via les économies constatées sur les factures d’énergie ` +
    `sur ${ctx.duree} ans — le reste à financer (${formatEur(ctx.racTotal, true)}) ` +
    `est couvert par cette baisse de dépense.\n\n`;

  const gain =
    ctx.gainNet > 0
      ? `À terme, la collectivité dégage environ ${formatEur(ctx.gainNet, true)} par an d’économies nettes.\n\n`
      : '';

  const legal =
    rawElan
      ? `Cadre légal : la loi ELAN autorise ce montage pour les bâtiments publics, sans dette classique.\n\n`
      : '';

  const closing =
    `Je serais ravi d’échanger 20 minutes pour vous présenter le détail école par école.\n\n` +
    `Cordialement`;

  const technical = [rawMgpe, rawElan].filter(Boolean).join('\n\n');
  if (technical.length > 200) {
    return intro + gain + legal + closing;
  }
  return intro + gain + (technical ? `${technical}\n\n` : '') + closing;
}
