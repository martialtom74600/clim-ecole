import { loadDashboardData } from './dataService.js';
import { loadPopulationMaps } from './populationCache.js';
import { loadArtisansCache } from './artisansCache.js';
import { resolveSchoolCoordinates } from './schoolCoordsService.js';
import { buildCommunesIndex } from './communeIndex.js';
import { generateArgumentaireMgpePdEcole } from '../legal/mgpePdFramework.js';
import { config } from '../config.js';
import { formatTrancheEffectif } from '../services/artisansService.js';
import { getPackageColor } from '../utils/packageColors.js';
import { ensureEpciGeometries, getEpciGeometrySync } from '../services/epciGeometryService.js';
import { convexHull, expandHull } from '../utils/convexHull.js';
import { STATUT_PROJET_GLOBAL_VALIDE } from '../finance/poolingEngine.js';

const DPE_COLORS = {
  A: '#34d399',
  B: '#a3e635',
  C: '#facc15',
  D: '#fb923c',
  E: '#f87171',
  F: '#ef4444',
  G: '#dc2626',
};

function dpeColor(grade) {
  return DPE_COLORS[String(grade ?? '').toUpperCase().charAt(0)] ?? '#94a3b8';
}

function centroid(points) {
  if (!points.length) return null;
  const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

function buildArtisanNodes(schools, artisansCache) {
  const schoolById = new Map(schools.map((s) => [s.Code_UAI, s]));
  const byKey = new Map();

  for (const school of schools) {
    const siret = school.Artisan_SIRET || school.Artisan_Nom;
    if (!siret) continue;

    if (!byKey.has(siret)) {
      const effectif = formatTrancheEffectif(school.Artisan_Tranche_Effectif);
      byKey.set(siret, {
        id: siret,
        siret: school.Artisan_SIRET || null,
        nom: school.Artisan_Nom,
        email: school.Artisan_Email ?? '',
        lat: school.Artisan_Latitude ?? null,
        lon: school.Artisan_Longitude ?? null,
        trancheEffectif: school.Artisan_Tranche_Effectif || effectif.code || null,
        effectifLabel: school.Artisan_Effectif_Label || effectif.label || null,
        effectifMin: school.Artisan_Effectif_Min ?? effectif.min ?? null,
        schoolIds: [],
        packageIds: new Set(),
        approximate: false,
      });
    }

    const node = byKey.get(siret);
    node.schoolIds.push(school.Code_UAI);
    if (school.Package_ID?.startsWith('PKG-') || school.Package_ID?.startsWith('EPCI-')) {
      node.packageIds.add(school.Package_ID);
    }
    if (school.Artisan_Latitude != null && node.lat == null) {
      node.lat = school.Artisan_Latitude;
      node.lon = school.Artisan_Longitude;
    }
  }

  for (const cached of artisansCache) {
    for (const node of byKey.values()) {
      if (node.trancheEffectif == null && (node.siret === cached.siret || node.nom === cached.nom)) {
        const effectif = formatTrancheEffectif(cached.trancheEffectif);
        node.trancheEffectif = effectif.code || null;
        node.effectifLabel = effectif.label;
        node.effectifMin = effectif.min;
      }
      if (node.lat != null) continue;
      if (node.siret === cached.siret || node.nom === cached.nom) {
        node.lat = cached.lat;
        node.lon = cached.lon;
      }
    }
  }

  for (const node of byKey.values()) {
    if (node.lat != null) continue;
    const pts = node.schoolIds
      .map((id) => schoolById.get(id))
      .filter((s) => s?.Latitude != null)
      .map((s) => ({ lat: s.Latitude, lng: s.Longitude }));
    const c = centroid(pts);
    if (c) {
      node.lat = c.lat + 0.008;
      node.lon = c.lng + 0.008;
      node.approximate = true;
    }
  }

  return [...byKey.values()]
    .filter((a) => a.lat != null && a.lon != null)
    .map((a) => ({
      ...a,
      packageIds: [...a.packageIds],
      schoolCount: a.schoolIds.length,
    }));
}

function centroidFromPolygons(polygons) {
  const outer = polygons?.[0]?.[0];
  if (!outer?.length) return null;
  return centroid(outer.map(([lat, lng]) => ({ lat, lng })));
}

function buildFallbackBlob(points) {
  if (!points.length) return null;
  if (points.length === 1) {
    const p = points[0];
    const d = 0.035;
    return [[
      [p.lat + d, p.lng],
      [p.lat, p.lng + d * 1.3],
      [p.lat - d, p.lng],
      [p.lat, p.lng - d * 1.3],
    ]];
  }
  const hull = expandHull(convexHull(points), points.length <= 2 ? 1.45 : 1.22);
  if (hull.length < 3) return null;
  return [[hull.map((p) => [p.lat, p.lng])]];
}

function resolveNomEpci(pkg, geom, school, codeEpci) {
  const candidates = [geom?.nom, pkg?.nomEpci, school.Nom_EPCI, codeEpci].filter(Boolean);
  for (const name of candidates) {
    const s = String(name).trim();
    if (s && !/^\d+$/.test(s)) return s;
  }
  return geom?.nom ?? candidates[0] ?? codeEpci;
}

function buildEpciTerritoryZones(schools, packages, draftPackages, epciGeometries) {
  const schoolById = new Map(schools.map((s) => [s.Code_UAI, s]));
  const metaById = new Map(
    [...packages, ...draftPackages].map((pkg) => [pkg.id, pkg]),
  );
  const zones = [];
  const seen = new Set();

  for (const school of schools) {
    const codeEpci = String(school.Code_EPCI ?? '').trim();
    if (!codeEpci) continue;

    const id = school.Package_ID?.startsWith('EPCI-') ? school.Package_ID : `EPCI-${codeEpci}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const pkg = metaById.get(id);
    const schoolIds = schools
      .filter((s) => String(s.Code_EPCI ?? '') === codeEpci)
      .map((s) => s.Code_UAI);

    const points = schoolIds
      .map((uai) => schoolById.get(uai))
      .filter((s) => s?.Latitude != null)
      .map((s) => ({ lat: s.Latitude, lng: s.Longitude }));

    if (!points.length) continue;

    const geom = epciGeometries.get(codeEpci) ?? getEpciGeometrySync(codeEpci);
    const polygons = geom?.polygons ?? buildFallbackBlob(points);
    if (!polygons?.length) continue;

    const ticketValid = pkg?.statutProjetEpci === STATUT_PROJET_GLOBAL_VALIDE
      || Boolean(pkg?.packFinancable ?? pkg?.ticketValid);
    const isDraft = Boolean(pkg && !ticketValid);
    const nomEpci = resolveNomEpci(pkg, geom, school, codeEpci);
    const partFondsTotal = Math.round(
      pkg?.partFondsTotal
      ?? schoolIds.reduce((sum, uai) => sum + (Number(schoolById.get(uai)?.Part_Fonds_Euros) || 0), 0),
    );
    const minPartFondsMilestone = config.finance.minPackagePartFonds;
    const partFondsMilestone = partFondsTotal >= minPartFondsMilestone;
    const targetPartFonds = pkg?.targetPartFonds ?? minPartFondsMilestone;
    const progressPct = ticketValid
      ? 100
      : Math.min(99, targetPartFonds > 0 ? Math.round((partFondsTotal / targetPartFonds) * 100) : 0);

    zones.push({
      id,
      codeEpci,
      nomEpci,
      isDraft,
      ticketValid,
      partFondsMilestone,
      partFondsTotal,
      hasOfficialContour: Boolean(geom?.polygons?.length),
      capexTotal: pkg?.capexTotal ?? 0,
      gainNetPessimisteTotal: pkg?.gainNetPessimisteTotal ?? 0,
      targetPartFonds,
      progressPct,
      schoolIds,
      center: centroidFromPolygons(polygons) ?? centroid(points),
      polygons,
      color: getPackageColor(id),
    });
  }

  return zones.sort((a, b) => b.schoolIds.length - a.schoolIds.length);
}

function buildLinks(schools, mairiesByInsee, artisansById) {
  const links = [];

  for (const school of schools) {
    const packageId = String(school.Package_ID ?? '');
    const legacyPack = packageId.startsWith('PKG-') || packageId.startsWith('DRAFT-');

    const artisanId = school.Artisan_SIRET || school.Artisan_Nom;
    const artisan = artisansById.get(artisanId);
    if (legacyPack && artisan?.lat != null) {
      links.push({
        type: 'school-artisan-package',
        packageId,
        schoolId: school.Code_UAI,
        artisanId,
        distanceKm: school.Artisan_Distance_KM,
        coords: [
          [school.Latitude, school.Longitude],
          [artisan.lat, artisan.lon],
        ],
      });
    }

    const mairie = mairiesByInsee.get(String(school.Code_INSEE ?? ''));
    if (mairie?.lat != null) {
      links.push({
        type: 'mairie-school',
        schoolId: school.Code_UAI,
        communeInsee: mairie.id,
        coords: [
          [mairie.lat, mairie.lon],
          [school.Latitude, school.Longitude],
        ],
      });
    }
  }

  return links;
}

export async function buildMapData(outputFile = config.outputFile, dashboardData = null) {
  const dashboard = dashboardData ?? (await loadDashboardData(outputFile));
  const [populationMaps, artisansCache, epciGeometries] = await Promise.all([
    loadPopulationMaps(),
    loadArtisansCache(),
    ensureEpciGeometries(),
  ]);

  const schools = dashboardData
    ? dashboard.schools.filter((s) => s.Latitude != null && s.Longitude != null)
    : await resolveSchoolCoordinates(dashboard.schools, { requireCoords: true });
  const communes = buildCommunesIndex(schools, populationMaps);
  const registry = populationMaps.registry ?? {};

  const mairies = communes
    .map((c) => {
      const reg = registry[c.codeInsee] ?? {};
      const lat = reg.lat ?? null;
      const lon = reg.lon ?? null;
      return {
        id: c.codeInsee,
        nom: c.nomOfficiel,
        lat,
        lon,
        population: c.population,
        email: c.emailMairie,
        schoolCount: c.schoolCount,
        capex: c.capex,
        economies: c.economies,
        subventions: c.subventions,
        subventionsFourchetteLabel: c.subventionsFourchetteLabel,
        gainNetFourchetteLabel: c.gainNetFourchetteLabel,
        scoreClosing: c.scoreClosing ?? 0,
        closingTemperature: c.closingTemperature ?? '',
        schoolIds: c.ecoles.map((e) => e.codeUai),
        dataQuality: c.dataQuality,
        sharePath: c.sharePath,
      };
    })
    .filter((m) => m.lat != null && m.lon != null);

  const mairiesByInsee = new Map(mairies.map((m) => [String(m.id), m]));

  const schoolNodes = schools.map((s) => ({
    id: s.Code_UAI,
    nom: s.Nom_Ecole,
    commune: s.Commune,
    codeInsee: s.Code_INSEE,
    lat: s.Latitude,
    lon: s.Longitude,
    surfaceM2: s.Surface_M2,
    classeDpe: s.Classe_DPE,
    dpeColor: dpeColor(s.Classe_DPE),
    capex: s.CAPEX_Total,
    economies: s.Economie_Annuelle_Euros,
    partFonds: s.Part_Fonds_Euros,
    typePatrimoine: s.Type_Patrimoine,
    proprietaireFfoForme: s.Proprietaire_FFO_Forme,
    proprietaireFfoDenomination: s.Proprietaire_FFO_Denomination,
    financement: s.Financement_Statut,
    packageId: s.Package_ID,
    codeEpci: s.Code_EPCI,
    nomEpci: s.Nom_EPCI,
    artisanId: s.Artisan_SIRET || s.Artisan_Nom,
    artisanNom: s.Artisan_Nom,
    artisanEmail: s.Artisan_Email,
    artisanDistanceKm: s.Artisan_Distance_KM,
    artisanEffectifLabel: s.Artisan_Effectif_Label,
    artisanEffectifMin: s.Artisan_Effectif_Min,
    emailMairie: s.Email_Mairie,
    argumentaireElan: s.Argumentaire_Loi_ELAN,
    argumentaireMgpePd: s.Argumentaire_MGPE_PD || generateArgumentaireMgpePdEcole(s),
    typeTravaux: s.Type_Travaux,
    puissancePacKw: s.Puissance_PAC_kW,
    ouvriersRequis: s.Ouvriers_Requis,
    dureeSemaines: s.Duree_Estimee_Semaines,
    periodeChantier: s.Periode_Ideale_Chantier,
    scoreClosing: s.Score_Eligibilite_Closing ?? 0,
    closingTemperature: s.Closing_Temperature ?? '',
  }));

  const packageZones = buildEpciTerritoryZones(
    schools,
    dashboard.packages,
    dashboard.draftPackages,
    epciGeometries,
  );
  const artisans = buildArtisanNodes(schools, artisansCache);
  const artisansById = new Map(artisans.map((a) => [a.id, a]));
  const links = buildLinks(schools, mairiesByInsee, artisansById);

  const bounds = schoolNodes.length
    ? schoolNodes.reduce(
        (b, s) => ({
          south: Math.min(b.south, s.lat),
          north: Math.max(b.north, s.lat),
          west: Math.min(b.west, s.lon),
          east: Math.max(b.east, s.lon),
        }),
        { south: 90, north: -90, west: 180, east: -180 },
      )
    : { south: 45.5, north: 46.5, west: 5.5, east: 7.5 };

  return {
    bounds,
    stats: {
      schools: schoolNodes.length,
      mairies: mairies.length,
      artisans: artisans.length,
      packagesValid: dashboard.packages.length,
      packagesDraft: dashboard.draftPackages.length,
      links: links.length,
    },
    schools: schoolNodes,
    mairies,
    artisans,
    packages: packageZones,
    links,
    kpis: dashboard.kpis,
    meta: dashboard.meta,
    config: { departments: config.departments },
  };
}
