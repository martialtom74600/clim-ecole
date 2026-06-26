/** Pages détail Commune & École — v4 Zen */

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function fmtCompactEur(n, fmtEur) {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `${(v / 1e6).toFixed(1).replace('.0', '')} M€`;
  if (v >= 1000) return `${Math.round(v / 1000)} k€`;
  return fmtEur.format(v);
}

function finTag(status) {
  if (status === 'FINANÇABLE_SOLO') return 'Solo';
  if (status === 'PACK_FINANÇABLE_EPCI') return 'Pack EPCI';
  if (status === 'À_REGROUPER' || status === 'À_PACKAGER') return 'À regrouper';
  return status || '—';
}

function dpeBarPct(grade) {
  const order = { A: 14, B: 28, C: 42, D: 57, E: 71, F: 85, G: 100 };
  return order[String(grade ?? '').toUpperCase().charAt(0)] ?? 50;
}

/** Extrait l'identifiant RNB/BDNB depuis Code_UAI (ex. BDNB-bdnb-bg-…) */
export function extractBdnbRnb(codeUai) {
  const u = String(codeUai ?? '');
  if (u.startsWith('BDNB-')) return u.slice(5);
  return null;
}

/** Agrège la matrice cadastrale depuis les lignes exportées (0 requête réseau) */
export function buildCommuneFoncierMatrix(schools, insee) {
  const siren = schools.map((r) => String(r.Code_EPCI ?? '').trim()).find((s) => /^\d{9}$/.test(s)) ?? schools[0]?.Code_EPCI ?? '—';
  const rnbIds = new Set();
  for (const row of schools) {
    const rnb = extractBdnbRnb(row.Code_UAI);
    if (rnb) rnbIds.add(rnb);
  }

  const fiches = [...schools]
    .sort((a, b) => (b.Surface_M2 ?? 0) - (a.Surface_M2 ?? 0))
    .map((row, idx) => ({
      ref: extractBdnbRnb(row.Code_UAI) ? `RNB ${extractBdnbRnb(row.Code_UAI)}` : `UAI ${row.Code_UAI}`,
      rnb: extractBdnbRnb(row.Code_UAI),
      label: row.Nom_Ecole,
      surface: row.Surface_M2 ?? 0,
      ffoForme: row.Proprietaire_FFO_Forme,
      ffoDenom: row.Proprietaire_FFO_Denomination,
      type: row.Type_Patrimoine,
      uai: row.Code_UAI,
      lat: row.Latitude,
      lon: row.Longitude,
      idx,
    }));

  return {
    insee,
    siren,
    buildingCount: schools.length,
    rnbCount: rnbIds.size,
    totalSurface: schools.reduce((s, r) => s + (r.Surface_M2 ?? 0), 0),
    fiches,
  };
}

function buildFoncierFicheHtml(fiche, fmt) {
  return `
    <article class="dt-foncier-card">
      <div class="dt-foncier-card-head">
        <span class="dt-foncier-ref">${esc(fiche.ref)}</span>
        <span class="dt-foncier-surface">${fmt.format(fiche.surface)} m²</span>
      </div>
      <p class="dt-foncier-label">${esc(fiche.label)}</p>
      <dl class="dt-foncier-dl">
        <div><dt>Propriétaire FFO</dt><dd>${esc(fiche.ffoForme ?? '—')}${fiche.ffoDenom ? ` · ${esc(fiche.ffoDenom)}` : ''}</dd></div>
        <div><dt>Type patrimoine</dt><dd>${esc(fiche.type ?? '—')}</dd></div>
        ${fiche.lat != null ? `<div><dt>Géolocalisation</dt><dd class="dt-mono">${Number(fiche.lat).toFixed(5)}, ${Number(fiche.lon).toFixed(5)}</dd></div>` : ''}
      </dl>
      <a href="/e/${esc(fiche.uai)}" class="dt-foncier-link" data-nav-school="${esc(fiche.uai)}">Dossier école →</a>
    </article>`;
}

