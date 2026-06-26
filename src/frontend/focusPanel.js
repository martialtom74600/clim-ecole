/** v4 — Panneau Focus central & grille Portefeuilles */

const DPE_ORDER = { G: 7, F: 6, E: 5, D: 4, C: 3, B: 2, A: 1 };

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dpeScore(grade) {
  const g = String(grade ?? '').toUpperCase().charAt(0);
  const rank = DPE_ORDER[g] ?? 4;
  return Math.round((rank / 7) * 100);
}

function worstDpe(rows) {
  let worst = 'C';
  let max = 0;
  for (const row of rows) {
    const g = String(row?.Classe_DPE ?? row?.classeDpe ?? '').toUpperCase().charAt(0);
    const rank = DPE_ORDER[g] ?? 0;
    if (rank > max) { max = rank; worst = g; }
  }
  return worst;
}

function fmtCompactEur(n, fmtEur) {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `${(v / 1e6).toFixed(1).replace('.0', '')} M€`;
  if (v >= 1000) return `${Math.round(v / 1000)} k€`;
  return fmtEur.format(v);
}

export function rowMatchesQuickFilter(row, filter) {
  if (filter === 'all') return true;
  if (filter === 'solo') return row.Financement_Statut === 'FINANÇABLE_SOLO';
  if (filter === 'epci') {
    return row.Financement_Statut === 'PACK_FINANÇABLE_EPCI'
      || String(row.Package_ID ?? '').startsWith('EPCI-');
  }
  if (filter === 'hot') return (row.Score_Eligibilite_Closing ?? 0) >= 75;
  if (filter === 'dpe' || filter === 'dpe-bad') {
    const g = String(row.Classe_DPE ?? '').toUpperCase().charAt(0);
    return ['D', 'E', 'F', 'G'].includes(g);
  }
  return true;
}

export function getFilteredSchoolIds(state) {
  const q = String(state.searchQuery ?? '').trim().toLowerCase();
  return (state.dashboardData?.schools ?? [])
    .filter((row) => rowMatchesQuickFilter(row, state.mapFilter))
    .filter((row) => {
      if (!q) return true;
      const hay = [
        row.Nom_Ecole, row.Commune, row.Code_UAI,
        row.Proprietaire_FFO_Denomination, row.Nom_EPCI,
      ].join(' ').toLowerCase();
      return hay.includes(q);
    })
    .map((r) => r.Code_UAI);
}

export function buildPortfolioItems(state) {
  const items = [];
  const seenPkg = new Set();
  const minSolo = 1_000_000;
  const rows = state.dashboardData?.schools ?? [];
  const rowByUai = new Map(rows.map((r) => [r.Code_UAI, r]));

  for (const pkg of state.data?.packages ?? []) {
    if (!pkg.ticketValid && !pkg.partFondsMilestone) continue;
    if (seenPkg.has(pkg.id)) continue;
    seenPkg.add(pkg.id);

    const pkgRows = (pkg.schoolIds ?? []).map((id) => rowByUai.get(id)).filter(Boolean);
    const capex = pkg.capexTotal ?? pkgRows.reduce((s, r) => s + (r.CAPEX_Total ?? 0), 0);
    const dpe = worstDpe(pkgRows);

    items.push({
      kind: 'package',
      id: pkg.id,
      title: pkg.nomEpci ?? pkg.id,
      capex,
      partFonds: pkg.partFondsTotal ?? pkgRows.reduce((s, r) => s + (r.Part_Fonds_Euros ?? 0), 0),
      gain: pkg.gainNetPessimisteTotal ?? pkgRows.reduce((s, r) => s + (r.Gain_Net_Annuel_Mairie_Euros ?? r.Economie_Realiste_Euros ?? 0), 0),
      dpe,
      dpeScore: dpeScore(dpe),
      badge: pkg.ticketValid ? 'Pack finançable' : 'Seuil atteint',
    });
  }

  for (const row of rows) {
    if (row.Financement_Statut !== 'FINANÇABLE_SOLO') continue;
    if ((row.CAPEX_Total ?? 0) < minSolo) continue;
    items.push({
      kind: 'school',
      id: row.Code_UAI,
      title: row.Commune,
      subtitle: row.Nom_Ecole,
      capex: row.CAPEX_Total ?? 0,
      partFonds: row.Part_Fonds_Euros ?? 0,
      gain: row.Gain_Net_Annuel_Mairie_Euros ?? row.Economie_Realiste_Euros ?? 0,
      dpe: row.Classe_DPE,
      dpeScore: dpeScore(row.Classe_DPE),
      badge: 'Solo',
      ffoDenom: row.Proprietaire_FFO_Denomination,
      ffoForme: row.Proprietaire_FFO_Forme,
    });
  }

  return items.sort((a, b) => b.capex - a.capex);
}

export function buildPortfolioCardHtml(item, fmtEur) {
  const capex = fmtCompactEur(item.capex, fmtEur);
  return `
    <button type="button" class="pf-card" data-focus-kind="${esc(item.kind)}" data-focus-id="${esc(item.id)}">
      <div class="pf-card-top">
        <span class="pf-badge">${esc(item.badge)}</span>
        <div class="pf-dpe-gauge" style="--dpe-pct:${item.dpeScore}%"><span></span></div>
      </div>
      <h3 class="pf-title">${esc(item.title)}</h3>
      ${item.subtitle ? `<p class="pf-sub">${esc(item.subtitle)}</p>` : ''}
      <p class="pf-capex">${capex}</p>
    </button>`;
}

