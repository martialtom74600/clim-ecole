const fmt = new Intl.NumberFormat('fr-FR');
const fmtEur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function getInseeFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('mairie');
  return idx >= 0 ? parts[idx + 1] : null;
}

function dpeColor(classe) {
  const c = String(classe).toUpperCase().charAt(0);
  const map = { A: 'text-emerald-400', B: 'text-lime-400', C: 'text-yellow-400', D: 'text-orange-400', E: 'text-red-400', F: 'text-red-500', G: 'text-red-600' };
  return map[c] ?? 'text-slate-400';
}

function renderSchoolCard(ecole) {
  return `
    <article class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 class="font-medium text-white">${ecole.nom}</h3>
          <p class="mt-0.5 text-xs text-slate-500">${ecole.statutDpe} · constr. ${ecole.anneeConstruction || '—'}</p>
        </div>
        <span class="font-mono text-lg font-bold ${dpeColor(ecole.classeDpe)}">${ecole.classeDpe}</span>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div><p class="text-slate-500">Surface</p><p class="font-mono text-slate-200">${fmt.format(ecole.surfaceM2)} m²</p></div>
        <div><p class="text-slate-500">Facture actuelle</p><p class="font-mono text-slate-200">${fmtEur.format(ecole.factureEuros)}/an</p></div>
        <div><p class="text-slate-500">Économie estimée</p><p class="font-mono text-emerald-400">${fmtEur.format(ecole.economieEuros)}/an</p></div>
        <div><p class="text-slate-500">Investissement</p><p class="font-mono text-slate-200">${fmtEur.format(ecole.capexTotal)}</p></div>
      </div>
      ${ecole.argumentaireElan ? `<details class="mt-3"><summary class="cursor-pointer text-xs text-sky-400">Obligation loi ELAN (art. L. 111-10-3)</summary><p class="mt-2 text-xs leading-relaxed text-slate-400">${ecole.argumentaireElan}</p></details>` : ''}
      ${ecole.artisanNom ? `<p class="mt-3 text-[11px] text-slate-500">Artisan RGE de proximité : <span class="text-slate-300">${ecole.artisanNom}</span> (${ecole.artisanDistanceKm} km)</p>` : ''}
    </article>`;
}

function renderDossier(d) {
  document.title = `Dossier énergie — ${d.nomOfficiel}`;

  document.getElementById('commune-title').textContent = d.nomOfficiel;
  document.getElementById('commune-meta').textContent = [
    d.codeInsee ? `Code INSEE ${d.codeInsee}` : null,
    d.population ? `${fmt.format(d.population)} habitants` : null,
    d.departement ? `Département ${d.departement}` : null,
    d.detrRatePct != null ? `Taux DETR ${d.detrRatePct} %` : null,
  ].filter(Boolean).join(' · ');

  const badge = document.getElementById('quality-badge');
  if (d.dataQuality === 'verified') {
    badge.textContent = '✓ Données INSEE certifiées';
    badge.className = 'shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30';
  } else {
    badge.textContent = '⚠ Vérification en cours';
    badge.className = 'shrink-0 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/30';
  }
  badge.classList.remove('hidden');

  const kpis = [
    { label: 'Écoles', value: fmt.format(d.schoolCount) },
    { label: 'Surface totale', value: `${fmt.format(d.surfaceM2)} m²` },
    { label: 'Économies/an', value: fmtEur.format(d.economies), accent: 'text-emerald-400' },
    { label: 'Investissement', value: fmtEur.format(d.capex), accent: 'text-sky-400' },
  ];

  document.getElementById('kpi-grid').innerHTML = kpis.map((k) => `
    <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p class="text-[10px] uppercase tracking-wider text-slate-500">${k.label}</p>
      <p class="mt-1 font-mono text-xl font-semibold ${k.accent ?? 'text-white'}">${k.value}</p>
    </div>`).join('');

  document.getElementById('synthesis-text').textContent =
    `Votre commune compte ${d.schoolCount} établissement${d.schoolCount > 1 ? 's' : ''} scolaire${d.schoolCount > 1 ? 's' : ''} primaire${d.schoolCount > 1 ? 's' : ''} représentant ${fmt.format(d.surfaceM2)} m² de surface chauffée. ` +
    `Un plan de rénovation énergétique permettrait d'économiser environ ${fmtEur.format(d.economies)} par an sur la facture, ` +
    `pour un investissement estimé à ${fmtEur.format(d.capex)} (subventions État ~${fmtEur.format(d.subventions)}, CEE ~${fmtEur.format(d.cee)}). ` +
    (d.soloCount > 0
      ? `${d.soloCount} dossier${d.soloCount > 1 ? 's' : ''} peut${d.soloCount > 1 ? 'vent' : ''} être financé${d.soloCount > 1 ? 's' : ''} directement.`
      : 'Le montage financier nécessite un regroupement avec d\'autres communes voisines.');

  document.getElementById('precision-note').textContent = d.precisionNote ?? '';
  document.getElementById('schools-list').innerHTML = d.ecoles.map(renderSchoolCard).join('');

  document.getElementById('state-loading').classList.add('hidden');
  document.getElementById('dossier-content').classList.remove('hidden');
}

async function load() {
  const codeInsee = getInseeFromPath();
  if (!codeInsee) {
    document.getElementById('state-loading').classList.add('hidden');
    document.getElementById('state-error').classList.remove('hidden');
    document.getElementById('state-error').classList.add('flex');
    document.getElementById('error-message').textContent = 'Code INSEE commune manquant dans l\'URL (/mairie/73011).';
    return;
  }

  try {
    const res = await fetch(`/api/commune/${codeInsee}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Commune introuvable');
    renderDossier(data);
  } catch (err) {
    document.getElementById('state-loading').classList.add('hidden');
    document.getElementById('state-error').classList.remove('hidden');
    document.getElementById('state-error').classList.add('flex');
    document.getElementById('error-message').textContent = err.message;
  }
}

load();
