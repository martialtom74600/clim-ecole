/** Copilote Commercial V6 — objections collaboratives & NL text-to-action */

import { RESILIATION_CLAUSE_MGPE_PD } from './legalClauses.js';

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function normalizeText(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function findCommuneSchools(state, communeQuery) {
  const q = normalizeText(communeQuery);
  const schools = state.dashboardData?.schools ?? [];
  return schools.filter((s) => normalizeText(s.Commune).includes(q));
}

function findMairieByQuery(state, communeQuery) {
  const q = normalizeText(communeQuery);
  return state.data?.mairies?.find((m) => normalizeText(m.nom).includes(q));
}

function extractCommuneFromQuery(q, patterns) {
  for (const re of patterns) {
    const m = q.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/**
 * Parse requêtes NL simples — retourne { type, ...payload } ou null
 */
export function parseNaturalLanguageQuery(rawQuery, state) {
  const q = normalizeText(rawQuery);
  if (!q) return null;

  if (/dossiers?\s+chauds?|montre.*chaud|communes?\s+chaudes?|cibles?\s+chaudes?/.test(q)) {
    return { type: 'hot-dossiers', minScore: 75 };
  }

  const artisanCommune = extractCommuneFromQuery(q, [
    /artisan\s+(?:de|du|d'|pour|a)\s+(.+)/,
    /qui\s+est\s+l'?artisan\s+(?:de|du|d'|pour|a)?\s*(.+)/,
  ]);
  if (artisanCommune) {
    return { type: 'artisan-commune', commune: artisanCommune };
  }

  const pitchCommune = extractCommuneFromQuery(q, [
    /(?:genere|generer|pitch|lemlist|email|mail)\s+(?:de|du|d'|pour|a)\s+(.+)/,
    /pitch\s+(.+)/,
  ]);
  if (pitchCommune) {
    return { type: 'pitch-commune', commune: pitchCommune };
  }

  return null;
}

export function getMairieClosingData(state, inseeId) {
  const schools = (state.dashboardData?.schools ?? []).filter(
    (s) => String(s.Code_INSEE) === String(inseeId),
  );
  if (!schools.length) return null;

  const economies = schools.reduce((s, r) => s + (r.Economie_Annuelle_Euros ?? 0), 0);
  const gainNet = schools.reduce((s, r) => s + (r.Gain_Net_Annuel_Mairie_Euros ?? 0), 0);
  const loyerLt = schools.reduce((s, r) => s + (r.MGPE_Loyer_Lt_Euros ?? 0), 0);
  const capex = schools.reduce((s, r) => s + (r.CAPEX_Total ?? 0), 0);
  const maxScore = Math.max(...schools.map((r) => r.Score_Eligibilite_Closing ?? 0));
  const primary = [...schools].sort((a, b) => (b.Score_Eligibilite_Closing ?? 0) - (a.Score_Eligibilite_Closing ?? 0))[0];

  return {
    schools,
    economies,
    gainNet,
    loyerLt,
    capex,
    maxScore,
    primary,
    artisanNom: primary.Artisan_Nom,
    artisanDistance: primary.Artisan_Distance_KM,
    artisanEffectif: primary.Artisan_Effectif_Label,
    artisanEmail: primary.Artisan_Email,
    commune: primary.Commune,
  };
}

export function renderObjectionSimulator(state, fmtEur, inseeId) {
  const data = getMairieClosingData(state, inseeId);
  if (!data) {
    return '<p class="text-[10px] text-slate-500">Données insuffisantes pour le simulateur.</p>';
  }

  const ratioPct = data.economies > 0 ? Math.round((data.gainNet / data.economies) * 100) : 0;
  const clauseExcerpt = RESILIATION_CLAUSE_MGPE_PD.split('\n').slice(0, 6).join(' ').slice(0, 280);

  return `
    <div class="mt-3 rounded-xl border border-violet-500/30 bg-violet-950/20 p-3">
      <p class="text-[10px] font-semibold uppercase tracking-wider text-violet-300">Préparation au Closing · Simulateur d'objections</p>
      <p class="mt-1 text-[10px] text-slate-500">${escapeHtml(data.commune)} · ${data.schools.length} école(s) · score max ${data.maxScore}/100</p>

      <div class="mt-3 space-y-2">
        ${objectionCard({
          id: 'obj-loyer',
          title: '« Le loyer est trop lourd. »',
          btn: 'Réponse chiffrée',
          bodyId: 'obj-loyer-body',
          body: `<p class="text-[11px] text-slate-300">Économie brute <strong class="text-emerald-400">${fmtEur.format(data.economies)}/an</strong> − loyer Lt <strong class="text-amber-300">${fmtEur.format(data.loyerLt)}/an</strong> = <strong class="text-teal-300">gain net mairie ${fmtEur.format(data.gainNet)}/an</strong> (${ratioPct} % conservé par la commune).</p>
            <p class="mt-1 text-[10px] text-slate-500">Le MGPE-PD ne coûte pas : il transfère le CAPEX hors subventions contre un loyer indexé sur la performance réelle (IPMVP).</p>`,
        })}

        ${objectionCard({
          id: 'obj-maire',
          title: '« Et si on change de maire ? »',
          btn: 'Sécurité juridique',
          bodyId: 'obj-maire-body',
          body: `<p class="text-[11px] text-slate-300">Clause de résiliation §5.2 MGPE-PD : indemnité forfaitaire = CAPEX restant dû + breakage + lucrum cessans — <strong class="text-rose-300">protection totale du fonds</strong>, indépendamment de l'alternance politique.</p>
            <p class="mt-2 rounded border border-slate-700/80 bg-slate-900/60 p-2 text-[9px] leading-relaxed text-slate-500">${escapeHtml(clauseExcerpt)}…</p>`,
        })}

        ${objectionCard({
          id: 'obj-artisan',
          title: "« L'artisan est-il fiable ? »",
          btn: 'Garanties',
          bodyId: 'obj-artisan-body',
          body: `<ul class="space-y-1 text-[11px] text-slate-300">
              <li>🏷 <strong>${escapeHtml(data.artisanNom ?? '—')}</strong> — entreprise RGE référencée ADEME</li>
              <li>📍 <strong>${data.artisanDistance ?? '—'} km</strong> du site (intervention locale &lt; 5 km = score closing max)</li>
              <li>👷 Effectif : <strong>${escapeHtml(data.artisanEffectif ?? 'non renseigné')}</strong></li>
              ${data.artisanEmail ? `<li>✉ ${escapeHtml(data.artisanEmail)}</li>` : ''}
            </ul>`,
        })}
      </div>
    </div>`;
}

function objectionCard({ title, btn, bodyId, body }) {
  return `
    <div class="rounded-lg border border-slate-700/80 bg-slate-900/50 p-2.5">
      <p class="text-[11px] font-medium text-slate-200">${escapeHtml(title)}</p>
      <button type="button" class="obj-toggle mt-2 rounded-lg border border-sky-500/40 bg-sky-950/40 px-2.5 py-1 text-[10px] font-medium text-sky-300 hover:bg-sky-950/70" data-target="${bodyId}">${escapeHtml(btn)}</button>
      <div id="${bodyId}" class="obj-panel mt-2 hidden">${body}</div>
    </div>`;
}

export function bindObjectionSimulator(root) {
  root?.querySelectorAll('.obj-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = root.querySelector(`#${btn.dataset.target}`);
      panel?.classList.toggle('hidden');
    });
  });
}

export function temperatureBadgeHtml(tempLabel, score) {
  const key = String(tempLabel ?? '').includes('Chaud') ? 'hot'
    : String(tempLabel ?? '').includes('Tiède') ? 'warm' : 'cold';
  const cls = key === 'hot' ? 'bg-rose-950/50 text-rose-300 border-rose-500/30'
    : key === 'warm' ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
      : 'bg-sky-950/40 text-sky-300 border-sky-500/30';
  return `<span class="shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold ${cls}">${escapeHtml(tempLabel ?? '')} ${score ?? ''}</span>`;
}

export { findCommuneSchools, findMairieByQuery, normalizeText };