export function buildFoncierPanelHtml(matrix, fmt) {
  return `
    <section class="dt-section">
      <p class="dt-eyebrow">Matrice cadastrale &amp; BDNB</p>
      <p class="dt-prose">Preuves brutes extraites des exports BDNB / FFO pour répondre aux questions d'inventaire du DGS.</p>
      <div class="dt-foncier-meta">
        <div class="dt-foncier-stat"><span class="dt-foncier-stat-lbl">SIREN EPCI</span><span class="dt-foncier-stat-val">${esc(matrix.siren)}</span></div>
        <div class="dt-foncier-stat"><span class="dt-foncier-stat-lbl">Code INSEE</span><span class="dt-foncier-stat-val">${esc(matrix.insee)}</span></div>
        <div class="dt-foncier-stat"><span class="dt-foncier-stat-lbl">Bâtiments exportés</span><span class="dt-foncier-stat-val">${matrix.buildingCount}</span></div>
        <div class="dt-foncier-stat"><span class="dt-foncier-stat-lbl">Identifiants RNB</span><span class="dt-foncier-stat-val">${matrix.rnbCount}</span></div>
        <div class="dt-foncier-stat"><span class="dt-foncier-stat-lbl">Surface totale</span><span class="dt-foncier-stat-val">${fmt.format(matrix.totalSurface)} m²</span></div>
      </div>
    </section>
    <section class="dt-section">
      <p class="dt-eyebrow">Parcelles &amp; bâtiments liés à l'export</p>
      <div class="dt-foncier-grid">
        ${matrix.fiches.map((f) => buildFoncierFicheHtml(f, fmt)).join('')}
      </div>
    </section>`;
}

export function buildWorkTimelineHtml(row) {
  const artisan = row.Artisan_Nom ?? 'Artisan RGE';
  const periode = String(row.Periode_Ideale_Chantier ?? '').trim();
  const duree = row.Duree_Estimee_Semaines ?? 8;
  const steps = [];

  const yearMatch = periode.match(/20\d{2}/);
  const y = yearMatch ? yearMatch[0] : '2026';

  if (/été/i.test(periode) && /automne/i.test(periode)) {
    steps.push({ when: `Juin–Juillet ${y}`, label: 'Phase d\'études & dossiers DETR' });
    steps.push({ when: `Été ${y}`, label: 'Travaux enveloppe — préparation réseaux' });
    steps.push({ when: `Toussaint ${y}`, label: `Intervention par ${artisan}` });
    steps.push({ when: `Automne ${y}`, label: 'Mise en service PAC & réception' });
  } else if (periode) {
    const parts = periode.split('+').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      steps.push({ when: parts[0], label: 'Phase d\'études & préparation' });
      steps.push({ when: parts[1], label: `Chantier — ${artisan}` });
    } else {
      steps.push({ when: periode, label: `Chantier (${duree} sem.) — ${artisan}` });
    }
  } else {
    steps.push({ when: 'M−3', label: 'Phase d\'études' });
    steps.push({ when: `S+${duree}`, label: `Intervention — ${artisan}` });
  }

  return `
    <ol class="dt-timeline">
      ${steps.map((s, i) => `
        <li class="dt-timeline-item${i === steps.length - 1 ? ' is-last' : ''}">
          <span class="dt-timeline-when">${esc(s.when)}</span>
          <span class="dt-timeline-label">${esc(s.label)}</span>
        </li>`).join('')}
    </ol>`;
}

