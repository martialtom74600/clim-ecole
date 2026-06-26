/** Assistant — navigation guidée et palette text-to-action */

import {
  parseNaturalLanguageQuery,
  renderObjectionSimulator,
  temperatureBadgeHtml,
  findCommuneSchools,
} from './copilot.js';

let ctx = null;

function sortByClosingScore(items, state, idField = 'id') {
  const schools = state.dashboardData?.schools ?? [];
  const scoreOf = (id, type) => {
    if (type === 'school') {
      return schools.find((s) => s.Code_UAI === id)?.Score_Eligibilite_Closing ?? 0;
    }
    if (type === 'mairie') {
      return state.data?.mairies?.find((m) => m.id === id)?.scoreClosing ?? 0;
    }
    return 0;
  };
  return [...items].sort((a, b) => scoreOf(b[idField], b.type) - scoreOf(a[idField], a.type));
}

function tempBadgeForItem(item, state) {
  if (item.type === 'school') {
    const row = state.dashboardData?.schools?.find((s) => s.Code_UAI === item.id);
    if (row?.Closing_Temperature) {
      return temperatureBadgeHtml(row.Closing_Temperature, row.Score_Eligibilite_Closing);
    }
  }
  if (item.type === 'mairie') {
    const m = state.data?.mairies?.find((x) => x.id === item.id);
    if (m?.closingTemperature) {
      return temperatureBadgeHtml(m.closingTemperature, m.scoreClosing);
    }
  }
  return item.tempBadge ?? '';
}

const INTENTS = [
  {
    id: 'targets',
    emoji: '🎯',
    title: 'Écoles urgentes',
    desc: 'Mauvaise note énergie (D à G) — à contacter en priorité',
    filter: 'dpe-bad',
  },
  {
    id: 'solo',
    emoji: '✅',
    title: 'Prêtes à proposer seules',
    desc: 'Dossiers simples : la mairie gagne de l\'argent, montant suffisant',
    filter: 'solo',
  },
  {
    id: 'mairies',
    emoji: '🏛',
    title: 'Préparer la mairie',
    desc: 'PDF et texte pour expliquer le projet à la commune',
    view: 'mairies',
  },
  {
    id: 'packages',
    emoji: '📦',
    title: 'Regrouper des écoles',
    desc: 'Packs EPCI · écoles regroupées par intercommunalité',
    view: 'packages',
  },
];

const COMMANDS = [
  { id: 'chasse-resume', label: 'Reprendre le chassage', icon: '▶', group: 'Actions' },
  { id: 'chasse-full', label: 'Tout relancer (reset)', icon: '🔄', group: 'Actions' },
  { id: 'export', label: 'Télécharger le CSV', icon: '⬇', group: 'Actions' },
  { id: 'refresh', label: 'Actualiser les données', icon: '↻', group: 'Actions' },
  { id: 'view-table', label: 'Ouvrir le tableau complet', icon: '📊', group: 'Navigation' },
  { id: 'view-map', label: 'Revenir à la carte', icon: '🗺', group: 'Navigation' },
  { id: 'fit-map', label: 'Recentrer la carte', icon: '⊕', group: 'Navigation' },
  { id: 'filter-hot', label: 'Filtrer : dossiers chauds (≥75)', icon: '🔥', group: 'Filtres' },
  { id: 'filter-solo', label: 'Filtrer : finançables solo', icon: '✅', group: 'Filtres' },
  { id: 'filter-dpe', label: 'Filtrer : DPE E à G', icon: '🔥', group: 'Filtres' },
  { id: 'filter-all', label: 'Filtrer : toutes les cibles', icon: '🏫', group: 'Filtres' },
];

const PALETTE_QUICK_IDS = ['filter-hot', 'filter-solo', 'chasse-resume', 'export'];

