import fs from 'fs/promises';
import { createObjectCsvWriter } from 'csv-writer';
import { attachIndustrialProfile } from '../industrial/index.js';
import { filterEetExportRows, resolveProprietaireFfoExportFields } from '../services/patrimoineFilter.js';
import { logger } from '../utils/logger.js';

const CSV_HEADER = [
  { id: 'Code_UAI', title: 'Code_UAI' },
  { id: 'Code_INSEE', title: 'Code_INSEE' },
  { id: 'Code_EPCI', title: 'Code_EPCI' },
  { id: 'Nom_EPCI', title: 'Nom_EPCI' },
  { id: 'Nom_Ecole', title: 'Nom_Ecole' },
  { id: 'Type_Patrimoine', title: 'Type_Patrimoine' },
  { id: 'Proprietaire_FFO_Forme', title: 'Proprietaire_FFO_Forme' },
  { id: 'Proprietaire_FFO_Denomination', title: 'Proprietaire_FFO_Denomination' },
  { id: 'Commune', title: 'Commune' },
  { id: 'Surface_M2', title: 'Surface_M2' },
  { id: 'Annee_Construction', title: 'Annee_Construction' },
  { id: 'Statut_DPE', title: 'Statut_DPE' },
  { id: 'Annee_DPE', title: 'Annee_DPE' },
  { id: 'Classe_DPE', title: 'Classe_DPE' },
  { id: 'Conso_Annuelle_kWh', title: 'Conso_Annuelle_kWh' },
  { id: 'Conso_Specifique_kWh_M2', title: 'Conso_Specifique_kWh_M2' },
  { id: 'Facture_Annuelle_Euros', title: 'Facture_Annuelle_Euros' },
  { id: 'Economie_Annuelle_Euros', title: 'Economie_Annuelle_Euros' },
  { id: 'Economie_Realiste_Euros', title: 'Economie_Realiste_Euros' },
  { id: 'Economie_Plancher_66pct_Euros', title: 'Economie_Plancher_66pct_Euros' },
  { id: 'Modele_Financement', title: 'Modele_Financement' },
  { id: 'CAPEX_Total', title: 'CAPEX_Total' },
  { id: 'CAPEX_HT_Euros', title: 'CAPEX_HT_Euros' },
  { id: 'Subventions_Etat_Euros', title: 'Subventions_Etat_Euros' },
  { id: 'Subventions_Pessimiste_Euros', title: 'Subventions_Pessimiste_Euros' },
  { id: 'Subventions_Optimiste_Euros', title: 'Subventions_Optimiste_Euros' },
  { id: 'Subventions_Fourchette_Label', title: 'Subventions_Fourchette_Label' },
  { id: 'CEE_Euros', title: 'CEE_Euros' },
  { id: 'Part_Fonds_Euros', title: 'Part_Fonds_Euros' },
  { id: 'Part_Fonds_Pessimiste_Euros', title: 'Part_Fonds_Pessimiste_Euros' },
  { id: 'Part_Fonds_Optimiste_Euros', title: 'Part_Fonds_Optimiste_Euros' },
  { id: 'Pack_CAPEX_Total', title: 'Pack_CAPEX_Total' },
  { id: 'Pack_Gain_Net_Pessimiste_Total', title: 'Pack_Gain_Net_Pessimiste_Total' },
  { id: 'Financement_Statut', title: 'Financement_Statut' },
  { id: 'Statut_Projet_EPCI', title: 'Statut_Projet_EPCI' },
  { id: 'Package_ID', title: 'Package_ID' },
  { id: 'Argumentaire_Loi_ELAN', title: 'Argumentaire_Loi_ELAN' },
  { id: 'Argumentaire_MGPE_PD', title: 'Argumentaire_MGPE_PD' },
  { id: 'MGPE_Loyer_Lt_Euros', title: 'MGPE_Loyer_Lt_Euros' },
  { id: 'MGPE_Redevance_Ft_Euros', title: 'MGPE_Redevance_Ft_Euros' },
  { id: 'MGPE_Part_Services_St_Euros', title: 'MGPE_Part_Services_St_Euros' },
  { id: 'MGPE_Duree_Contrat_Ans', title: 'MGPE_Duree_Contrat_Ans' },
  { id: 'Gain_Net_Contractuel_Euros', title: 'Gain_Net_Contractuel_Euros' },
  { id: 'Gain_Net_Annuel_Mairie_Euros', title: 'Gain_Net_Annuel_Mairie_Euros' },
  { id: 'Gain_Net_Pessimiste_Euros', title: 'Gain_Net_Pessimiste_Euros' },
  { id: 'Gain_Net_Optimiste_Euros', title: 'Gain_Net_Optimiste_Euros' },
  { id: 'Gain_Net_Fourchette_Label', title: 'Gain_Net_Fourchette_Label' },
  { id: 'Gain_Net_Plancher_66pct_Euros', title: 'Gain_Net_Plancher_66pct_Euros' },
  { id: 'Fonds_ROI_Annees', title: 'Fonds_ROI_Annees' },
  { id: 'Fonds_ROI_Pessimiste_Annees', title: 'Fonds_ROI_Pessimiste_Annees' },
  { id: 'Fonds_ROI_Optimiste_Annees', title: 'Fonds_ROI_Optimiste_Annees' },
  { id: 'Fonds_ROI_Fourchette_Label', title: 'Fonds_ROI_Fourchette_Label' },
  { id: 'Taux_Subvention_Pessimiste_Pct', title: 'Taux_Subvention_Pessimiste_Pct' },
  { id: 'Taux_Eco_Realiste_Pessimiste_Pct', title: 'Taux_Eco_Realiste_Pessimiste_Pct' },
  { id: 'Ratio_PAC_W_M2', title: 'Ratio_PAC_W_M2' },
  { id: 'Alerte_Surdimensionnement', title: 'Alerte_Surdimensionnement' },
  { id: 'Alerte_Surdimensionnement_Note', title: 'Alerte_Surdimensionnement_Note' },
  { id: 'Score_Eligibilite_Closing', title: 'Score_Eligibilite_Closing' },
  { id: 'Closing_Temperature', title: 'Closing_Temperature' },
  { id: 'Alerte_Financement', title: 'Alerte_Financement' },
  { id: 'Email_Mairie', title: 'Email_Mairie' },
  { id: 'Artisan_Nom', title: 'Artisan_Nom' },
  { id: 'Artisan_Distance_KM', title: 'Artisan_Distance_KM' },
  { id: 'Artisan_Email', title: 'Artisan_Email' },
  { id: 'Artisan_Tranche_Effectif', title: 'Artisan_Tranche_Effectif' },
  { id: 'Artisan_Effectif_Label', title: 'Artisan_Effectif_Label' },
  { id: 'Artisan_Effectif_Min', title: 'Artisan_Effectif_Min' },
  { id: 'Type_Travaux', title: 'Type_Travaux' },
  { id: 'Puissance_PAC_kW', title: 'Puissance_PAC_kW' },
  { id: 'Ouvriers_Requis', title: 'Ouvriers_Requis' },
  { id: 'Duree_Estimee_Semaines', title: 'Duree_Estimee_Semaines' },
  { id: 'Periode_Ideale_Chantier', title: 'Periode_Ideale_Chantier' },
  { id: 'Latitude', title: 'Latitude' },
  { id: 'Longitude', title: 'Longitude' },
];

