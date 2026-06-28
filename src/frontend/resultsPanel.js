/** Panneau résultats — cartes patrimoine + filtres */

import { temperatureBadgeHtml } from './copilot.js';

const DPE_COLORS = {
  A: '#34d399', B: '#a3e635', C: '#facc15', D: '#fb923c',
  E: '#f87171', F: '#ef4444', G: '#dc2626',
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dpeColor(grade) {
  return DPE_COLORS[String(grade ?? '').toUpperCase().charAt(0)] ?? '#64748b';
}

function finLabel(status) {
  if (status === 'FINANÇABLE_SOLO') return { text: 'Prête seule', cls: 'solo' };
  if (status === 'PACK_FINANÇABLE_EPCI') return { text: 'Pack EPCI', cls: 'pack' };
  if (status === 'À_REGROUPER' || status === 'À_PACKAGER') return { text: 'À regrouper', cls: 'regroup' };
  return { text: status || '—', cls: 'neutral' };
}

export function rowMatchesMapFilter(row, filter) {
  if (filter === 'all') return true;
  if (filter === 'solo') return row.Financement_Statut === 'FINANÇABLE_SOLO';
  if (filter === 'pack') {
    return row.Financement_Statut === 'PACK_FINANÇABLE_EPCI'
      || String(row.Package_ID ?? '').startsWith('EPCI-');
  }
  if (filter === 'dpe-bad') {
    return ['E', 'F', 'G'].includes(String(row.Classe_DPE ?? '').toUpperCase().charAt(0));
  }
  if (filter === 'hot') return (row.Score_Eligibilite_Closing ?? 0) >= 75;
  return true;
}

export function getFilteredSchoolRows(state) {
  const rows = state.dashboardData?.schools ?? [];
  const q = String(state.resultsSearch ?? '').trim().toLowerCase();
  const dept = state.deptFilter ?? 'all';

  return rows.filter((row) => {
    if (!rowMatchesMapFilter(row, state.mapFilter)) return false;
    if (dept !== 'all' && String(row.Departement ?? row.Code_UAI?.slice(0, 3)) !== dept) return false;
    if (!q) return true;
    const hay = [
      row.Nom_Ecole, row.Commune, row.Code_UAI, row.Type_Patrimoine,
      row.Proprietaire_FFO_Denomination, row.Artisan_Nom,
    ].join(' ').toLowerCase();
    return hay.includes(q);
  }).sort((a, b) => (b.Score_Eligibilite_Closing ?? 0) - (a.Score_Eligibilite_Closing ?? 0));
}

export function buildDpeChartHtml(rows) {
  const counts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
  for (const row of rows) {
    const g = String(row.Classe_DPE ?? '').toUpperCase().charAt(0);
    if (counts[g] != null) counts[g] += 1;
  }
  const max = Math.max(1, ...Object.values(counts));
  return Object.entries(counts).map(([g, n]) => `
    <div class="dpe-bar-col" title="DPE ${g} : ${n}">
      <div class="dpe-bar-track">
        <div class="dpe-bar-fill" style="height:${Math.round((n / max) * 100)}%;background:${DPE_COLORS[g]}"></div>
      </div>
      <span class="dpe-bar-label">${g}</span>
      <span class="dpe-bar-count">${n || ''}</span>
    </div>`).join('');
}

export function buildResultsKpisHtml(rows, fmtEur, kpis) {
  const solo = rows.filter((r) => r.Financement_Statut === 'FINANÇABLE_SOLO').length;
  const capex = rows.reduce((s, r) => s + (r.CAPEX_Total ?? 0), 0);
  return `
    <div class="rkpi"><span class="rkpi-val">${rows.length}</span><span class="rkpi-lbl">Résultats</span></div>
    <div class="rkpi"><span class="rkpi-val accent">${solo}</span><span class="rkpi-lbl">Solo</span></div>
    <div class="rkpi"><span class="rkpi-val">${fmtEur.format(capex)}</span><span class="rkpi-lbl">CAPEX</span></div>
    <div class="rkpi"><span class="rkpi-val">${kpis?.packageCount ?? 0}</span><span class="rkpi-lbl">EPCI</span></div>`;
}

export function buildSchoolCardHtml(row, fmt, fmtEur, { active = false } = {}) {
  const fin = finLabel(row.Financement_Statut);
  const dpe = String(row.Classe_DPE ?? '—').charAt(0);
  const color = dpeColor(row.Classe_DPE);
  const score = row.Score_Eligibilite_Closing;
  const temp = row.Closing_Temperature
    ? temperatureBadgeHtml(row.Closing_Temperature, score)
    : (score != null ? `<span class="score-chip">${score}</span>` : '');

  return `
    <button type="button" class="school-card${active ? ' is-active' : ''}" data-uai="${esc(row.Code_UAI)}" data-lat="${row.Latitude ?? ''}" data-lon="${row.Longitude ?? ''}">
      <div class="school-card-row">
        <span class="dpe-chip" style="background:${color}">${esc(dpe)}</span>
        <div class="school-card-main">
          <span class="school-card-name">${esc(row.Nom_Ecole)}</span>
          <span class="school-card-meta">${esc(row.Commune)} · ${fmt.format(row.Surface_M2 ?? 0)} m² · ${esc(row.Type_Patrimoine || 'Patrimoine')}</span>
        </div>
        ${temp}
      </div>
      <div class="school-card-foot">
        <span class="status-pill status-${fin.cls}">${fin.text}</span>
        <span class="school-card-capex">${fmtEur.format(row.CAPEX_Total ?? 0)}</span>
      </div>
    </button>`;
}

export function buildDeptFiltersHtml(departments, active) {
  if (!departments.length) return '';
  const chips = departments.map((d) => `
    <button type="button" class="dept-chip${active === d ? ' active' : ''}" data-dept="${esc(d)}">${esc(d)}</button>`).join('');
  return `<button type="button" class="dept-chip${active === 'all' ? ' active' : ''}" data-dept="all">Tous</button>${chips}`;
}

export { dpeColor, esc };