export function initAssistant(handlers) {
  ctx = { handlers, view: 'home', paletteIndex: 0, paletteDebounce: null };

  $('assistant-trigger')?.addEventListener('click', openCommandPalette);
  $('btn-open-assistant')?.addEventListener('click', () => {
    openAssistantPanel();
    renderAssistantHome();
  });
  $('assistant-back')?.addEventListener('click', () => {
    ctx.view = 'home';
    renderAssistantHome();
  });
  $('assistant-close-mobile')?.addEventListener('click', closeAssistantPanel);
  $('command-palette')?.addEventListener('click', (e) => {
    if (e.target === $('command-palette')) closeCommandPalette();
  });

  $('palette-input')?.addEventListener('input', (e) => {
    clearTimeout(ctx.paletteDebounce);
    ctx.paletteDebounce = setTimeout(() => renderPaletteResults(e.target.value), 120);
  });
  $('palette-input')?.addEventListener('keydown', onPaletteKeydown);

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openCommandPalette();
    }
  });

  $('context-dock-close')?.addEventListener('click', () => {
    $('context-dock')?.classList.add('hidden-dock');
  });

  $('context-objections')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.obj-toggle');
    if (!btn) return;
    const panel = $('context-objections')?.querySelector(`#${btn.dataset.target}`);
    panel?.classList.toggle('hidden');
  });
}

export function onAssistantDataUpdate(state, fmtEur) {
  if (!ctx) return;
  if (ctx.view === 'home') {
    renderAssistantHome(state, fmtEur);
  }
  renderContextDock(state, fmtEur);
}

export function onAssistantSelectionChange(state, fmtEur) {
  if (!ctx) return;
  renderContextDock(state, fmtEur);
}

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatEpciMilestoneLabel(state) {
  const min = state?.dashboardData?.config?.minPackagePartFonds ?? 1_000_000;
  if (min >= 1_000_000) return `${(min / 1e6).toFixed(1).replace('.0', '')} M€`;
  return `${Math.round(min / 1000)} k€`;
}

function openAssistantPanel() {
  $('assistant-panel')?.classList.remove('closed');
  if (window.innerWidth < 768) $('assistant-backdrop')?.classList.add('open');
}

function closeAssistantPanel() {
  $('assistant-panel')?.classList.add('closed');
  $('assistant-backdrop')?.classList.remove('open');
}

function openCommandPalette() {
  $('command-palette')?.classList.remove('hidden');
  const input = $('palette-input');
  if (input) {
    input.value = '';
    renderPaletteResults('');
    requestAnimationFrame(() => input.focus());
  }
  ctx.paletteIndex = 0;
}

function closeCommandPalette() {
  $('command-palette')?.classList.add('hidden');
}

