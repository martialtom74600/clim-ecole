import { getDetrSubsidyRate } from '../finance/subsidyEngine.js';
import { aggregateCommuneClosingScore } from '../finance/closingScoreEngine.js';
import { formatDualScenarioLabels } from '../finance/scenarioEngine.js';
import { resolveCommune } from './populationCache.js';
import { buildMgpePdBrief } from '../legal/mgpePdFramework.js';

function departmentFromInsee(codeInsee) {
  return String(codeInsee ?? '').slice(0, 2);
}

function resolveInseeMeta(row, populationMaps) {
  const registry = populationMaps.registry ?? {};
  const codeFromRow = row.Code_INSEE ? String(row.Code_INSEE) : null;

  if (codeFromRow) {
    return {
      code: codeFromRow,
      source: 'pipeline',
      verified: Boolean(registry[codeFromRow] || populationMaps.byInsee.has(codeFromRow)),
    };
  }

  const resolved = resolveCommune(row, populationMaps);
  if (resolved?.code) {
    return {
      code: resolved.code,
      source: codeFromRow ? 'cache' : 'name_match',
      verified: Boolean(registry[resolved.code]),
    };
  }

  return { code: codeFromRow, source: 'missing', verified: false };
}

function pickMairieEmail(schools) {
  const counts = new Map();
  for (const school of schools) {
    const email = String(school.Email_Mairie ?? '').trim();
    if (email) {
      counts.set(email, (counts.get(email) ?? 0) + 1);
    }
  }
  if (counts.size === 0) {
    return '';
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function schoolSummary(row) {
  return {
    codeUai: row.Code_UAI,
    nom: row.Nom_Ecole,
    surfaceM2: row.Surface_M2,
    anneeConstruction: row.Annee_Construction,
    classeDpe: row.Classe_DPE,
    statutDpe: row.Statut_DPE,
    consoKwh: row.Conso_Annuelle_kWh,
    factureEuros: row.Facture_Annuelle_Euros,
    economieEuros: row.Economie_Annuelle_Euros,
    capexTotal: row.CAPEX_Total,
    partFonds: row.Part_Fonds_Euros,
    subventions: row.Subventions_Etat_Euros,
    cee: row.CEE_Euros,
    financementStatut: row.Financement_Statut,
    packageId: row.Package_ID,
    artisanNom: row.Artisan_Nom,
    artisanEmail: row.Artisan_Email,
    artisanDistanceKm: row.Artisan_Distance_KM,
    argumentaireElan: row.Argumentaire_Loi_ELAN,
  };
}

export function buildCommunesIndex(schools, populationMaps) {
  const registry = populationMaps.registry ?? {};
  const groups = new Map();

  for (const row of schools) {
    const inseeMeta = resolveInseeMeta(row, populationMaps);
    const codeInsee = inseeMeta.code ?? `__unknown_${row.Commune ?? row.Code_UAI}`;

    if (!groups.has(codeInsee)) {
      const official = registry[codeInsee];
      groups.set(codeInsee, {
        codeInsee: codeInsee.startsWith('__unknown_') ? null : codeInsee,
        nomOfficiel: official?.nom ?? row.Commune ?? 'Commune inconnue',
        population: official?.population ?? populationMaps.byInsee.get(codeInsee) ?? null,
        departement: official?.departement ?? departmentFromInsee(codeInsee),
        schools: [],
        inseeSources: new Set(),
        verified: true,
      });
    }

    const group = groups.get(codeInsee);
    group.schools.push(row);
    group.inseeSources.add(inseeMeta.source);
    if (!inseeMeta.verified) {
      group.verified = false;
    }
  }

  return [...groups.values()]
    .map((group) => {
      const population = group.population;
      const detrRate = getDetrSubsidyRate(population);
      const emailMairie = pickMairieEmail(group.schools);

      const totals = group.schools.reduce(
        (acc, s) => {
          acc.surfaceM2 += s.Surface_M2 ?? 0;
          acc.capex += s.CAPEX_Total ?? 0;
          acc.economies += s.Economie_Annuelle_Euros ?? 0;
          acc.partFonds += s.Part_Fonds_Euros ?? 0;
          acc.subventions += s.Subventions_Etat_Euros ?? 0;
          acc.subventionsPessimiste += s.Subventions_Pessimiste_Euros ?? s.Subventions_Etat_Euros ?? 0;
          acc.subventionsOptimiste += s.Subventions_Optimiste_Euros ?? s.Subventions_Etat_Euros ?? 0;
          acc.gainNetPessimiste += s.Gain_Net_Pessimiste_Euros ?? s.Gain_Net_Annuel_Mairie_Euros ?? 0;
          acc.gainNetOptimiste += s.Gain_Net_Optimiste_Euros ?? s.Gain_Net_Annuel_Mairie_Euros ?? 0;
          acc.cee += s.CEE_Euros ?? 0;
          acc.facture += s.Facture_Annuelle_Euros ?? 0;
          return acc;
        },
        {
          surfaceM2: 0,
          capex: 0,
          economies: 0,
          partFonds: 0,
          subventions: 0,
          subventionsPessimiste: 0,
          subventionsOptimiste: 0,
          gainNetPessimiste: 0,
          gainNetOptimiste: 0,
          cee: 0,
          facture: 0,
        },
      );

      const fourchetteLabels = formatDualScenarioLabels({
        Subventions_Pessimiste_Euros: totals.subventionsPessimiste,
        Subventions_Optimiste_Euros: totals.subventionsOptimiste,
        Gain_Net_Pessimiste_Euros: totals.gainNetPessimiste,
        Gain_Net_Optimiste_Euros: totals.gainNetOptimiste,
        Fonds_ROI_Pessimiste_Annees: null,
        Fonds_ROI_Optimiste_Annees: null,
      });

      const dataQuality =
        group.codeInsee &&
        !group.inseeSources.has('missing') &&
        !group.inseeSources.has('name_match')
          ? 'verified'
          : group.codeInsee
            ? 'partial'
            : 'unverified';

      const closing = aggregateCommuneClosingScore(group.schools);

      return {
        codeInsee: group.codeInsee,
        nomOfficiel: group.nomOfficiel,
        population,
        departement: group.departement,
        emailMairie,
        detrRatePct: Math.round(detrRate * 100),
        schoolCount: group.schools.length,
        scoreClosing: closing.score,
        closingTemperature: `${closing.temperature.emoji} ${closing.temperature.label}`,
        ...totals,
        subventionsFourchetteLabel: fourchetteLabels.subventionsLabel,
        gainNetFourchetteLabel: fourchetteLabels.gainNetLabel,
        soloCount: group.schools.filter((s) => s.Financement_Statut === 'FINANÇABLE_SOLO').length,
        dataQuality,
        sharePath: group.codeInsee ? `/?insee=${group.codeInsee}` : null,
        ecoles: group.schools.map(schoolSummary).sort((a, b) => b.surfaceM2 - a.surfaceM2),
      };
    })
    .sort((a, b) => a.nomOfficiel.localeCompare(b.nomOfficiel, 'fr'));
}

export function buildCommuneDossier(codeInsee, schools, populationMaps) {
  const communes = buildCommunesIndex(schools, populationMaps);
  const dossier = communes.find((c) => c.codeInsee === String(codeInsee));
  if (!dossier) {
    return null;
  }
  return {
    ...dossier,
    generatedAt: new Date().toISOString(),
    precisionNote:
      dossier.dataQuality === 'verified'
        ? 'Données rattachées au code INSEE officiel de la commune (source Éducation nationale + geo.api.gouv.fr).'
        : 'Certaines données ont été rapprochées par nom de commune — relancez le pipeline pour une précision INSEE à 100 %.',
    mgpePd: buildMgpePdBrief(dossier),
  };
}