export function buildMgpeZenBlock(mp, fmtEur) {
  if (!mp?.simulation) return '';
  const sim = mp.simulation;
  return `
    <section class="dt-section">
      <p class="dt-eyebrow">Montage MGPE-PD</p>
      <p class="dt-prose">${esc(mp.argumentaire ?? '')}</p>
      <div class="dt-metric-row">
        <div class="dt-metric"><span class="dt-metric-lbl">Loyer Lt / an</span><span class="dt-metric-val">${fmtEur.format(sim.loyerSynallagmatiqueEstime ?? 0)}</span></div>
        <div class="dt-metric"><span class="dt-metric-lbl">Gain énergie cible</span><span class="dt-metric-val dt-accent">−${sim.gainEnergieCiblePct ?? '—'} %</span></div>
        <div class="dt-metric"><span class="dt-metric-lbl">Subvention estimée</span><span class="dt-metric-val">${mp.tauxSubventionEstimePct ?? '—'} %</span></div>
      </div>
      ${mp.alertes?.length ? `<ul class="dt-alerts">${mp.alertes.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
    </section>`;
}

function buildSchoolCard(row, fmt, fmtEur) {
  const dpe = String(row.Classe_DPE ?? '—').charAt(0);
  return `
    <a href="/e/${esc(row.Code_UAI)}" class="dt-school-card" data-nav-school="${esc(row.Code_UAI)}">
      <div class="dt-school-card-head">
        <span class="dt-dpe-letter">${esc(dpe)}</span>
        <div class="dt-dpe-track"><span style="width:${dpeBarPct(row.Classe_DPE)}%"></span></div>
      </div>
      <h3 class="dt-school-name">${esc(row.Nom_Ecole)}</h3>
      <p class="dt-school-meta">${fmt.format(row.Surface_M2 ?? 0)} m² · ${esc(finTag(row.Financement_Statut))}</p>
      <p class="dt-school-capex">${fmtCompactEur(row.CAPEX_Total, fmtEur)}</p>
    </a>`;
}

export function buildCommuneDetailHtml(dossier, schools, fmt, fmtEur) {
  const lead = schools.find((r) => r.Proprietaire_FFO_Denomination) ?? schools[0];
  const ffoTitle = String(lead?.Proprietaire_FFO_Denomination ?? dossier.nomOfficiel ?? '').toUpperCase();

  return `
    <header class="dt-hero">
      <nav class="dt-crumb">
        <button type="button" class="dt-back" data-nav-back>← Retour</button>
        <span class="dt-crumb-sep">/</span>
        <span>Commune</span>
      </nav>
      <p class="dt-eyebrow">Dossier communal · INSEE ${esc(dossier.codeInsee)}</p>
      <h1 class="dt-title">${esc(dossier.nomOfficiel)}</h1>
      <p class="dt-subtitle">${esc(dossier.departement ?? '')}${dossier.population ? ` · ${fmt.format(dossier.population)} hab.` : ''}${dossier.emailMairie ? ` · <a href="mailto:${esc(dossier.emailMairie)}" class="dt-link">${esc(dossier.emailMairie)}</a>` : ''}</p>
    </header>

    <section class="dt-section dt-ffo-block">
      <p class="dt-eyebrow">Propriétaire foncier · FFO DGFiP</p>
      <h2 class="dt-ffo-title">${esc(ffoTitle)}</h2>
      <span class="dt-pill">${esc(lead?.Proprietaire_FFO_Forme ?? 'COMMUNE')}</span>
    </section>

    <section class="dt-section dt-kpi-strip">
      <div class="dt-kpi"><span class="dt-kpi-lbl">CAPEX total</span><span class="dt-kpi-val">${fmtCompactEur(dossier.capex, fmtEur)}</span></div>
      <div class="dt-kpi"><span class="dt-kpi-lbl">Reste à charge fonds</span><span class="dt-kpi-val">${fmtCompactEur(dossier.partFonds, fmtEur)}</span></div>
      <div class="dt-kpi dt-kpi-accent"><span class="dt-kpi-lbl">Gain annuel</span><span class="dt-kpi-val">${esc(dossier.gainNetFourchetteLabel ?? fmtCompactEur(dossier.economies, fmtEur))}</span></div>
    </section>

    <nav class="dt-subnav" role="tablist">
      <button type="button" class="dt-subnav-tab active" data-commune-tab="synthese" role="tab">Synthèse</button>
      <button type="button" class="dt-subnav-tab" data-commune-tab="foncier" role="tab">Foncier / Cadastre</button>
    </nav>

    <div class="dt-tab-panel is-active" data-commune-panel="synthese">
    <div id="dt-mgpe-slot"></div>

    <section class="dt-section">
      <div class="dt-section-head">
        <p class="dt-eyebrow">Patrimoine scolaire</p>
        <span class="dt-count">${dossier.schoolCount ?? schools.length} établissement${(dossier.schoolCount ?? schools.length) > 1 ? 's' : ''}</span>
      </div>
      <div class="dt-school-grid">
        ${schools.map((r) => buildSchoolCard(r, fmt, fmtEur)).join('')}
      </div>
    </section>

    <footer class="dt-actions">
      <button type="button" id="dt-commune-lemlist" class="dt-btn dt-btn-primary">Copier le Pitch Lemlist</button>
      <button type="button" id="dt-commune-pdf" class="dt-btn dt-btn-ghost">Générer le PDF de Closing</button>
    </footer>
    </div>

    <div class="dt-tab-panel hidden" data-commune-panel="foncier" id="dt-foncier-panel"></div>`;
}

export function buildSchoolDetailHtml(row, fmt, fmtEur) {
  const dpe = String(row.Classe_DPE ?? '—').charAt(0);
  const insee = row.Code_INSEE;

  return `
    <header class="dt-hero dt-hero-split">
      <div class="dt-hero-main">
      <nav class="dt-crumb">
        <button type="button" class="dt-back" data-nav-back>← Retour</button>
        <span class="dt-crumb-sep">/</span>
        ${insee ? `<a href="/c/${esc(insee)}" class="dt-crumb-link" data-nav-commune="${esc(insee)}">${esc(row.Commune)}</a><span class="dt-crumb-sep">/</span>` : `<span>${esc(row.Commune)}</span><span class="dt-crumb-sep">/</span>`}
        <span>École</span>
      </nav>
      <div class="dt-hero-row">
        <span class="dt-dpe-badge">${esc(dpe)}</span>
        <div>
          <h1 class="dt-title">${esc(row.Nom_Ecole)}</h1>
          <p class="dt-subtitle">${esc(row.Commune)} · UAI ${esc(row.Code_UAI)} · ${fmt.format(row.Surface_M2 ?? 0)} m²</p>
        </div>
      </div>
      </div>
      <aside class="dt-hero-aside">
        ${row.Latitude != null ? `<div id="school-mini-map" class="dt-mini-map" data-lat="${row.Latitude}" data-lon="${row.Longitude}"></div>` : ''}
        <div class="dt-timeline-wrap">
          <p class="dt-eyebrow">Planification travaux</p>
          ${buildWorkTimelineHtml(row)}
        </div>
      </aside>
    </header>

    <section class="dt-section dt-ffo-block">
      <p class="dt-eyebrow">Propriétaire foncier · FFO DGFiP</p>
      <h2 class="dt-ffo-title">${esc(String(row.Proprietaire_FFO_Denomination ?? row.Commune ?? '').toUpperCase())}</h2>
      <span class="dt-pill">${esc(row.Proprietaire_FFO_Forme ?? row.Type_Patrimoine ?? 'Patrimoine public')}</span>
    </section>

    <section class="dt-section dt-kpi-strip">
      <div class="dt-kpi"><span class="dt-kpi-lbl">CAPEX</span><span class="dt-kpi-val">${fmtCompactEur(row.CAPEX_Total, fmtEur)}</span></div>
      <div class="dt-kpi"><span class="dt-kpi-lbl">Reste à charge fonds</span><span class="dt-kpi-val">${fmtCompactEur(row.Part_Fonds_Euros, fmtEur)}</span></div>
      <div class="dt-kpi dt-kpi-accent"><span class="dt-kpi-lbl">Gain annuel</span><span class="dt-kpi-val">${fmtCompactEur(row.Gain_Net_Annuel_Mairie_Euros ?? row.Economie_Realiste_Euros, fmtEur)}</span></div>
    </section>

    <section class="dt-section">
      <p class="dt-eyebrow">Finance &amp; montage</p>
      <div class="dt-spec-grid">
        <div class="dt-spec"><span class="dt-spec-lbl">Statut</span><span class="dt-spec-val">${esc(finTag(row.Financement_Statut))}</span></div>
        <div class="dt-spec"><span class="dt-spec-lbl">Subventions</span><span class="dt-spec-val">${esc(row.Subventions_Fourchette_Label ?? fmtEur.format(row.Subventions_Etat_Euros ?? 0))}</span></div>
        <div class="dt-spec"><span class="dt-spec-lbl">CEE</span><span class="dt-spec-val">${fmtEur.format(row.CEE_Euros ?? 0)}</span></div>
        <div class="dt-spec"><span class="dt-spec-lbl">EPCI</span><span class="dt-spec-val">${esc(row.Nom_EPCI ?? row.Package_ID ?? '—')}</span></div>
        <div class="dt-spec"><span class="dt-spec-lbl">Conso annuelle</span><span class="dt-spec-val">${fmt.format(row.Conso_Annuelle_kWh ?? 0)} kWh</span></div>
        <div class="dt-spec"><span class="dt-spec-lbl">Facture actuelle</span><span class="dt-spec-val">${fmtEur.format(row.Facture_Annuelle_Euros ?? 0)}</span></div>
      </div>
    </section>

    ${row.Type_Travaux ? `
    <section class="dt-section">
      <p class="dt-eyebrow">Travaux prévus</p>
      <p class="dt-lead">${esc(row.Type_Travaux)}</p>
      <div class="dt-spec-grid">
        <div class="dt-spec"><span class="dt-spec-lbl">PAC</span><span class="dt-spec-val">${row.Puissance_PAC_kW ?? '—'} kW</span></div>
        <div class="dt-spec"><span class="dt-spec-lbl">Durée chantier</span><span class="dt-spec-val">${row.Duree_Estimee_Semaines ?? '—'} sem.</span></div>
        <div class="dt-spec"><span class="dt-spec-lbl">Période idéale</span><span class="dt-spec-val dt-accent">${esc(row.Periode_Ideale_Chantier ?? '—')}</span></div>
        <div class="dt-spec"><span class="dt-spec-lbl">Ouvriers</span><span class="dt-spec-val">${row.Ouvriers_Requis ?? '—'}</span></div>
      </div>
    </section>` : ''}

    ${row.Artisan_Nom ? `
    <section class="dt-section">
      <p class="dt-eyebrow">Artisan RGE</p>
      <p class="dt-lead">${esc(row.Artisan_Nom)}</p>
      <p class="dt-subtitle">${row.Artisan_Distance_KM ? `${row.Artisan_Distance_KM} km` : ''}${row.Artisan_Effectif_Label ? ` · ${esc(row.Artisan_Effectif_Label)}` : ''}</p>
    </section>` : ''}

    ${row.Argumentaire_Loi_ELAN || row.Argumentaire_MGPE_PD ? `
    <section class="dt-section dt-collapsibles">
      ${row.Argumentaire_Loi_ELAN ? `<details class="dt-details"><summary>Argumentaire Loi ELAN / Décret Tertiaire</summary><p>${esc(row.Argumentaire_Loi_ELAN)}</p></details>` : ''}
      ${row.Argumentaire_MGPE_PD ? `<details class="dt-details"><summary>Argumentaire MGPE-PD</summary><p>${esc(row.Argumentaire_MGPE_PD)}</p></details>` : ''}
    </section>` : ''}

    <footer class="dt-actions">
      <button type="button" id="dt-school-lemlist" class="dt-btn dt-btn-primary">Copier le Pitch Lemlist</button>
      ${insee ? `<button type="button" id="dt-school-pdf" class="dt-btn dt-btn-ghost">PDF dossier mairie</button>` : ''}
      ${insee ? `<a href="/c/${esc(insee)}" class="dt-btn dt-btn-ghost" data-nav-commune="${esc(insee)}">Voir la commune →</a>` : ''}
      <button type="button" id="dt-school-blacklist" class="dt-btn dt-btn-danger" data-blacklist-id="${esc(row.Code_UAI)}">✖ Écarter ce bâtiment</button>
    </footer>`;
}

export function buildFocusDetailLink(ctx) {
  if (ctx.kind === 'school') {
    return `<a href="/e/${esc(ctx.id)}" class="focus-btn focus-btn-ghost focus-btn-full" data-nav-school="${esc(ctx.id)}">Ouvrir le dossier école →</a>`;
  }
  if (ctx.codeInsee) {
    return `<a href="/c/${esc(ctx.codeInsee)}" class="focus-btn focus-btn-ghost focus-btn-full" data-nav-commune="${esc(ctx.codeInsee)}">Ouvrir le dossier commune →</a>`;
  }
  return '';
}

export function getSchoolsForCommune(state, insee) {
  return (state.dashboardData?.schools ?? []).filter(
    (r) => String(r.Code_INSEE) === String(insee),
  ).sort((a, b) => (b.CAPEX_Total ?? 0) - (a.CAPEX_Total ?? 0));
}

export function getSchoolRow(state, uai) {
  return state.dashboardData?.schools?.find((r) => r.Code_UAI === uai) ?? null;
}