function onPaletteKeydown(e) {
  const items = [...$('palette-results')?.querySelectorAll('[data-cmd], [data-nl], [data-entity-type]') ?? []];
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    ctx.paletteIndex = Math.min(ctx.paletteIndex + 1, items.length - 1);
    highlightPaletteItem(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    ctx.paletteIndex = Math.max(ctx.paletteIndex - 1, 0);
    highlightPaletteItem(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    items[ctx.paletteIndex]?.click();
  } else if (e.key === 'Escape') {
    closeCommandPalette();
  }
}

function highlightPaletteItem(items) {
  items.forEach((el, i) => el.classList.toggle('active', i === ctx.paletteIndex));
  items[ctx.paletteIndex]?.scrollIntoView({ block: 'nearest' });
}

function buildInsights(state, fmtEur) {
  const k = state.dashboardData?.kpis;
  const schools = state.dashboardData?.schools ?? [];
  if (!k || !schools.length) {
    return { headline: 'Lancez un chassage pour découvrir vos cibles.', solo: null, top: null };
  }

  const soloSchools = schools.filter((s) => s.Financement_Statut === 'FINANÇABLE_SOLO');
  const hotSchools = schools.filter((s) => (s.Score_Eligibilite_Closing ?? 0) >= 75);
  const topScore = [...schools].sort((a, b) => (b.Score_Eligibilite_Closing ?? 0) - (a.Score_Eligibilite_Closing ?? 0))[0];
  const topCapex = [...schools].sort((a, b) => (b.CAPEX_Total ?? 0) - (a.CAPEX_Total ?? 0))[0];

  let headline = `${k.totalSchools} écoles à étudier · ${soloSchools.length} prêtes à proposer seules`;
  if (hotSchools.length) {
    headline += ` · ${hotSchools.length} très prioritaires`;
  }

  return {
    headline,
    solo: soloSchools[0] ?? null,
    top: topScore ?? topCapex,
    hotCount: hotSchools.length,
  };
}

export function renderAssistantHome(state = ctx?.handlers?.getState?.(), fmtEur = ctx?.handlers?.fmtEur) {
  const home = $('assistant-home');
  const list = $('assistant-list-view');
  if (!home || ctx?.view !== 'home') return;

  list?.classList.add('hidden');
  home.classList.remove('hidden');
  $('assistant-back')?.classList.add('hidden');

  const insights = buildInsights(state, fmtEur);
  const k = state?.dashboardData?.kpis;

  $('assistant-greeting').textContent = getGreeting();

  $('assistant-insight').innerHTML = insights.top
    ? `<p class="text-sm font-medium text-emerald-300">${temperatureBadgeHtml(insights.top.Closing_Temperature, insights.top.Score_Eligibilite_Closing)} ${escapeHtml(insights.top.Nom_Ecole?.slice(0, 38))}</p>
       <p class="mt-1 text-[11px] text-slate-400">${escapeHtml(insights.top.Commune)} · gain net mairie ${escapeHtml(insights.top.Gain_Net_Fourchette_Label ?? `${fmtEur.format(insights.top.Gain_Net_Annuel_Mairie_Euros ?? 0)}/an`)}</p>
       <button type="button" class="btn-insight-solo mt-2 text-[11px] font-medium text-sky-400 hover:text-sky-300" data-uai="${escapeHtml(insights.top.Code_UAI)}">Voir la fiche →</button>`
    : `<p class="text-[11px] text-slate-400">${escapeHtml(insights.headline)}</p>`;

  $('assistant-insight')?.querySelector('.btn-insight-solo')?.addEventListener('click', (e) => {
    ctx.handlers.selectEntity('school', e.currentTarget.dataset.uai);
    closeAssistantPanel();
  });

  $('assistant-kpi-row').innerHTML = k ? `
    <span class="rounded-lg bg-slate-900/80 px-2.5 py-1.5 text-[10px]">${k.totalSchools} écoles</span>
    <span class="rounded-lg bg-indigo-950/50 px-2.5 py-1.5 text-[10px] text-indigo-300" title="Intercommunalités avec pack">${k.packageCount ?? 0} EPCI · ${k.packEpciCount ?? 0} finançables</span>
    <span class="rounded-lg bg-sky-950/50 px-2.5 py-1.5 text-[10px] text-sky-300">${fmtEur.format(k.totalCapex)}</span>
    <span class="rounded-lg bg-teal-950/50 px-2.5 py-1.5 text-[10px] text-teal-300" title="Économies moins loyer financement">${fmtEur.format(k.totalGainNetMairie ?? 0)}/an pour les mairies</span>
  ` : '';

  $('assistant-intents').innerHTML = INTENTS.map((intent) => `
    <button type="button" class="intent-card flex flex-col rounded-xl border border-slate-700/80 bg-slate-900/50 p-3 text-left" data-intent="${intent.id}">
      <span class="text-lg">${intent.emoji}</span>
      <span class="mt-2 text-xs font-semibold text-slate-100">${escapeHtml(intent.title)}</span>
      <span class="mt-1 text-[10px] leading-snug text-slate-500">${escapeHtml(intent.desc)}</span>
    </button>`).join('');

  $('assistant-intents').querySelectorAll('[data-intent]').forEach((btn) => {
    btn.addEventListener('click', () => runIntent(btn.dataset.intent, state, fmtEur));
  });

  const quick = insights.top;
  $('assistant-quick-list').innerHTML = quick ? `
    <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Potentiel max</p>
    <button type="button" class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left hover:border-slate-600" data-quick-school="${escapeHtml(quick.Code_UAI)}">
      <p class="text-xs font-medium">${escapeHtml(quick.Nom_Ecole?.slice(0, 40))}</p>
      <p class="mt-1 text-[10px] text-slate-500">${escapeHtml(quick.Commune)} · ${fmtEur.format(quick.CAPEX_Total)} · DPE ${escapeHtml(quick.Classe_DPE)}</p>
    </button>` : '';

  $('assistant-quick-list')?.querySelector('[data-quick-school]')?.addEventListener('click', (e) => {
    ctx.handlers.selectEntity('school', e.currentTarget.dataset.quickSchool);
    closeAssistantPanel();
  });
}

function runIntent(intentId, state, fmtEur) {
  const intent = INTENTS.find((i) => i.id === intentId);
  if (!intent) return;

  if (intent.view === 'mairies') {
    ctx.view = 'list';
    const items = (state.data?.mairies ?? [])
      .map((m) => ({
        id: m.id,
        type: 'mairie',
        title: m.nom,
        sub: `${m.schoolCount} école(s) · ${fmtEur.format(m.capex)} · score ${m.scoreClosing ?? '—'}`,
        tempBadge: m.closingTemperature ? temperatureBadgeHtml(m.closingTemperature, m.scoreClosing) : '',
      }));
    renderAssistantList({
      title: 'Choisir une mairie',
      subtitle: 'Triées par priorité commerciale',
      items: sortByClosingScore(items, state),
    });
    return;
  }

  if (intent.view === 'packages') {
    ctx.view = 'list';
    renderAssistantList({
      title: 'Intercommunalités (EPCI)',
      subtitle: 'Regroupements territoriaux · ticket ≥ seuil',
      items: (state.data?.packages ?? []).map((p) => ({
        id: p.id,
        type: 'package',
        title: p.nomEpci ?? p.id,
        sub: `${p.schoolIds.length} écoles · ${fmtEur.format(p.partFondsTotal ?? 0)} part fonds · ${p.ticketValid ? 'Pack finançable' : p.partFondsMilestone ? `≥ ${formatEpciMilestoneLabel(state)}` : `Sous ${formatEpciMilestoneLabel(state)}`}`,
        badge: p.ticketValid ? 'valid' : p.partFondsMilestone ? 'milestone' : 'draft',
      })),
    });
    return;
  }

  if (intent.filter) {
    state.chasseFilter = intent.filter;
    ctx.handlers.setMapFilter?.(intent.filter);
    ctx.view = 'list';
    renderAssistantSchoolList(state, fmtEur, intent.title);
  }
}

function renderAssistantSchoolList(state, fmtEur, title) {
  const schools = state.dashboardData?.schools ?? [];
  let list = [...schools];

  if (state.chasseFilter === 'dpe-bad') {
    list = list.filter((s) => ['E', 'F', 'G'].includes(String(s.Classe_DPE).toUpperCase().charAt(0)));
  } else if (state.chasseFilter === 'solo') {
    list = list.filter((s) => s.Financement_Statut === 'FINANÇABLE_SOLO');
  }

  list.sort((a, b) => (b.Score_Eligibilite_Closing ?? 0) - (a.Score_Eligibilite_Closing ?? 0));

  renderAssistantList({
    title,
    subtitle: `${list.length} résultat(s) · tri score closing`,
    items: list.map((s) => ({
      id: s.Code_UAI,
      type: 'school',
      title: s.Nom_Ecole,
      sub: `${s.Commune} · DPE ${s.Classe_DPE} · ${fmtEur.format(s.CAPEX_Total)}`,
      badge: s.Financement_Statut === 'FINANÇABLE_SOLO' ? 'solo' : null,
      tempBadge: temperatureBadgeHtml(s.Closing_Temperature, s.Score_Eligibilite_Closing),
    })),
  });
}

function renderAssistantList({ title, subtitle, items }) {
  $('assistant-home')?.classList.add('hidden');
  $('assistant-list-view')?.classList.remove('hidden');
  $('assistant-back')?.classList.remove('hidden');
  $('assistant-list-title').textContent = title;
  $('assistant-list-sub').textContent = subtitle;

  const container = $('assistant-list-items');
  if (!container) return;

  container.innerHTML = items.length ? items.map((item) => `
    <button type="button" class="assistant-list-row w-full rounded-xl border border-transparent bg-slate-900/50 px-3 py-2.5 text-left hover:border-slate-700" data-type="${item.type}" data-id="${escapeHtml(item.id)}">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="truncate text-xs font-medium">${escapeHtml(item.title)}</p>
          <p class="mt-0.5 truncate text-[10px] text-slate-500">${escapeHtml(item.sub)}</p>
        </div>
        ${item.tempBadge || tempBadgeForItem(item, ctx.handlers.getState())}
        ${item.badge === 'solo' ? '<span class="shrink-0 rounded bg-emerald-950/60 px-1.5 py-0.5 text-[9px] text-emerald-400">Solo</span>' : ''}
        ${item.badge === 'valid' ? '<span class="shrink-0 rounded bg-emerald-950/60 px-1.5 py-0.5 text-[9px] text-emerald-400">OK</span>' : ''}
        ${item.badge === 'milestone' ? '<span class="shrink-0 rounded bg-emerald-950/60 px-1.5 py-0.5 text-[9px] text-emerald-300">1 M€</span>' : ''}
        ${item.badge === 'draft' ? '<span class="shrink-0 rounded bg-amber-950/60 px-1.5 py-0.5 text-[9px] text-amber-400">&lt;1 M€</span>' : ''}
      </div>
    </button>`).join('') : '<p class="py-8 text-center text-xs text-slate-500">Aucun résultat</p>';

  container.querySelectorAll('.assistant-list-row').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.handlers.selectEntity(btn.dataset.type, btn.dataset.id);
      closeAssistantPanel();
    });
  });
}

