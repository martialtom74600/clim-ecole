/** Popups Leaflet enrichis — lisibilité et actions rapides */

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dpeBadge(classe, color) {
  const c = esc(classe || '—');
  return `<span class="popup-dpe" style="--dpe:${esc(color || '#94a3b8')}">${c}</span>`;
}

function finPill(status) {
  if (status === 'FINANÇABLE_SOLO') return '<span class="popup-pill popup-pill-solo">Prête seule</span>';
  if (status === 'PACK_FINANÇABLE_EPCI') return '<span class="popup-pill popup-pill-pack">Pack EPCI</span>';
  if (status === 'À_REGROUPER' || status === 'À_PACKAGER') return '<span class="popup-pill popup-pill-regroup">À regrouper</span>';
  return status ? `<span class="popup-pill">${esc(status)}</span>` : '';
}

export function schoolPopupHtml(s, { fmt, fmtEur }) {
  const owner = s.proprietaireFfoDenomination || s.proprietaireFfoForme
    ? `<p class="popup-owner">${esc(s.proprietaireFfoForme ? `${s.proprietaireFfoForme} · ` : '')}${esc(s.proprietaireFfoDenomination || '')}</p>`
    : '';

  return `
    <div class="map-popup">
      <div class="popup-head">
        ${dpeBadge(s.classeDpe, s.dpeColor)}
        ${finPill(s.financement)}
      </div>
      <p class="popup-title">${esc(s.nom)}</p>
      <p class="popup-sub">${esc(s.commune)}${s.typePatrimoine ? ` · ${esc(s.typePatrimoine)}` : ''}</p>
      ${owner}
      <div class="popup-metrics">
        <div><span class="popup-metric-label">Surface</span><span class="popup-metric-val">${fmt.format(s.surfaceM2 ?? 0)} m²</span></div>
        <div><span class="popup-metric-label">CAPEX</span><span class="popup-metric-val popup-accent">${fmtEur.format(s.capex ?? 0)}</span></div>
      </div>
      ${s.artisanNom ? `<p class="popup-foot">🔧 ${esc(s.artisanNom)}${s.artisanDistanceKm ? ` · ${s.artisanDistanceKm} km` : ''}</p>` : ''}
      <p class="popup-hint">Cliquer pour le focus</p>
    </div>`;
}

export function artisanPopupHtml(a, { fmtEur }) {
  return `
    <div class="map-popup">
      <p class="popup-title">🔧 ${esc(a.nom)}</p>
      <p class="popup-sub">${a.schoolCount ?? 0} chantier(s) RGE${a.effectifLabel ? ` · ${esc(a.effectifLabel)}` : ''}</p>
      <div class="popup-metrics">
        <div><span class="popup-metric-label">Écoles</span><span class="popup-metric-val">${a.schoolCount ?? 0}</span></div>
        ${a.email ? `<div><span class="popup-metric-label">Email</span><span class="popup-metric-val popup-accent">${esc(a.email)}</span></div>` : ''}
      </div>
      ${a.approximate ? '<p class="popup-foot">Position approximative</p>' : ''}
    </div>`;
}

export function packagePopupHtml(pkg, { fmtEur, milestoneLabel }) {
  const stage = pkg.ticketValid ? 'Pack finançable' : pkg.partFondsMilestone ? `Seuil ${milestoneLabel} atteint` : `Sous ${milestoneLabel}`;
  return `
    <div class="map-popup">
      <p class="popup-title">${esc(pkg.nomEpci ?? pkg.id)}</p>
      <p class="popup-sub">${pkg.schoolIds?.length ?? 0} école(s) · ${esc(stage)}</p>
      <div class="popup-metrics">
        <div><span class="popup-metric-label">Part fonds</span><span class="popup-metric-val">${fmtEur.format(pkg.partFondsTotal ?? 0)}</span></div>
        <div><span class="popup-metric-label">CAPEX</span><span class="popup-metric-val popup-accent">${fmtEur.format(pkg.capexTotal ?? 0)}</span></div>
      </div>
      <p class="popup-hint">Cliquer pour le focus EPCI</p>
    </div>`;
}

export function mairiePopupHtml(m, { fmt, fmtEur }) {
  return `
    <div class="map-popup">
      <p class="popup-title">🏛 ${esc(m.nom)}</p>
      <p class="popup-sub">INSEE ${esc(m.id)} · ${fmt.format(m.population ?? 0)} hab.</p>
      <div class="popup-metrics">
        <div><span class="popup-metric-label">Écoles</span><span class="popup-metric-val">${m.schoolCount ?? 0}</span></div>
        <div><span class="popup-metric-label">CAPEX</span><span class="popup-metric-val popup-accent">${fmtEur.format(m.capex ?? 0)}</span></div>
      </div>
      <p class="popup-hint">Cliquer pour le focus mairie</p>
    </div>`;
}