export function resolveFocusContext(state, kind, id) {
  const rows = state.dashboardData?.schools ?? [];
  const rowByUai = new Map(rows.map((r) => [r.Code_UAI, r]));

  if (kind === 'school') {
    const row = rowByUai.get(id);
    const node = state.data?.schools?.find((s) => s.id === id);
    if (!row && !node) return null;
    return {
      kind: 'school',
      id,
      title: String(row?.Proprietaire_FFO_Denomination ?? row?.Commune ?? node?.commune ?? '').toUpperCase(),
      badge: row?.Proprietaire_FFO_Forme ?? row?.Type_Patrimoine ?? 'Patrimoine public',
      subtitle: row?.Nom_Ecole ?? node?.nom,
      commune: row?.Commune ?? node?.commune,
      capex: row?.CAPEX_Total ?? node?.capex ?? 0,
      partFonds: row?.Part_Fonds_Euros ?? node?.partFonds ?? 0,
      gain: row?.Gain_Net_Annuel_Mairie_Euros ?? row?.Economie_Realiste_Euros ?? node?.economies ?? 0,
      codeInsee: row?.Code_INSEE ?? node?.codeInsee,
      emailMairie: row?.Email_Mairie ?? node?.emailMairie,
      schoolNode: node,
      row,
    };
  }

  if (kind === 'package') {
    const pkg = state.data?.packages?.find((p) => p.id === id);
    if (!pkg) return null;
    const pkgRows = (pkg.schoolIds ?? []).map((u) => rowByUai.get(u)).filter(Boolean);
    const lead = pkgRows.find((r) => r.Proprietaire_FFO_Denomination) ?? pkgRows[0];
    return {
      kind: 'package',
      id,
      title: String(lead?.Proprietaire_FFO_Denomination ?? pkg.nomEpci ?? pkg.id).toUpperCase(),
      badge: pkg.ticketValid ? 'EPCI · Pack finançable' : 'EPCI · Seuil fonds',
      subtitle: pkg.nomEpci ?? pkg.id,
      commune: lead?.Commune,
      capex: pkg.capexTotal ?? pkgRows.reduce((s, r) => s + (r.CAPEX_Total ?? 0), 0),
      partFonds: pkg.partFondsTotal ?? pkgRows.reduce((s, r) => s + (r.Part_Fonds_Euros ?? 0), 0),
      gain: pkg.gainNetPessimisteTotal ?? pkgRows.reduce((s, r) => s + (r.Gain_Net_Annuel_Mairie_Euros ?? r.Economie_Realiste_Euros ?? 0), 0),
      codeInsee: lead?.Code_INSEE,
      emailMairie: lead?.Email_Mairie,
      pkg,
      leadRow: lead,
    };
  }

  if (kind === 'mairie') {
    const m = state.data?.mairies?.find((x) => x.id === id);
    if (!m) return null;
    const mRows = (m.schoolIds ?? []).map((u) => rowByUai.get(u)).filter(Boolean);
    const lead = mRows.find((r) => r.Proprietaire_FFO_Denomination) ?? mRows[0];
    return {
      kind: 'mairie',
      id,
      title: String(lead?.Proprietaire_FFO_Denomination ?? m.nom ?? '').toUpperCase(),
      badge: lead?.Proprietaire_FFO_Forme ?? 'COMMUNE',
      subtitle: m.nom,
      commune: m.nom,
      capex: m.capex ?? mRows.reduce((s, r) => s + (r.CAPEX_Total ?? 0), 0),
      partFonds: mRows.reduce((s, r) => s + (r.Part_Fonds_Euros ?? 0), 0),
      gain: mRows.reduce((s, r) => s + (r.Gain_Net_Annuel_Mairie_Euros ?? r.Economie_Realiste_Euros ?? 0), 0),
      codeInsee: m.id,
      emailMairie: m.email,
      mairie: m,
      leadRow: lead,
    };
  }

  return null;
}

export function buildFocusPanelHtml(ctx, fmtEur) {
  const capex = fmtCompactEur(ctx.capex, fmtEur);
  const partFonds = fmtCompactEur(ctx.partFonds, fmtEur);
  const gain = fmtCompactEur(ctx.gain, fmtEur);

  return `
    <header class="focus-section focus-legal">
      <p class="focus-eyebrow">Propriétaire foncier · FFO DGFiP</p>
      <h2 id="focus-title" class="focus-ffo">${esc(ctx.title || '—')}</h2>
      <span class="focus-badge">${esc(ctx.badge)}</span>
      ${ctx.subtitle ? `<p class="focus-meta">${esc(ctx.subtitle)}${ctx.commune && ctx.subtitle !== ctx.commune ? ` · ${esc(ctx.commune)}` : ''}</p>` : ''}
    </header>
    <section class="focus-section focus-kpis">
      <div class="focus-kpi">
        <span class="focus-kpi-label">CAPEX total</span>
        <span class="focus-kpi-val">${capex}</span>
      </div>
      <div class="focus-kpi">
        <span class="focus-kpi-label">Reste à charge fonds</span>
        <span class="focus-kpi-val">${partFonds}</span>
      </div>
      <div class="focus-kpi focus-kpi-accent">
        <span class="focus-kpi-label">Gain annuel</span>
        <span class="focus-kpi-val">${gain}</span>
      </div>
    </section>
    <footer class="focus-section focus-actions">
      <button type="button" id="focus-btn-lemlist" class="focus-btn focus-btn-primary">Copier le Pitch Lemlist</button>
      <button type="button" id="focus-btn-pdf" class="focus-btn focus-btn-ghost">Générer le PDF de Closing</button>
    </footer>`;
}