function renderPaletteResults(query) {
  const q = query.trim();
  const state = ctx.handlers.getState();
  const results = [];

  const nl = parseNaturalLanguageQuery(q, state);
  if (nl) {
    if (nl.type === 'hot-dossiers') {
      results.push({
        kind: 'nl',
        id: 'hot-dossiers',
        label: 'Montre les dossiers chauds (score ≥ 75)',
        sub: 'Écoles avec score élevé',
        icon: '🔥',
      });
    }
    if (nl.type === 'artisan-commune') {
      results.push({
        kind: 'nl',
        id: 'artisan-commune',
        commune: nl.commune,
        label: `Artisan de ${nl.commune}`,
        sub: 'Fiche adéquation RGE',
        icon: '🔧',
      });
    }
    if (nl.type === 'pitch-commune') {
      results.push({
        kind: 'nl',
        id: 'pitch-commune',
        commune: nl.commune,
        label: `Génère le pitch Lemlist — ${nl.commune}`,
        sub: 'Email pré-rempli',
        icon: '✉',
      });
    }
  }

  for (const cmd of COMMANDS) {
    if (!q) {
      if (PALETTE_QUICK_IDS.includes(cmd.id)) results.push({ kind: 'cmd', ...cmd });
      continue;
    }
    if (cmd.label.toLowerCase().includes(q.toLowerCase()) || cmd.id.includes(q.toLowerCase())) {
      results.push({ kind: 'cmd', ...cmd });
    }
  }

  if (state.data && q.length >= 2) {
    for (const m of state.data.mairies) {
      if (m.nom.toLowerCase().includes(q.toLowerCase())) {
        results.push({
          kind: 'entity',
          type: 'mairie',
          id: m.id,
          label: m.nom,
          sub: `${m.closingTemperature ?? ''} · ${m.schoolCount} école(s)`,
        });
      }
    }
    for (const s of state.data.schools) {
      if (s.nom.toLowerCase().includes(q.toLowerCase()) || s.commune.toLowerCase().includes(q.toLowerCase())) {
        results.push({ kind: 'entity', type: 'school', id: s.id, label: s.nom, sub: `${s.commune} · DPE ${s.classeDpe}` });
      }
    }
    for (const p of state.data.packages ?? []) {
      const label = p.nomEpci ?? p.id;
      if (label.toLowerCase().includes(q.toLowerCase()) || String(p.id).toLowerCase().includes(q.toLowerCase())) {
        results.push({
          kind: 'entity',
          type: 'package',
          id: p.id,
          label,
          sub: `${p.schoolIds.length} école(s) · ${p.ticketValid ? 'Pack finançable' : 'À consolider'}`,
        });
      }
    }
  }

  const box = $('palette-results');
  if (!box) return;

  ctx.paletteIndex = 0;
  const icons = { mairie: '🏛', school: '🏫', artisan: '🔧', package: '📦' };

  box.innerHTML = results.slice(0, 14).map((r, i) => {
    if (r.kind === 'nl') {
      return `<button type="button" class="cmd-item flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left hover:bg-slate-800/80 ${i === 0 ? 'active' : ''}" data-nl="${r.id}" data-commune="${escapeHtml(r.commune ?? '')}">
        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-950/60 text-sm">${r.icon}</span>
        <span><span class="block text-xs font-medium">${escapeHtml(r.label)}</span><span class="block text-[10px] text-violet-300/80">${escapeHtml(r.sub)}</span></span>
      </button>`;
    }
    if (r.kind === 'cmd') {
      return `<button type="button" class="cmd-item flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left hover:bg-slate-800/80 ${i === 0 ? 'active' : ''}" data-cmd="${r.id}">
        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-sm">${r.icon}</span>
        <span><span class="block text-xs font-medium">${escapeHtml(r.label)}</span><span class="block text-[10px] text-slate-500">${escapeHtml(r.group)}</span></span>
      </button>`;
    }
    return `<button type="button" class="cmd-item flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left hover:bg-slate-800/80 ${i === 0 ? 'active' : ''}" data-entity-type="${r.type}" data-entity-id="${escapeHtml(r.id)}">
      <span class="text-lg">${icons[r.type] ?? '•'}</span>
      <span class="min-w-0"><span class="block truncate text-xs font-medium">${escapeHtml(r.label)}</span><span class="block truncate text-[10px] text-slate-500">${escapeHtml(r.sub)}</span></span>
    </button>`;
  }).join('') || '<p class="px-3 py-6 text-center text-xs text-slate-500">Aucune commande</p>';

  box.querySelectorAll('[data-nl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      executeNaturalLanguage(btn.dataset.nl, btn.dataset.commune);
      closeCommandPalette();
    });
  });

  box.querySelectorAll('[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      executeCommand(btn.dataset.cmd);
      closeCommandPalette();
    });
  });

  box.querySelectorAll('[data-entity-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.handlers.selectEntity(btn.dataset.entityType, btn.dataset.entityId);
      closeCommandPalette();
      closeAssistantPanel();
    });
  });
}

