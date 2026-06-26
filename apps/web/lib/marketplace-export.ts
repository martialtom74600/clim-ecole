import type { MarketplaceBuilding, MarketplacePack } from './types';

export function buildPackCsv(pack: MarketplacePack, buildings: MarketplaceBuilding[]): string {
  const headers = [
    'Territoire',
    'Département',
    'École',
    'Commune',
    'Email_Mairie',
    'DPE',
    'Surface_m2',
    'CAPEX_EUR',
    'Reste_A_Charge_EUR',
    'Gain_Net_Mairie_EUR',
    'ROI_Fonds_Annees',
    'Temperature',
    'Score_Radar',
    'Grade_Radar',
  ];

  const rows = buildings.map((b) =>
    [
      `"${(pack.publicName || '').replace(/"/g, '""')}"`,
      pack.department,
      `"${(b.realName ?? b.publicName).replace(/"/g, '""')}"`,
      `"${(b.realCommune ?? b.publicCommune).replace(/"/g, '""')}"`,
      b.emailMairie ?? '',
      b.classeDpe,
      b.surfaceM2,
      b.capexTotal,
      b.resteACharge,
      b.gainNetMairie,
      b.roiAnnees,
      `"${b.closingTemperature.replace(/"/g, '""')}"`,
      pack.radarScore,
      pack.radarGrade,
    ].join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}