const TECHNICAL_CSV_FIELDS = [
  'Type_Travaux',
  'Puissance_PAC_kW',
  'Ouvriers_Requis',
  'Duree_Estimee_Semaines',
  'Periode_Ideale_Chantier',
];

function prepareExportRow(row) {
  const {
    _numero_dpe,
    _capexTotal,
    _fondsRoiYears,
    _capexTechnique,
    _heuresHommesTotal,
    _surfaceIsolantM2,
    _partFondsRaw,
    _subventionCapEuros,
    _subventionRawTotal,
    _closingTempKey,
    Subventions_Detr_Euros,
    Subventions_Fonds_Vert_Euros,
    Subventions_Dsil_Euros,
    Subventions_Plafond_80pct_Applique,
    ...rest
  } = attachIndustrialProfile(row);

  const exportRow = {
    ...rest,
    ...resolveProprietaireFfoExportFields(rest, rest._bdnbLandOwner),
  };

  if (exportRow.Alerte_Surdimensionnement === true) {
    exportRow.Alerte_Surdimensionnement = 'true';
  } else if (exportRow.Alerte_Surdimensionnement === false) {
    exportRow.Alerte_Surdimensionnement = 'false';
  }

  for (const field of TECHNICAL_CSV_FIELDS) {
    if (exportRow[field] === undefined || exportRow[field] === null) {
      exportRow[field] = '';
    }
  }

  return exportRow;
}

export async function exportProspectionCsv(rows, outputFile) {
  const { kept, removed } = filterEetExportRows(rows);
  if (removed > 0) {
    logger.warn(
      `Export CSV — ${removed} ligne(s) bloquée(s) par la gate EET (${rows.length} → ${kept.length})`,
    );
  }

  const tempFile = `${outputFile}.tmp`;
  const exportRows = kept.map(prepareExportRow);

  const csvWriter = createObjectCsvWriter({
    path: tempFile,
    header: CSV_HEADER,
    fieldDelimiter: ',',
    encoding: 'utf8',
  });

  await csvWriter.writeRecords(exportRows);
  await fs.rename(tempFile, outputFile);
  return { written: kept.length, rejected: removed, total: rows.length };
}

export { CSV_HEADER, TECHNICAL_CSV_FIELDS, prepareExportRow };