function executeNaturalLanguage(actionId, communeQuery) {
  const h = ctx.handlers;
  const state = h.getState();

  if (actionId === 'hot-dossiers') {
    ctx.view = 'list';
    const items = (state.data?.mairies ?? [])
      .filter((m) => (m.scoreClosing ?? 0) >= 75)
      .map((m) => ({
        id: m.id,
        type: 'mairie',
        title: m.nom,
        sub: `Score ${m.scoreClosing}/100 · ${m.schoolCount} école(s)`,
        tempBadge: temperatureBadgeHtml(m.closingTemperature, m.scoreClosing),
      }));
    renderAssistantList({
      title: '🔥 Dossiers chauds',
      subtitle: `${items.length} mairie(s) avec score ≥ 75`,
      items: sortByClosingScore(items, state),
    });
    openAssistantPanel();
    return;
  }

  if (actionId === 'artisan-commune') {
    const schools = findCommuneSchools(state, communeQuery);
    const primary = [...schools].sort((a, b) => (b.Score_Eligibilite_Closing ?? 0) - (a.Score_Eligibilite_Closing ?? 0))[0];
    if (!primary) {
      showToastFallback(`Aucune école trouvée pour « ${communeQuery} »`);
      return;
    }
    const artisan = state.data?.artisans?.find(
      (a) => a.nom === primary.Artisan_Nom || a.id === primary.Artisan_SIRET,
    );
    if (artisan) {
      h.selectEntity('artisan', artisan.id);
    } else {
      showToastFallback(`Artisan ${primary.Artisan_Nom ?? 'inconnu'} — ouvrez la fiche école`);
      h.selectEntity('school', primary.Code_UAI);
    }
    return;
  }

  if (actionId === 'pitch-commune') {
    h.openLemlistForCommune?.(communeQuery);
  }
}

