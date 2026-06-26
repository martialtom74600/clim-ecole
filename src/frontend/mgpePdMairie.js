/** UI MGPE-PD — timeline, simulateur sensibilité, export PDF */

let prixKwhTertiaireFallback = 0.22;

export function setPrixKwhTertiaireFallback(value) {
  if (value != null && value > 0) {
    prixKwhTertiaireFallback = value;
  }
}

function prixKwhRef(mp) {
  return mp?.sensitivity?.prixKwhRef ?? prixKwhTertiaireFallback;
}

export function renderMgpePdTimeline(timeline) {
  if (!timeline?.length) return '';

  const statusColors = {
    critical: 'border-rose-500/50 bg-rose-950/20',
    warning: 'border-amber-500/40 bg-amber-950/15',
    info: 'border-slate-700 bg-slate-900/40',
  };

  const dotColors = {
    critical: 'bg-rose-500 ring-rose-500/30',
    warning: 'bg-amber-500 ring-amber-500/30',
    info: 'bg-indigo-500 ring-indigo-500/30',
  };

  const items = timeline.map((step, i) => {
    const isLast = i === timeline.length - 1;
    const cardClass = statusColors[step.status] ?? statusColors.info;
    const dotClass = dotColors[step.status] ?? dotColors.info;
    return `
      <li class="relative flex gap-3 pb-5 ${isLast ? '' : ''}">
        ${isLast ? '' : '<span class="absolute left-[11px] top-6 bottom-0 w-px bg-slate-700" aria-hidden="true"></span>'}
        <span class="relative z-10 mt-0.5 h-[22px] w-[22px] shrink-0 rounded-full ring-4 ${dotClass}"></span>
        <div class="min-w-0 flex-1 rounded-lg border p-2.5 ${cardClass}">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Étape ${step.step}</p>
          <p class="mt-0.5 text-xs font-semibold text-slate-200">${escapeHtml(step.title)}</p>
          <p class="mt-1 text-[11px] leading-relaxed text-slate-400">${escapeHtml(step.description)}</p>
          ${step.alert && step.alertText ? `<p class="mt-2 rounded border border-amber-500/30 bg-amber-950/30 px-2 py-1 text-[10px] text-amber-300">⚠ ${escapeHtml(step.alertText)}</p>` : ''}
        </div>
      </li>`;
  }).join('');

  return `
    <div class="mt-3 rounded-lg border border-slate-700 bg-slate-900/30 p-3">
      <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Parcours d'Instruction Réglementaire MGPE-PD</p>
      <ol class="mt-3 list-none pl-0">${items}</ol>
    </div>`;
}

function computeClientSensitivity(dossier, mp, variationPct) {
  const prixRef = prixKwhRef(mp);
  const prixScenario = prixRef * (1 + variationPct / 100);
  const gainCpe = (mp.simulation?.gainEnergieCiblePct ?? 45) / 100;
  const facture = dossier.facture ?? dossier.economies ?? 0;
  const consoKwh = facture > 0 ? facture / prixRef : 0;
  const deltaE = consoKwh * gainCpe;
  const sim = mp.simulation ?? {};
  const loyerLt = sim.loyerSynallagmatiqueEstime ?? 0;
  const ft = sim.redevanceFinanciereFt ?? 0;
  const economieBrute = Math.round(deltaE * prixScenario);
  const economieFonds = Math.round(deltaE * prixRef);
  const economieNette = economieBrute - loyerLt;
  const deficitKwh = deltaE * 0.2;
  const penalite66 = Math.round(deficitKwh * prixScenario * 0.66);
  const penalite100 = Math.round(deficitKwh * prixScenario);
  const couverture = ft > 0 ? Math.round((economieFonds / ft) * 100) : null;
  return {
    prixScenario,
    economieBrute,
    economieFonds,
    economieNette,
    penalite66,
    penalite100,
    couverture,
    loyerLt,
    ft,
  };
}

