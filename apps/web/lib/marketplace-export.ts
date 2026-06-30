import type { MarketplaceBuilding, MarketplacePack } from './types';
import { resteACharge, subventionsFromRatio } from './finance-math';

function csvCell(value: string | number | boolean | null | undefined): string {
  if (value == null || value === '') return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `"${String(value).replace(/"/g, '""')}"`;
}

const CRM_HEADERS = [
  'Territoire',
  'Département',
  'École',
  'Commune',
  'Email_Mairie',
  'DPE',
  'Surface_m2',
  'CAPEX_EUR',
  'Part_Fonds_Vert_Pessimiste_EUR',
  'Reste_A_Charge_Apres_Subventions_EUR',
  'Gain_Net_Mairie_EUR',
  'ROI_Fonds_Annees',
  'Temperature',
  'Score_Radar',
  'Grade_Radar',
];

const FULL_HEADERS = [
  ...CRM_HEADERS,
  'Code_UAI',
  'Type_Travaux',
  'Puissance_PAC_kW',
  'Duree_Semaines',
  'Periode_Chantier',
  'Facture_Annuelle_EUR',
  'Conso_kWh_m2',
  'Annee_DPE',
  'Score_Closing',
  'Alerte_Financement',
  'Alerte_Surdimensionnement',
  'Artisan_Nom',
  'Artisan_Email',
  'Artisan_Distance_km',
  'Latitude',
  'Longitude',
];

function buildingRow(pack: MarketplacePack, b: MarketplaceBuilding, full: boolean): string {
  const base = [
    csvCell(pack.publicName),
    pack.department,
    csvCell(b.realName ?? b.publicName),
    csvCell(b.realCommune ?? b.publicCommune),
    b.emailMairie ?? '',
    b.classeDpe,
    b.surfaceM2,
    b.capexTotal,
    b.partFondsVert ?? b.resteACharge,
    b.resteAChargeAfterSubs ?? resteACharge(b.capexTotal, subventionsFromRatio(b.capexTotal, pack.subventionRatio)),
    b.gainNetMairie,
    b.roiAnnees,
    csvCell(b.closingTemperature),
    pack.radarScore,
    pack.radarGrade,
  ];

  if (!full) return base.join(',');

  return [
    ...base,
    b.codeUai ?? '',
    csvCell(b.typeTravaux),
    b.puissancePacKw ?? '',
    b.dureeEstimeeSemaines ?? '',
    csvCell(b.periodeIdealeChantier),
    b.factureAnnuelleEuros ?? '',
    b.consoSpecifiqueKwhM2 ?? '',
    b.anneeDpe ?? '',
    b.scoreEligibiliteClosing ?? '',
    csvCell(b.alerteFinancement),
    b.alerteSurdimensionnement ? '1' : '0',
    csvCell(b.artisanNom),
    b.artisanEmail ?? '',
    b.artisanDistanceKm ?? '',
    b.latitude ?? '',
    b.longitude ?? '',
  ].join(',');
}

export function buildPackCsv(
  pack: MarketplacePack,
  buildings: MarketplaceBuilding[],
  options?: { full?: boolean },
): string {
  const full = options?.full ?? false;
  const headers = full ? FULL_HEADERS : CRM_HEADERS;
  const rows = buildings.map((b) => buildingRow(pack, b, full));
  const bom = '\uFEFF';
  return bom + [headers.join(','), ...rows].join('\n');
}