function executeCommand(cmdId) {
  const h = ctx.handlers;
  switch (cmdId) {
    case 'chasse-resume': h.startPipelineRun('resume'); break;
    case 'chasse-full': h.startPipelineRun('full'); break;
    case 'export': h.exportCsv(); break;
    case 'refresh': h.loadBootstrap(); break;
    case 'view-table': h.switchSidePanel('tableau'); openAssistantPanel(); break;
    case 'view-map': h.switchSidePanel('chasse'); break;
    case 'fit-map': h.fitMapBounds(); break;
    case 'filter-hot':
      ctx.view = 'list';
      executeNaturalLanguage('hot-dossiers', '');
      break;
    case 'filter-solo':
      h.setMapFilter?.('solo');
      h.getState().chasseFilter = 'solo';
      ctx.view = 'list';
      renderAssistantSchoolList(h.getState(), h.fmtEur, 'Finançables solo');
      openAssistantPanel();
      break;
    case 'filter-dpe':
      h.setMapFilter?.('dpe-bad');
      h.getState().chasseFilter = 'dpe-bad';
      ctx.view = 'list';
      renderAssistantSchoolList(h.getState(), h.fmtEur, 'Meilleures cibles');
      openAssistantPanel();
      break;
    case 'filter-all':
      h.setMapFilter?.('all');
      h.getState().chasseFilter = 'all';
      ctx.view = 'home';
      renderAssistantHome(h.getState(), h.fmtEur);
      openAssistantPanel();
      break;
    default: break;
  }
}