function renderSensitivityChart(curve, width = 280, height = 72) {
  if (!curve?.length) return '';
  const values = curve.map((p) => p.economieNetteCommune);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const pts = curve.map((p, i) => {
    const x = (i / (curve.length - 1)) * width;
    const y = height - ((p.economieNetteCommune - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  const zeroY = height - ((0 - min) / range) * (height - 8) - 4;
  return `
    <svg viewBox="0 0 ${width} ${height}" class="mt-2 w-full max-w-full" aria-hidden="true">
      <line x1="0" y1="${zeroY}" x2="${width}" y2="${zeroY}" stroke="#475569" stroke-width="1" stroke-dasharray="3,3"/>
      <polyline fill="none" stroke="#818cf8" stroke-width="2" points="${pts}"/>
    </svg>`;
}

export function renderMgpePdSimulator(dossier, mp) {
  const sens = mp.sensitivity ?? {};
  const ref = computeClientSensitivity(dossier, mp, 0);
  const chart = renderSensitivityChart(sens.courbe);

  return `
    <div id="mgpe-simulator" class="mt-3 rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3" data-insee="${escapeHtml(String(dossier.codeInsee ?? ''))}">
      <p class="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">Simulateur loyer / pénalités — sensibilité prix kWh</p>
      <p class="mt-1 text-[10px] text-slate-500">Référence IPMVP : ${sens.prixKwhRef ?? prixKwhTertiaireFallback} €/kWh · variation −30 % à +100 %</p>
      <div class="mt-3">
        <label for="mgpe-kwh-slider" class="flex justify-between text-[10px] text-slate-400">
          <span>Prix kWh scenario</span>
          <span id="mgpe-kwh-label" class="font-mono text-indigo-300">${ref.prixScenario.toFixed(4)} €</span>
        </label>
        <input id="mgpe-kwh-slider" type="range" min="-30" max="100" value="0" step="5"
          class="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500" />
        <div class="mt-0.5 flex justify-between text-[9px] text-slate-600"><span>−30 %</span><span>+100 %</span></div>
      </div>
      ${chart}
      <div class="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <div class="rounded bg-slate-900/80 p-2"><span class="text-slate-500">Économie brute (commune)</span><p id="mgpe-eco-brute" class="font-mono text-emerald-400">${fmtEur(ref.economieBrute)}</p></div>
        <div class="rounded bg-slate-900/80 p-2"><span class="text-slate-500">Économie nette (après Lt)</span><p id="mgpe-eco-nette" class="font-mono ${ref.economieNette >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${fmtEur(ref.economieNette)}</p></div>
        <div class="rounded bg-slate-900/80 p-2"><span class="text-slate-500">Loyer Lt (Ft+St)</span><p id="mgpe-loyer" class="font-mono text-indigo-300">${fmtEur(ref.loyerLt)}</p></div>
        <div class="rounded bg-slate-900/80 p-2"><span class="text-slate-500">Protection fonds (ΔC th. / Ft)</span><p id="mgpe-couverture" class="font-mono text-sky-400">${ref.couverture != null ? `${ref.couverture} %` : '—'}</p></div>
        <div class="rounded bg-slate-900/80 p-2 col-span-2"><span class="text-slate-500">Pénalité sous-perf. −20 % (≥ 66 % / 100 %)</span><p id="mgpe-penalite" class="font-mono text-amber-400">${fmtEur(ref.penalite66)} / ${fmtEur(ref.penalite100)}</p></div>
      </div>
      <p class="mt-2 text-[9px] leading-relaxed text-slate-500">Ft indexé sur structure de coûts (Syntec/TP10) — étanche à la volatilité du kWh tertiaire. Pénalités : (ΔE_garanti − ΔE_constat) × P_reel.</p>
    </div>`;
}

export function renderMgpePdSummary(mp) {
  if (!mp) return '';
  const sim = mp.simulation;
  return `
    <details class="mt-3 rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-2" open>
      <summary class="cursor-pointer text-xs font-semibold text-indigo-300">MGPE-PD — Tiers-financement (CPE)</summary>
      <p class="mt-2 text-[11px] leading-relaxed text-slate-400">${escapeHtml(mp.argumentaire)}</p>
      <div class="mt-2 grid grid-cols-2 gap-2 text-[10px]">
        <div class="rounded bg-slate-900/80 p-2"><span class="text-slate-500">Loyer Lt/an</span><p class="font-mono text-indigo-300">${fmtEur(sim.loyerSynallagmatiqueEstime)}</p></div>
        <div class="rounded bg-slate-900/80 p-2"><span class="text-slate-500">Ft + St</span><p class="font-mono">${fmtEur(sim.redevanceFinanciereFt)} + ${fmtEur(sim.partServicesSt)}</p></div>
        <div class="rounded bg-slate-900/80 p-2"><span class="text-slate-500">Gain GPE cible</span><p class="font-mono text-emerald-400">−${sim.gainEnergieCiblePct} %</p></div>
        <div class="rounded bg-slate-900/80 p-2"><span class="text-slate-500">Subv. estimée</span><p class="font-mono">${mp.tauxSubventionEstimePct} %</p></div>
      </div>
      <p class="mt-2 text-[10px] text-slate-500">Instructeur : ${escapeHtml(mp.instructeurSubventions)}</p>
      ${mp.alertes?.length ? `<ul class="mt-2 list-inside list-disc text-[10px] text-amber-400/90">${mp.alertes.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>` : ''}
    </details>`;
}

export function bindMgpePdSimulator(dossier, mp, { fmtEur: fmtEurFn } = {}) {
  const root = document.getElementById('mgpe-simulator');
  const slider = document.getElementById('mgpe-kwh-slider');
  if (!root || !slider || !mp) return;

  const fmt = fmtEurFn ?? fmtEur;
  const update = () => {
    const variationPct = Number(slider.value);
    const s = computeClientSensitivity(dossier, mp, variationPct);
    const label = document.getElementById('mgpe-kwh-label');
    const ecoBrute = document.getElementById('mgpe-eco-brute');
    const ecoNette = document.getElementById('mgpe-eco-nette');
    const couverture = document.getElementById('mgpe-couverture');
    const penalite = document.getElementById('mgpe-penalite');

    if (label) label.textContent = `${s.prixScenario.toFixed(4)} € (${variationPct >= 0 ? '+' : ''}${variationPct} %)`;
    if (ecoBrute) ecoBrute.textContent = fmt(s.economieBrute);
    if (ecoNette) {
      ecoNette.textContent = fmt(s.economieNette);
      ecoNette.className = `font-mono ${s.economieNette >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (couverture) couverture.textContent = s.couverture != null ? `${s.couverture} %` : '—';
    if (penalite) penalite.textContent = `${fmt(s.penalite66)} / ${fmt(s.penalite100)}`;
  };

  slider.addEventListener('input', update);
  update();
}

export async function downloadMgpePdPdf(inseeCode, { apiHeaders, showToast } = {}) {
  try {
    const res = await fetch(`/api/commune/${inseeCode}/pdf`, { headers: apiHeaders?.() ?? {} });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erreur ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dossier-mgpe-pd-${inseeCode}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    showToast?.('PDF téléchargé', 'success');
  } catch (err) {
    showToast?.(err.message, 'error');
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtEur(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n ?? 0);
}
