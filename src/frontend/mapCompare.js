/** Mode comparaison — 2 à 3 écoles côte à côte */

const MAX_COMPARE = 3;

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtCompact(n, fmtEur) {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `${(v / 1e6).toFixed(1).replace('.0', '')} M€`;
  if (v >= 1000) return `${Math.round(v / 1000)} k€`;
  return fmtEur.format(v);
}

export function toggleCompareId(state, id) {
  if (!state.compareIds) state.compareIds = [];
  const idx = state.compareIds.indexOf(id);
  if (idx >= 0) {
    state.compareIds.splice(idx, 1);
    return 'removed';
  }
  if (state.compareIds.length >= MAX_COMPARE) {
    state.compareIds.shift();
  }
  state.compareIds.push(id);
  return 'added';
}

export function clearCompare(state) {
  state.compareIds = [];
}

export function buildComparePanelHtml(state, fmtEur) {
  const rows = state.compareIds
    .map((id) => state.dashboardData?.schools?.find((r) => r.Code_UAI === id))
    .filter(Boolean);

  if (!rows.length) {
    return '<p class="zen-compare-empty">Shift+clic sur une école pour comparer (max 3)</p>';
  }

  const headers = rows.map((r) => `
    <th>
      <button type="button" class="zen-compare-remove" data-compare-remove="${esc(r.Code_UAI)}" title="Retirer">×</button>
      <span class="zen-compare-name">${esc(r.Nom_Ecole)}</span>
      <span class="zen-compare-sub">${esc(r.Commune)}</span>
    </th>`).join('');

  const metric = (getter) => rows.map((r) => `<td>${esc(getter(r))}</td>`).join('');

  return `
    <header class="zen-compare-head">
      <h3>Comparaison · ${rows.length}/${MAX_COMPARE}</h3>
      <button type="button" id="compare-clear" class="zen-compare-clear">Tout effacer</button>
    </header>
    <div class="zen-compare-scroll">
      <table class="zen-compare-table">
        <thead><tr><th></th>${headers}</tr></thead>
        <tbody>
          <tr><th>DPE</th>${metric((r) => r.Classe_DPE ?? '—')}</tr>
          <tr><th>Score closing</th>${metric((r) => String(r.Score_Eligibilite_Closing ?? '—'))}</tr>
          <tr><th>CAPEX</th>${metric((r) => fmtCompact(r.CAPEX_Total, fmtEur))}</tr>
          <tr><th>Part fonds</th>${metric((r) => fmtCompact(r.Part_Fonds_Euros, fmtEur))}</tr>
          <tr><th>Gain net mairie</th>${metric((r) => fmtCompact(r.Gain_Net_Annuel_Mairie_Euros ?? r.Economie_Realiste_Euros, fmtEur))}</tr>
          <tr><th>Surface</th>${metric((r) => `${Math.round(r.Surface_M2 ?? 0)} m²`)}</tr>
          <tr><th>Statut</th>${metric((r) => r.Financement_Statut ?? '—')}</tr>
          <tr><th>Artisan</th>${metric((r) => `${r.Artisan_Nom ?? '—'}${r.Artisan_Distance_KM ? ` (${r.Artisan_Distance_KM} km)` : ''}`)}</tr>
        </tbody>
      </table>
    </div>
    <footer class="zen-compare-foot">
      ${rows.map((r) => `<button type="button" class="focus-btn focus-btn-ghost" data-compare-open="${esc(r.Code_UAI)}">Fiche ${esc(r.Commune)}</button>`).join('')}
    </footer>`;
}

export function parseCompareParam(value) {
  return String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE);
}