function renderContextDock(state, fmtEur) {
  const dock = $('context-dock');
  if (!dock) return;

  const sel = state.selected;
  if (!sel) {
    dock.classList.add('hidden-dock');
    return;
  }

  dock.classList.remove('hidden-dock');
  const steps = buildNextSteps(state, fmtEur);
  $('context-dock-title').textContent = steps.title;
  $('context-dock-desc').textContent = steps.desc;
  $('context-dock-action').textContent = steps.actionLabel;
  $('context-dock-action').onclick = steps.onAction;

  $('context-steps').innerHTML = steps.steps.map((s, i) => `
    <div class="flex items-center gap-2">
      <span class="step-dot ${s.done ? 'done' : i === steps.currentIdx ? 'current' : ''}"></span>
      <span class="text-[10px] ${s.done ? 'text-slate-500 line-through' : 'text-slate-300'}">${escapeHtml(s.label)}</span>
    </div>`).join('');

  const objHost = $('context-objections');
  if (objHost) {
    if (sel.type === 'mairie') {
      objHost.innerHTML = renderObjectionSimulator(state, fmtEur, sel.id);
      objHost.classList.remove('hidden');
    } else {
      objHost.innerHTML = '';
      objHost.classList.add('hidden');
    }
  }
}

function buildNextSteps(state, fmtEur) {
  const sel = state.selected;
  const h = ctx.handlers;

  if (sel.type === 'school') {
    const row = state.dashboardData?.schools?.find((s) => s.Code_UAI === sel.id);
    const s = state.data?.schools?.find((x) => x.id === sel.id);
    const insee = row?.Code_INSEE ?? s?.codeInsee;
    const hasEmail = row?.Email_Mairie ?? s?.emailMairie;
    const isSolo = row?.Financement_Statut === 'FINANÇABLE_SOLO';

    return {
      title: 'Prospection école',
      desc: isSolo ? 'Dossier solo viable — enchaînez mairie + email' : 'Qualifiez puis montez le dossier mairie',
      actionLabel: insee ? 'Ouvrir dossier mairie' : 'Continuer',
      onAction: () => {
        if (insee) h.selectEntity('mairie', insee);
        else showToastFallback('Code INSEE absent');
      },
      currentIdx: hasEmail ? 1 : 0,
      steps: [
        { label: 'Analyser la fiche école', done: true },
        { label: 'Préparer le dossier mairie', done: false },
        { label: 'Envoyer email Lemlist', done: false },
      ],
    };
  }

  if (sel.type === 'mairie') {
    const m = state.data?.mairies?.find((x) => x.id === sel.id);
    return {
      title: `Dossier mairie ${m?.closingTemperature ?? ''}`.trim(),
      desc: `Score closing ${m?.scoreClosing ?? '—'}/100 · simulateur d'objections actif`,
      actionLabel: 'Télécharger le PDF',
      onAction: () => {
        const insee = sel.id;
        h.downloadMgpePdf?.(insee);
      },
      currentIdx: 1,
      steps: [
        { label: 'Synthèse communale', done: true },
        { label: 'Vérifier timeline & loyer', done: false },
        { label: 'Exporter PDF instruction', done: false },
      ],
    };
  }

  if (sel.type === 'package') {
    const pkg = state.data?.packages?.find((x) => x.id === sel.id);
    return {
      title: pkg?.nomEpci ?? pkg?.id ?? 'Pack EPCI',
      desc: pkg?.ticketValid
        ? `Pack finançable · ${pkg.schoolIds?.length ?? 0} écoles · gain net pessimiste ${fmtEur.format(pkg.gainNetPessimisteTotal ?? 0)}/an`
        : `À consolider · ${pkg?.schoolIds?.length ?? 0} écoles — regroupement territorial`,
      actionLabel: 'Voir les mairies du pack',
      onAction: () => {
        const firstSchool = state.data?.schools?.find((s) => s.id === pkg?.schoolIds?.[0]);
        const insee = firstSchool?.codeInsee;
        if (insee) h.selectEntity('mairie', insee);
        else showToastFallback('Aucune mairie liée');
      },
      currentIdx: pkg?.ticketValid ? 2 : 1,
      steps: [
        { label: 'Cartographier le territoire EPCI', done: true },
        { label: 'Consolider le ticket part fonds', done: Boolean(pkg?.ticketValid) },
        { label: 'Monter les dossiers mairies', done: false },
      ],
    };
  }

  return {
    title: 'Exploration',
    desc: 'Sélectionnez une cible pour voir les prochaines étapes',
    actionLabel: 'Ouvrir l\'assistant',
    onAction: () => { openAssistantPanel(); renderAssistantHome(state, fmtEur); },
    currentIdx: 0,
    steps: [{ label: 'Choisir une cible', done: false }],
  };
}

function showToastFallback(msg) {
  ctx.handlers.showToast?.(msg, 'warn');
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour !';
  if (h < 18) return 'Que souhaitez-vous faire ?';
  return 'Bonsoir !';
}
