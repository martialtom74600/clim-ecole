import { downloadMgpePdPdf, setPrixKwhTertiaireFallback } from './mgpePdMairie.js';
import {
  syncDepartmentBoundaries,
  applyDepartmentBoundaryVisibility,
  updateDepartmentBoundaryStyle,
} from './departmentBoundaries.js';
import { getMapZoomTier, epciTerritoryStyle, epciCapexFillOpacity, getMaxPackageCapex } from './mapStyle.js';
import { createSchoolIcon } from './mapMarkers.js';
import {
  createEpciPartitionedClusterLayer,
  createEpciHubLayer,
} from './mapCluster.js';
import { schoolPopupHtml, packagePopupHtml } from './mapPopups.js';
import {
  buildMairieMarkers,
  buildArtisanMarkers,
  buildNetworkLayer,
  fitPackageBounds,
} from './mapNetwork.js';
import {
  getMapFilterStats,
  buildSearchSuggestions,
  buildSearchDropdownHtml,
  getVisibleSchoolIdsPerPackage,
  flyToSearchHit,
} from './mapSearch.js';
import {
  getFilteredSchoolIds,
  buildPortfolioItems,
  buildPortfolioCardHtml,
  resolveFocusContext,
  buildFocusPanelHtml,
} from './focusPanel.js';
import {
  buildCommuneDetailHtml,
  buildSchoolDetailHtml,
  buildFocusDetailLink,
  buildMgpeZenBlock,
  buildCommuneFoncierMatrix,
  buildFoncierPanelHtml,
  getSchoolsForCommune,
  getSchoolRow,
} from './detailPages.js';
import { initSchoolMiniMap, destroySchoolMiniMap } from './miniMap.js';
import { buildClosingHeatLayer } from './mapHeatmap.js';
import { buildEpciTimelineLayer, syncTimelineVisibility } from './mapTimeline.js';
import {
  toggleCompareId,
  clearCompare,
  buildComparePanelHtml,
  parseCompareParam,
} from './mapCompare.js';
import {
  collectSchoolIds,
  findNewSchoolIds,
  pulseSchoolMarkers,
} from './mapLiveSync.js';
import {
  initAssistant,
  onAssistantDataUpdate,
  onAssistantSelectionChange,
  renderAssistantHome,
} from './assistant.js';

const fmt = new Intl.NumberFormat('fr-FR');
const fmtEur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const state = {
  data: null,
  dashboardData: null,
  map: null,
  layers: {},
  markers: { schools: {} },
  epciTerritoryRefs: [],
  mapTier: 'territory',
  layerVisibility: {
    departments: false,
    schools: true,
    packages: true,
    mairies: false,
    artisans: false,
    network: false,
    heatmap: false,
    timeline: false,
  },
  epciColorMode: 'status',
  maxPackageCapex: 0,
  compareIds: [],
  compareMode: false,
  knownSchoolIds: null,
  searchDebounceTimer: null,
  searchActiveIndex: 0,
  searchSuggestions: [],
  boundaryLayer: null,
  boundaryDeptKey: '',
  initialBounds: null,
  selected: null,
  focusContext: null,
  viewMode: 'map',
  mapFilter: 'all',
  searchQuery: '',
  refreshTimer: null,
  pipelineRunning: false,
  logEventSource: null,
  bootstrapInFlight: false,
  bootstrapPromise: null,
  autoRefreshInitialized: false,
  detailPage: null,
  returnViewMode: 'map',
};

const API_TOKEN_KEY = 'clim-ecole-api-token';

function $(id) { return document.getElementById(id); }

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function apiHeaders(extra = {}) {
  const headers = { ...extra };
  const token = sessionStorage.getItem(API_TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseJsonResponse(res) {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('json')) {
    const text = await res.text();
    if (text.includes('Cannot GET')) throw new Error('API absente — redémarrez le serveur (npm run dashboard)');
    throw new Error(`Réponse serveur invalide (${res.status})`);
  }
  return res.json();
}

async function ensureApiToken(required) {
  if (!required) return true;
  if (sessionStorage.getItem(API_TOKEN_KEY)) return true;
  const token = window.prompt('Token API dashboard (DASHBOARD_API_TOKEN) :');
  if (!token?.trim()) return false;
  sessionStorage.setItem(API_TOKEN_KEY, token.trim());
  return true;
}

function showToast(message, type = 'info') {
  const host = $('toast-host');
  const el = document.createElement('div');
  el.className = `zen-toast${type === 'success' ? ' ok' : type === 'error' ? ' err' : ''}`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Copié ✓';
      setTimeout(() => { btn.textContent = orig; }, 1400);
    } else {
      showToast('Copié', 'success');
    }
  } catch {
    showToast('Impossible de copier', 'error');
  }
}

function buildLemlistPitch(ctx) {
  const row = ctx.row ?? ctx.leadRow;
  const nom = row?.Nom_Ecole ?? ctx.subtitle ?? ctx.title;
  const commune = ctx.commune ?? row?.Commune ?? '';
  const subject = `Rénovation énergétique ${nom} — MGPE-PD / Décret Tertiaire 2030`;
  const body = `Bonjour,

${row?.Argumentaire_Loi_ELAN ?? row?.argumentaireElan ?? ''}

Montage MGPE-PD compatible DETR / Fonds Vert ÉduRénov.
Investissement : ${fmtEur.format(ctx.capex)} · Gain net estimé : ${fmtEur.format(ctx.gain)}/an.

Cordialement`;
  return { subject, body, full: `Objet: ${subject}\n\n${body}`, email: ctx.emailMairie ?? row?.Email_Mairie ?? '' };
}

// ── Bootstrap ──

function setBootstrapLoading(loading) {
  state.bootstrapInFlight = loading;
  $('map-loading')?.classList.toggle('hidden', !loading);
}

async function loadBootstrap(silent = false) {
  if (state.bootstrapPromise) {
    if (!silent) setBootstrapLoading(true);
    return state.bootstrapPromise;
  }
  if (!silent) setBootstrapLoading(true);
  state.bootstrapInFlight = true;

  state.bootstrapPromise = (async () => {
    try {
      const res = await fetch('/api/bootstrap');
      const payload = await parseJsonResponse(res);
      if (!res.ok) throw new Error(payload.error || 'Erreur de chargement');

      state.dashboardData = payload.dashboard;
      if (payload.dashboard?.config?.prixKwhTertiaire != null) {
        setPrixKwhTertiaireFallback(payload.dashboard.config.prixKwhTertiaire);
      }

      const prevIds = state.knownSchoolIds ?? collectSchoolIds(state.data);
      const newSchoolIds = findNewSchoolIds(prevIds, payload.map?.schools);
      state.knownSchoolIds = collectSchoolIds(payload.map);

      state.data = payload.map;
      renderLayers(payload.map, { fitBounds: !silent });
      if (silent && newSchoolIds.length) {
        pulseSchoolMarkers(state.markers.schools, newSchoolIds);
        showToast(`${newSchoolIds.length} nouvelle(s) cible(s) sur la carte`, 'success');
      }
      syncDepartmentBoundaries(state);
      renderPortfolios();
      if (!state.autoRefreshInitialized) {
        setupAutoRefresh();
        state.autoRefreshInitialized = true;
      }
      await handleRoute();
      if (!state.detailPage) {
        const route = parseRoute();
        applyMapUrlState(route.mapQuery);
      }
      onAssistantDataUpdate(state, fmtEur);
      if (!silent && !state.detailPage) showToast(`${payload.map.stats.schools} cibles chargées`, 'success');
    } catch (err) {
      if (!silent) showToast(err.message, 'error');
    } finally {
      state.bootstrapInFlight = false;
      state.bootstrapPromise = null;
      setBootstrapLoading(false);
      setTimeout(() => state.map?.invalidateSize(), 100);
    }
  })();

  return state.bootstrapPromise;
}

function setupAutoRefresh() {
  clearInterval(state.refreshTimer);
  const sec = state.dashboardData?.config?.autoRefreshSec ?? 60;
  state.refreshTimer = setInterval(() => {
    if (state.pipelineRunning || state.bootstrapInFlight) return;
    loadBootstrap(true);
  }, sec * 1000);
}

// ── View modes ──

function setViewMode(mode) {
  if (state.detailPage) return;
  state.viewMode = mode;
  const isMap = mode === 'map';
  const mapEl = $('view-map');
  const pfEl = $('view-portfolios');
  mapEl?.classList.toggle('zen-view-active', isMap);
  if (mapEl) mapEl.hidden = !isMap;
  pfEl?.classList.toggle('zen-view-active', !isMap);
  if (pfEl) pfEl.hidden = isMap;
  $('seg-map')?.classList.toggle('active', isMap);
  $('seg-portfolios')?.classList.toggle('active', !isMap);
  if (isMap) setTimeout(() => state.map?.invalidateSize(), 150);
}

// ── Detail pages routing ──

function parseRoute() {
  const path = window.location.pathname;
  const mC = path.match(/^\/c\/([^/]+)$/);
  const mE = path.match(/^\/e\/([^/]+)$/);
  if (mC) return { page: 'commune', id: decodeURIComponent(mC[1]) };
  if (mE) return { page: 'school', id: decodeURIComponent(mE[1]) };
  const q = new URLSearchParams(window.location.search);
  if (q.get('ecole')) return { page: 'school', id: q.get('ecole') };
  const insee = q.get('commune') || q.get('insee');
  if (insee) return { page: 'commune', id: insee };
  return { page: 'home', mapQuery: q };
}

function navigateTo(path, { replace = false } = {}) {
  if (replace) history.replaceState({ path }, '', path);
  else history.pushState({ path }, '', path);
  handleRoute();
}

function openCommuneDetail(insee) {
  if (!state.detailPage) state.returnViewMode = state.viewMode;
  navigateTo(`/c/${encodeURIComponent(insee)}`);
}

function openSchoolDetail(uai) {
  if (!state.detailPage) state.returnViewMode = state.viewMode;
  navigateTo(`/e/${encodeURIComponent(uai)}`);
}

function closeDetailPage() {
  navigateTo('/', { replace: false });
}

function showDetailShell() {
  closeFocus();
  const mapEl = $('view-map');
  const pfEl = $('view-portfolios');
  const dtEl = $('view-detail');
  if (mapEl) { mapEl.hidden = true; mapEl.classList.remove('zen-view-active'); }
  if (pfEl) { pfEl.hidden = true; pfEl.classList.remove('zen-view-active'); }
  if (dtEl) { dtEl.hidden = false; dtEl.classList.add('zen-view-active'); }
  document.querySelector('.zen-segment')?.classList.add('is-hidden');
}

function hideDetailShell() {
  destroySchoolMiniMap();
  state.detailPage = null;
  const dtEl = $('view-detail');
  if (dtEl) {
    dtEl.hidden = true;
    dtEl.classList.remove('zen-view-active', 'view-detail-exit');
  }
  $('detail-scroll').innerHTML = '';
  document.querySelector('.zen-segment')?.classList.remove('is-hidden');
  setViewMode(state.returnViewMode || 'map');
}

function removeSchoolFromClientState(uai) {
  if (state.dashboardData?.schools) {
    state.dashboardData.schools = state.dashboardData.schools.filter((r) => r.Code_UAI !== uai);
    if (state.dashboardData.kpis) {
      state.dashboardData.kpis.totalSchools = state.dashboardData.schools.length;
    }
  }
  if (state.data?.schools) {
    state.data.schools = state.data.schools.filter((s) => s.id !== uai);
    delete state.markers.schools[uai];
    rebuildSchoolCluster();
    updateFilterStatsUI();
  }
  if (state.selected?.type === 'school' && state.selected.id === uai) {
    state.selected = null;
  }
  if (state.focusContext?.kind === 'school' && state.focusContext.id === uai) {
    closeFocus();
  }
  renderPortfolios();
}

async function blacklistCurrentSchool(uai, row) {
  const btn = $('dt-school-blacklist');
  if (!btn || btn.disabled) return;

  const label = row?.Nom_Ecole ?? uai;
  if (!window.confirm(`Écarter définitivement « ${label} » de la prospection ?`)) {
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Écart en cours…';

  try {
    const res = await fetch('/api/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiHeaders() },
      body: JSON.stringify({ id: uai, codeUai: uai }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Impossible d’écarter ce bâtiment');
    }

    removeSchoolFromClientState(uai);

    const dtEl = $('view-detail');
    dtEl?.classList.add('view-detail-exit');
    await new Promise((resolve) => setTimeout(resolve, 300));

    destroySchoolMiniMap();
    state.detailPage = null;
    if (dtEl) {
      dtEl.hidden = true;
      dtEl.classList.remove('zen-view-active', 'view-detail-exit');
    }
    $('detail-scroll').innerHTML = '';
    document.querySelector('.zen-segment')?.classList.remove('is-hidden');

    if (history.length > 1) {
      history.back();
    } else {
      navigateTo('/', { replace: true });
      setViewMode(state.returnViewMode || 'map');
    }

    showToast('Bâtiment écarté — blacklist mise à jour', 'success');
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '✖ Écarter ce bâtiment';
    showToast(err.message, 'error');
  }
}

async function renderCommuneDetail(insee) {
  const schools = getSchoolsForCommune(state, insee);
  if (!schools.length) {
    showToast('Commune introuvable', 'error');
    hideDetailShell();
    history.replaceState({}, '', '/');
    return;
  }

  const mairie = state.data?.mairies?.find((m) => m.id === insee);
  let dossier = {
    codeInsee: insee,
    nomOfficiel: mairie?.nom ?? schools[0].Commune,
    departement: schools[0].Departement,
    population: mairie?.population,
    emailMairie: mairie?.email ?? schools[0].Email_Mairie,
    schoolCount: schools.length,
    capex: schools.reduce((s, r) => s + (r.CAPEX_Total ?? 0), 0),
    partFonds: schools.reduce((s, r) => s + (r.Part_Fonds_Euros ?? 0), 0),
    economies: schools.reduce((s, r) => s + (r.Economie_Realiste_Euros ?? r.Economie_Annuelle_Euros ?? 0), 0),
    gainNetFourchetteLabel: null,
  };

  try {
    const res = await fetch(`/api/commune/${insee}`);
    if (res.ok) {
      const api = await res.json();
      dossier = { ...dossier, ...api };
    }
  } catch { /* fallback local */ }

  $('detail-scroll').innerHTML = buildCommuneDetailHtml(dossier, schools, fmt, fmtEur);
  const mgpeSlot = $('dt-mgpe-slot');
  if (mgpeSlot && dossier.mgpePd) {
    mgpeSlot.outerHTML = buildMgpeZenBlock(dossier.mgpePd, fmtEur);
  }

  bindDetailPageEvents({ type: 'commune', insee, dossier, schools });
  setupCommuneTabs(insee, schools);
  document.title = `${dossier.nomOfficiel} — Clim École`;
}

function setupCommuneTabs(insee, schools) {
  let foncierReady = false;
  const scroll = $('detail-scroll');
  if (!scroll) return;

  scroll.querySelectorAll('[data-commune-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.communeTab;
      scroll.querySelectorAll('[data-commune-tab]').forEach((b) => b.classList.toggle('active', b.dataset.communeTab === tab));
      scroll.querySelectorAll('[data-commune-panel]').forEach((p) => {
        const active = p.dataset.communePanel === tab;
        p.classList.toggle('is-active', active);
        p.classList.toggle('hidden', !active);
      });
      if (tab === 'foncier' && !foncierReady) {
        const panel = $('dt-foncier-panel');
        if (panel) {
          const matrix = buildCommuneFoncierMatrix(schools, insee);
          panel.innerHTML = buildFoncierPanelHtml(matrix, fmt);
          panel.querySelectorAll('[data-nav-school]').forEach((el) => {
            el.addEventListener('click', (e) => {
              e.preventDefault();
              openSchoolDetail(el.dataset.navSchool);
            });
          });
        }
        foncierReady = true;
      }
    });
  });
}

function renderSchoolDetail(uai) {
  const row = getSchoolRow(state, uai);
  if (!row) {
    showToast('École introuvable', 'error');
    hideDetailShell();
    history.replaceState({}, '', '/');
    return;
  }

  $('detail-scroll').innerHTML = buildSchoolDetailHtml(row, fmt, fmtEur);
  bindDetailPageEvents({ type: 'school', uai, row });
  document.title = `${row.Nom_Ecole} — Clim École`;

  const mapEl = $('school-mini-map');
  if (mapEl?.dataset.lat) {
    requestAnimationFrame(() => {
      initSchoolMiniMap(Number(mapEl.dataset.lat), Number(mapEl.dataset.lon));
    });
  }
}

function bindDetailPageEvents(ctx) {
  $('detail-scroll')?.querySelector('[data-nav-back]')?.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else closeDetailPage();
  });

  $('detail-scroll')?.querySelectorAll('[data-nav-school]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openSchoolDetail(el.dataset.navSchool);
    });
  });

  $('detail-scroll')?.querySelectorAll('[data-nav-commune]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openCommuneDetail(el.dataset.navCommune);
    });
  });

  if (ctx.type === 'commune') {
    $('dt-commune-lemlist')?.addEventListener('click', async (e) => {
      const lead = ctx.schools[0];
      const pitch = buildLemlistPitch({
        row: lead,
        subtitle: lead?.Nom_Ecole,
        commune: ctx.dossier.nomOfficiel,
        capex: ctx.dossier.capex,
        gain: ctx.dossier.economies,
        emailMairie: ctx.dossier.emailMairie,
      });
      await copyText(pitch.full, e.currentTarget);
    });
    $('dt-commune-pdf')?.addEventListener('click', () => {
      downloadMgpePdPdf(ctx.insee, { apiHeaders, showToast });
    });
  }

  if (ctx.type === 'school') {
    $('dt-school-lemlist')?.addEventListener('click', async (e) => {
      const pitch = buildLemlistPitch({
        row: ctx.row,
        subtitle: ctx.row.Nom_Ecole,
        commune: ctx.row.Commune,
        capex: ctx.row.CAPEX_Total,
        gain: ctx.row.Gain_Net_Annuel_Mairie_Euros ?? ctx.row.Economie_Realiste_Euros,
        emailMairie: ctx.row.Email_Mairie,
      });
      await copyText(pitch.full, e.currentTarget);
    });
    $('dt-school-pdf')?.addEventListener('click', () => {
      if (ctx.row.Code_INSEE) downloadMgpePdPdf(ctx.row.Code_INSEE, { apiHeaders, showToast });
    });
    $('dt-school-blacklist')?.addEventListener('click', () => {
      blacklistCurrentSchool(ctx.uai, ctx.row);
    });
  }
}

async function handleRoute() {
  const route = parseRoute();
  if (route.page === 'home') {
    if (state.detailPage) hideDetailShell();
    document.title = 'Clim École';
    return;
  }

  if (!state.dashboardData) {
    state.detailPage = route;
    return;
  }

  state.detailPage = route;
  showDetailShell();
  $('detail-scroll').scrollTop = 0;

  if (route.page === 'commune') await renderCommuneDetail(route.id);
  else if (route.page === 'school') renderSchoolDetail(route.id);
}

function renderPortfolios() {
  const grid = $('portfolio-grid');
  const empty = $('portfolio-empty');
  if (!grid) return;

  const items = buildPortfolioItems(state);
  $('portfolios-meta').textContent = `${items.length} portefeuille${items.length > 1 ? 's' : ''} · EPCI finançables & solo > 1 M€`;

  grid.innerHTML = items.map((item) => buildPortfolioCardHtml(item, fmtEur)).join('');
  empty?.classList.toggle('hidden', items.length > 0);
  grid.classList.toggle('hidden', items.length === 0);
}

// ── Map ──

const POPUP_OPTS = { closeButton: false, offset: [0, -10], className: 'zen-popup-wrap' };
const SEARCH_DEBOUNCE_MS = 200;

function updateFilterStatsUI() {
  const el = $('filter-stats');
  if (!el || !state.dashboardData) return;
  const stats = getMapFilterStats(state);
  const capexLabel = stats.capex >= 1_000_000
    ? `${(stats.capex / 1e6).toFixed(1).replace('.0', '')} M€`
    : `${Math.round(stats.capex / 1000)} k€`;
  el.innerHTML = `<strong>${stats.shown}</strong> / ${stats.total} bâtiments · ${capexLabel} CAPEX${stats.hot ? ` · ${stats.hot} chauds` : ''}`;
}

function updateZoomHint() {
  const el = $('zoom-hint');
  if (!el || !state.map) return;
  const tier = getMapZoomTier(state.map.getZoom());
  el.classList.toggle('hidden', tier !== 'overview' || !state.layerVisibility.schools);
}

function updateSearchDropdown() {
  const dd = $('search-dropdown');
  if (!dd) return;
  const q = String(state.searchQuery ?? '').trim();
  if (q.length < 2) {
    dd.classList.add('hidden');
    dd.innerHTML = '';
    state.searchSuggestions = [];
    return;
  }
  state.searchSuggestions = buildSearchSuggestions(state);
  dd.innerHTML = buildSearchDropdownHtml(state.searchSuggestions, state.searchActiveIndex);
  dd.classList.toggle('hidden', !state.searchSuggestions.length && q.length < 2);
  if (state.searchSuggestions.length) dd.classList.remove('hidden');
}

function hideSearchDropdown() {
  $('search-dropdown')?.classList.add('hidden');
}

function activateSearchHit(hit) {
  if (!hit) return;
  hideSearchDropdown();
  flyToSearchHit(state.map, hit, state.data?.schools);
  if (hit.kind === 'commune') {
    openFocus('mairie', hit.id, { fly: false });
    return;
  }
  openFocus('school', hit.id, { fly: false });
}

function syncMapUrlParams() {
  if (state.detailPage) return;
  const params = new URLSearchParams();
  if (state.mapFilter && state.mapFilter !== 'all') params.set('filter', state.mapFilter);
  if (state.searchQuery?.trim()) params.set('q', state.searchQuery.trim());
  if (state.selected?.type === 'school') params.set('school', state.selected.id);
  if (state.selected?.type === 'package') params.set('epci', state.selected.id);
  if (state.compareIds?.length) params.set('compare', state.compareIds.join(','));
  const qs = params.toString();
  const url = qs ? `/?${qs}` : '/';
  if (`${window.location.pathname}${window.location.search}` !== url) {
    history.replaceState({ path: url }, '', url);
  }
}

function applyMapUrlState(mapQuery) {
  if (!mapQuery || state.detailPage) return;
  const filter = mapQuery.get('filter');
  if (filter && ['all', 'hot', 'epci', 'solo'].includes(filter)) {
    state.mapFilter = filter;
    document.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
  }
  const q = mapQuery.get('q');
  if (q) {
    state.searchQuery = q;
    const input = $('search-input');
    if (input) input.value = q;
  }
  const school = mapQuery.get('school');
  const epci = mapQuery.get('epci');
  if (school && state.data) {
    setTimeout(() => openFocus('school', school, { fly: true }), 400);
  } else if (epci && state.data) {
    setTimeout(() => openFocus('package', epci, { fly: true }), 400);
  }
  const compare = parseCompareParam(mapQuery.get('compare'));
  if (compare.length) {
    state.compareIds = compare;
    updateComparePanel();
  }
}

function updateComparePanel() {
  const panel = $('compare-panel');
  const content = $('compare-content');
  if (!panel || !content) return;
  const hasItems = (state.compareIds?.length ?? 0) > 0;
  panel.classList.toggle('hidden', !hasItems);
  if (!hasItems) {
    content.innerHTML = '';
    syncMapUrlParams();
    return;
  }
  content.innerHTML = buildComparePanelHtml(state, fmtEur);
  content.querySelector('#compare-clear')?.addEventListener('click', () => {
    clearCompare(state);
    updateComparePanel();
    applyMapVisualTier();
  });
  content.querySelectorAll('[data-compare-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.compareIds = state.compareIds.filter((id) => id !== btn.dataset.compareRemove);
      updateComparePanel();
      applyMapVisualTier();
    });
  });
  content.querySelectorAll('[data-compare-open]').forEach((btn) => {
    btn.addEventListener('click', () => openSchoolDetail(btn.dataset.compareOpen));
  });
  syncMapUrlParams();

  const pts = state.compareIds
    .map((id) => state.data?.schools?.find((s) => s.id === id))
    .filter((s) => s?.lat != null)
    .map((s) => [s.lat, s.lon]);
  if (pts.length >= 2 && state.map) {
    state.map.fitBounds(pts, { padding: [100, 100], maxZoom: 13 });
  }
}

function addToCompare(id) {
  const result = toggleCompareId(state, id);
  if (result === 'added') {
    showToast(`Ajouté à la comparaison (${state.compareIds.length}/3)`, 'success');
  }
  updateComparePanel();
  applyMapVisualTier();
}

function bindSchoolMarker(marker, school) {
  marker.bindPopup(schoolPopupHtml(school, { fmt, fmtEur }), POPUP_OPTS);
  marker.on('mouseover', () => marker.openPopup());
  marker.on('mouseout', () => marker.closePopup());
  marker.on('click', (e) => {
    if (e.originalEvent?.shiftKey) {
      addToCompare(school.id);
      return;
    }
    openFocus('school', school.id);
  });
}

function refreshNetworkLayer() {
  if (!state.map) return;
  const old = state.layers.network;
  if (old) state.map.removeLayer(old);

  if (!state.layerVisibility.network) {
    state.layers.network = null;
    return;
  }

  const sel = state.selected;
  state.layers.network = buildNetworkLayer(state.data?.links ?? [], {
    selectedSchoolId: sel?.type === 'school' ? sel.id : null,
    selectedPackageId: sel?.type === 'package' ? sel.id : null,
    selectedMairieInsee: sel?.type === 'mairie' ? sel.id : null,
    visibleSchoolIds: getFilteredSchoolIds(state),
  });

  if (state.layers.network.getLayers().length) {
    state.layers.network.addTo(state.map);
  }
}

function scheduleMapRefresh() {
  clearTimeout(state.searchDebounceTimer);
  state.searchDebounceTimer = setTimeout(() => {
    rebuildSchoolCluster();
    updateFilterStatsUI();
    updateSearchDropdown();
    applyMapVisualTier();
    refreshNetworkLayer();
    syncMapUrlParams();
  }, SEARCH_DEBOUNCE_MS);
}

function flyToFirstSearchMatch() {
  const ids = getFilteredSchoolIds(state);
  if (!ids.length) return;
  const q = state.searchQuery.trim().toLowerCase();
  const row = state.dashboardData?.schools?.find((r) =>
    String(r.Commune ?? '').toLowerCase() === q || String(r.Code_INSEE) === q,
  );
  if (row?.Code_INSEE && ids.length > 1) {
    flyToSearchHit(state.map, { kind: 'commune', id: row.Code_INSEE }, state.data?.schools);
    openFocus('mairie', row.Code_INSEE, { fly: false });
    return;
  }
  flyToSearchHit(state.map, { kind: 'school', id: ids[0] }, state.data?.schools);
  openFocus('school', ids[0], { fly: false });
}

function initMap() {
  state.map = L.map('map', { zoomControl: false, attributionControl: false, zoomSnap: 0.5 }).setView([45.9, 6.2], 8);
  L.control.zoom({ position: 'bottomright' }).addTo(state.map);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(state.map);

  const panes = [
    ['dept-boundaries', '350'],
    ['epci-territories', '380'],
    ['heatmap', '360'],
    ['network-links', '400'],
    ['timeline-labels', '500'],
    ['mairie-markers', '580'],
    ['artisan-markers', '600'],
    ['school-markers', '620'],
  ];
  for (const [name, z] of panes) {
    if (!state.map.getPane(name)) {
      state.map.createPane(name);
      state.map.getPane(name).style.zIndex = z;
    }
  }

  state.map.on('zoomend', () => {
    applyMapVisualTier();
    syncSchoolLayerForZoom();
    updateZoomHint();
    syncTimelineVisibility(state.layers.timeline, state.map);
  });
  setTimeout(() => state.map.invalidateSize(), 200);
}

function fitMapBounds() {
  const b = state.data?.bounds;
  if (b && state.data.schools.length) {
    const bounds = [[b.south, b.west], [b.north, b.east]];
    state.initialBounds = bounds;
    state.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 9 });
  }
}

function schoolVisible(id) {
  return getFilteredSchoolIds(state).includes(id);
}

function rebuildSchoolCluster() {
  if (!state.data?.schools || !state.map) return;

  const oldDetail = state.layers.schoolsDetail;
  const oldOverview = state.layers.schoolsOverview;
  if (oldDetail) state.map.removeLayer(oldDetail);
  if (oldOverview) state.map.removeLayer(oldOverview);

  state.layers.schoolsDetail = createEpciPartitionedClusterLayer({
    schools: state.data.schools,
    markersById: state.markers.schools,
    visibleFn: schoolVisible,
  });

  state.layers.schoolsOverview = createEpciHubLayer({
    packages: state.data.packages,
    schools: state.data.schools,
    visibleFn: schoolVisible,
    onHubClick: (pkg) => {
      if (pkg.singleSchool) {
        openFocus('school', pkg.singleSchool);
        return;
      }
      openFocus('package', pkg.id);
    },
  });

  syncSchoolLayerForZoom();
  applyMapVisualTier();
  updateFilterStatsUI();
  updateZoomHint();
}

function setMapFilter(filterId) {
  state.mapFilter = filterId;
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === filterId);
  });
  rebuildSchoolCluster();
  updateFilterStatsUI();
  applyMapVisualTier();
  syncMapUrlParams();
}

function applyMapVisualTier(highlightIds = null) {
  if (!state.map) return;
  const tier = getMapZoomTier(state.map.getZoom());
  state.mapTier = tier;
  updateDepartmentBoundaryStyle(state, tier);

  const selectedPkg = state.selected?.type === 'package' ? state.selected.id : null;
  const visiblePerPkg = getVisibleSchoolIdsPerPackage(state);
  const stats = getMapFilterStats(state);
  const filterActive = stats.shown < stats.total;

  for (const ref of state.epciTerritoryRefs) {
    const visibleCount = visiblePerPkg.get(ref.id) ?? 0;
    const emptyTerritory = filterActive && visibleCount === 0;
    const dimmed = Boolean(
      (selectedPkg && ref.id !== selectedPkg)
      || emptyTerritory,
    );
    const selected = ref.id === selectedPkg;
    const style = epciTerritoryStyle(ref.pkg, tier, { selected, dimmed });
    if (emptyTerritory) {
      style.fillOpacity = 0.02;
      style.opacity = 0.2;
      style.weight = 1;
    }
    if (state.epciColorMode === 'capex' && !emptyTerritory) {
      style.fillOpacity = epciCapexFillOpacity(ref.pkg.capexTotal, state.maxPackageCapex);
    }
    for (const shape of ref.shapes) {
      shape.setStyle(style);
      if (shape.options) shape.options.interactive = !emptyTerritory;
    }
  }

  const ids = highlightIds ?? (state.selected?.type === 'school' ? [state.selected.id] : []);
  const compareHighlight = state.compareIds ?? [];
  refreshSchoolMarkerStyles([...new Set([...ids, ...compareHighlight])]);
  updateZoomHint();
}

function refreshSchoolMarkerStyles(highlightedIds = []) {
  const tier = state.mapTier;
  for (const [id, marker] of Object.entries(state.markers.schools)) {
    const s = state.data?.schools?.find((x) => x.id === id);
    if (!s) continue;
    marker.setIcon(createSchoolIcon(s, tier, { highlighted: highlightedIds.includes(id) }));
  }
}

function bindEpciEvents(shape, pkg) {
  const milestoneLabel = state.dashboardData?.config?.partFondsMilestoneLabel ?? '500 k€';
  shape.bindPopup(packagePopupHtml(pkg, { fmtEur, milestoneLabel }), POPUP_OPTS);
  shape.on('mouseover', () => shape.openPopup());
  shape.on('mouseout', () => shape.closePopup());
  shape.on('click', () => openFocus('package', pkg.id));
}

function addEpciLayer(pkg) {
  const tier = state.mapTier ?? 'territory';
  const style = epciTerritoryStyle(pkg, tier);
  const shapes = [];
  const polygons = pkg.polygons ?? (pkg.polygon?.length >= 3
    ? [[pkg.polygon.map((p) => [p.lat, p.lng])]]
    : null);

  const opts = { pane: 'epci-territories', smoothFactor: 1.5, interactive: true, ...style };

  if (!polygons?.length) {
    if (pkg.center && pkg.radiusM) {
      const circle = L.circle([pkg.center.lat, pkg.center.lng], { ...opts, radius: pkg.radiusM });
      bindEpciEvents(circle, pkg);
      circle.addTo(state.layers.packages);
      shapes.push(circle);
    }
  } else {
    for (const rings of polygons) {
      const shape = L.polygon(rings, opts);
      bindEpciEvents(shape, pkg);
      shape.addTo(state.layers.packages);
      shapes.push(shape);
    }
  }
  state.epciTerritoryRefs.push({ id: pkg.id, pkg, shapes });
}

function renderLayers(data, { fitBounds = true } = {}) {
  Object.values(state.layers).forEach((lg) => { try { state.map.removeLayer(lg); } catch { /* */ } });
  state.layers = {
    schoolsDetail: null,
    schoolsOverview: null,
    packages: L.layerGroup(),
    mairies: null,
    artisans: null,
    network: null,
    heatmap: null,
    timeline: null,
  };
  state.markers = { schools: {} };
  state.epciTerritoryRefs = [];
  state.maxPackageCapex = getMaxPackageCapex(data.packages);
  state.mapTier = getMapZoomTier(state.map.getZoom());

  for (const pkg of data.packages) addEpciLayer(pkg);

  for (const s of data.schools) {
    const marker = L.marker([s.lat, s.lon], {
      icon: createSchoolIcon(s, state.mapTier),
      pane: 'school-markers',
    });
    bindSchoolMarker(marker, s);
    state.markers.schools[s.id] = marker;
  }

  state.layers.schoolsDetail = createEpciPartitionedClusterLayer({
    schools: data.schools,
    markersById: state.markers.schools,
    visibleFn: schoolVisible,
  });

  state.layers.schoolsOverview = createEpciHubLayer({
    packages: data.packages,
    schools: data.schools,
    visibleFn: schoolVisible,
    onHubClick: (pkg) => {
      if (pkg.singleSchool) {
        openFocus('school', pkg.singleSchool);
        return;
      }
      openFocus('package', pkg.id);
    },
  });

  state.layers.mairies = buildMairieMarkers(data.mairies, {
    fmt,
    fmtEur,
    onClick: (m) => openFocus('mairie', m.id),
  });

  state.layers.artisans = buildArtisanMarkers(data.artisans, {
    fmtEur,
    onClick: (a) => {
      if (a.schoolIds?.length === 1) openFocus('school', a.schoolIds[0]);
      else showToast(`${a.nom} · ${a.schoolCount} école(s)`, 'info');
    },
  });

  state.layers.heatmap = buildClosingHeatLayer(data.schools, schoolVisible);
  state.layers.timeline = buildEpciTimelineLayer(data.packages, data.schools, schoolVisible);

  applyLayerVisibility();
  applyMapVisualTier();
  refreshNetworkLayer();
  updateFilterStatsUI();
  updateZoomHint();
  if (fitBounds) fitMapBounds();
}

function syncSchoolLayerForZoom() {
  if (!state.map) return;

  const detail = state.layers.schoolsDetail;
  const overview = state.layers.schoolsOverview;
  if (detail) state.map.removeLayer(detail);
  if (overview) state.map.removeLayer(overview);

  if (!state.layerVisibility.schools) return;

  const tier = getMapZoomTier(state.map.getZoom());
  const useOverview = tier === 'overview';

  if (useOverview && overview) {
    overview.addTo(state.map);
  } else if (detail) {
    detail.addTo(state.map);
  }
}

function applyLayerVisibility() {
  const layerMap = {
    schools: null,
    packages: 'packages',
    mairies: 'mairies',
    artisans: 'artisans',
    heatmap: 'heatmap',
    timeline: 'timeline',
  };

  for (const [key, layerKey] of Object.entries(layerMap)) {
    if (key === 'schools') {
      syncSchoolLayerForZoom();
      continue;
    }
    const lg = state.layers[layerKey];
    if (!lg) continue;
    if (state.layerVisibility[key]) lg.addTo(state.map);
    else state.map.removeLayer(lg);
  }

  applyDepartmentBoundaryVisibility(state);
  refreshNetworkLayer();
  if (state.layerVisibility.timeline) {
    syncTimelineVisibility(state.layers.timeline, state.map);
  }
}

function setLayerVisibility(key, visible) {
  state.layerVisibility[key] = visible;
  applyLayerVisibility();
  if (key === 'network' && visible && state.selected) refreshNetworkLayer();
}

// ── Focus panel ──

function openFocus(kind, id, { fly = true } = {}) {
  const ctx = resolveFocusContext(state, kind, id);
  if (!ctx) return;

  state.selected = { type: kind, id };
  state.focusContext = ctx;

  const detailLink = buildFocusDetailLink(ctx);
  let focusHtml = buildFocusPanelHtml(ctx, fmtEur).replace(
    '</footer>',
    detailLink ? `${detailLink}</footer>` : '</footer>',
  );
  if (kind === 'school') {
    focusHtml = focusHtml.replace(
      '</footer>',
      '<button type="button" id="focus-btn-compare" class="focus-btn focus-btn-ghost">+ Ajouter à la comparaison</button></footer>',
    );
  }
  $('focus-content').innerHTML = focusHtml;
  $('focus-title') && ($('focus-title').textContent = ctx.title);

  const backdrop = $('focus-backdrop');
  const panel = $('focus-panel');
  backdrop?.classList.remove('hidden');
  panel?.classList.remove('hidden');
  requestAnimationFrame(() => {
    backdrop?.classList.add('is-visible');
    panel?.classList.add('is-visible');
  });

  bindFocusActions(ctx);
  $('focus-btn-compare')?.addEventListener('click', () => addToCompare(id));
  $('focus-content')?.querySelectorAll('[data-nav-school]').forEach((el) => {
    el.addEventListener('click', (e) => { e.preventDefault(); closeFocus(); openSchoolDetail(el.dataset.navSchool); });
  });
  $('focus-content')?.querySelectorAll('[data-nav-commune]').forEach((el) => {
    el.addEventListener('click', (e) => { e.preventDefault(); closeFocus(); openCommuneDetail(el.dataset.navCommune); });
  });
  applyMapVisualTier(kind === 'school' ? [id] : []);
  refreshNetworkLayer();
  syncMapUrlParams();
  onAssistantSelectionChange(state, fmtEur);

  if (fly && kind === 'school') {
    const s = state.data?.schools?.find((x) => x.id === id);
    if (s?.lat != null) state.map.flyTo([s.lat, s.lon], 13, { duration: 0.5 });
  } else if (fly && kind === 'package') {
    const pkg = state.data?.packages?.find((p) => p.id === id);
    fitPackageBounds(state.map, pkg, state.data?.schools);
  } else if (fly && kind === 'mairie') {
    const m = state.data?.mairies?.find((x) => x.id === id);
    if (m?.lat != null) state.map.flyTo([m.lat, m.lon], 12, { duration: 0.5 });
  }
}

function closeFocus() {
  const backdrop = $('focus-backdrop');
  const panel = $('focus-panel');
  backdrop?.classList.remove('is-visible');
  panel?.classList.remove('is-visible');
  setTimeout(() => {
    backdrop?.classList.add('hidden');
    panel?.classList.add('hidden');
    $('focus-content').innerHTML = '';
  }, 350);
  state.selected = null;
  state.focusContext = null;
  applyMapVisualTier([]);
  refreshNetworkLayer();
  syncMapUrlParams();
  onAssistantSelectionChange(state, fmtEur);
}

function bindFocusActions(ctx) {
  $('focus-btn-lemlist')?.addEventListener('click', async (e) => {
    const pitch = buildLemlistPitch(ctx);
    await copyText(pitch.full, e.currentTarget);
  });
  $('focus-btn-pdf')?.addEventListener('click', () => {
    const insee = ctx.codeInsee;
    if (insee) {
      downloadMgpePdPdf(insee, { apiHeaders, showToast });
    } else {
      showToast('Dossier mairie indisponible', 'error');
    }
  });
}

// ── Pipeline ──

function setPipelineRunning(running) {
  state.pipelineRunning = running;
  document.querySelectorAll('.menu-action[data-action="resume"], .menu-action[data-action="full"]').forEach((btn) => {
    btn.disabled = running;
  });
  $('pipeline-console-badge')?.classList.toggle('hidden', !running);
  if (!running) $('pipeline-progress')?.classList.add('hidden');
}

function updatePipelineProgress(progress) {
  const bar = $('pipeline-progress-bar');
  const label = $('pipeline-progress-label');
  $('pipeline-progress')?.classList.remove('hidden');
  const total = progress.totalSchools ?? 0;
  const processed = progress.processed ?? 0;
  const pct = progress.progressPct ?? (total > 0 ? Math.round((processed / total) * 100) : 0);
  if (bar) bar.style.width = `${pct}%`;
  if (label) label.textContent = total > 0 ? `${processed}/${total} · ${progress.exported ?? 0} exportées` : 'Chassage…';
}

function appendConsoleLog(log) {
  const body = $('pipeline-console-body');
  if (!body) return;
  const line = document.createElement('div');
  line.className = `log-line log-${log.level ?? 'info'}`;
  line.textContent = `[${new Date(log.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}] ${log.message}`;
  body.appendChild(line);
  body.scrollTop = body.scrollHeight;
}

function connectLogStream() {
  state.logEventSource?.close();
  const es = new EventSource('/api/stream-logs');
  state.logEventSource = es;
  es.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'log') appendConsoleLog(payload);
      if (payload.type === 'progress') updatePipelineProgress(payload);
      if (payload.type === 'status') {
        const was = state.pipelineRunning;
        setPipelineRunning(payload.running);
        if (was && !payload.running) {
          loadBootstrap(true).then(() => showToast('Chassage terminé', 'success'));
        }
      }
    } catch { /* ignore */ }
  };
  es.onerror = () => { es.close(); state.logEventSource = null; setTimeout(connectLogStream, 30_000); };
}

async function checkPipelineStatus() {
  try {
    const res = await fetch('/api/pipeline/status');
    const data = await parseJsonResponse(res);
    setPipelineRunning(Boolean(data.running));
    if (data.pipeline?.totalSchools) updatePipelineProgress(data.pipeline);
    if (data.running) connectLogStream();
  } catch { /* ignore */ }
}

async function startPipelineRun(mode = 'resume') {
  if (state.pipelineRunning) return;
  if (mode === 'full' && !window.confirm('Relancer complètement ? Cache et checkpoint effacés.')) return;
  if (!(await ensureApiToken(state.dashboardData?.config?.runAuthRequired))) {
    showToast('Token API requis', 'error');
    return;
  }
  try {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: apiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ mode }),
    });
    const data = await parseJsonResponse(res);
    if (res.status === 401) { sessionStorage.removeItem(API_TOKEN_KEY); showToast('Token invalide', 'error'); return; }
    if (!res.ok) { showToast(data.error || 'Erreur', 'error'); return; }
    $('pipeline-console-body').innerHTML = '';
    $('pipeline-console')?.classList.remove('collapsed');
    setPipelineRunning(true);
    connectLogStream();
    showToast(mode === 'full' ? 'Chassage complet démarré' : 'Reprise du chassage', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function exportCsv() {
  if (!(await ensureApiToken(state.dashboardData?.config?.runAuthRequired))) {
    showToast('Token API requis', 'error');
    return;
  }
  try {
    const res = await fetch('/api/export', { headers: apiHeaders() });
    if (res.status === 401) { sessionStorage.removeItem(API_TOKEN_KEY); showToast('Token invalide', 'error'); return; }
    if (!res.ok) throw new Error('Export impossible');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output_prospection.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV téléchargé', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Events ──

function setupEvents() {
  $('search-input')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    state.searchActiveIndex = 0;
    scheduleMapRefresh();
    updateSearchDropdown();
  });

  $('search-input')?.addEventListener('focus', () => {
    if (String(state.searchQuery ?? '').trim().length >= 2) updateSearchDropdown();
  });

  $('search-input')?.addEventListener('keydown', (e) => {
    const items = state.searchSuggestions;
    if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault();
      state.searchActiveIndex = Math.min(state.searchActiveIndex + 1, items.length - 1);
      updateSearchDropdown();
      return;
    }
    if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault();
      state.searchActiveIndex = Math.max(state.searchActiveIndex - 1, 0);
      updateSearchDropdown();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (items.length && !$('search-dropdown')?.classList.contains('hidden')) {
        activateSearchHit(items[state.searchActiveIndex]);
        return;
      }
      if (getFilteredSchoolIds(state).length >= 1) {
        flyToFirstSearchMatch();
      }
      hideSearchDropdown();
    }
    if (e.key === 'Escape') hideSearchDropdown();
  });

  $('search-dropdown')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.zen-search-hit');
    if (!btn) return;
    activateSearchHit({
      kind: btn.dataset.hitKind,
      id: btn.dataset.hitId,
      lat: btn.dataset.hitLat,
      lon: btn.dataset.hitLon,
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.zen-search-wrap')) hideSearchDropdown();
  });

  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => setMapFilter(btn.dataset.filter));
  });

  $('btn-layers')?.addEventListener('click', (e) => {
    e.stopPropagation();
    $('layers-panel')?.classList.toggle('hidden');
  });

  document.querySelectorAll('[data-layer]').forEach((input) => {
    input.checked = Boolean(state.layerVisibility[input.dataset.layer]);
    input.addEventListener('change', () => {
      setLayerVisibility(input.dataset.layer, input.checked);
    });
  });

  document.querySelectorAll('[name="epci-color"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) {
        state.epciColorMode = input.value;
        applyMapVisualTier();
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#layers-panel') && !e.target.closest('#btn-layers')) {
      $('layers-panel')?.classList.add('hidden');
    }
  });

  $('seg-map')?.addEventListener('click', () => setViewMode('map'));
  $('seg-portfolios')?.addEventListener('click', () => setViewMode('portfolios'));

  $('portfolio-grid')?.addEventListener('click', (e) => {
    const card = e.target.closest('.pf-card');
    if (!card) return;
    if (card.dataset.focusKind === 'school') {
      openSchoolDetail(card.dataset.focusId);
    } else {
      openFocus(card.dataset.focusKind, card.dataset.focusId, { fly: false });
    }
  });

  $('focus-close')?.addEventListener('click', closeFocus);
  $('focus-backdrop')?.addEventListener('click', closeFocus);

  $('btn-menu')?.addEventListener('click', (e) => {
    e.stopPropagation();
    $('menu-dropdown')?.classList.toggle('hidden');
  });
  document.addEventListener('click', () => $('menu-dropdown')?.classList.add('hidden'));

  document.querySelectorAll('.menu-action').forEach((btn) => {
    btn.addEventListener('click', () => {
      $('menu-dropdown')?.classList.add('hidden');
      const a = btn.dataset.action;
      if (a === 'resume') startPipelineRun('resume');
      else if (a === 'full') startPipelineRun('full');
      else if (a === 'export') exportCsv();
      else if (a === 'refresh') loadBootstrap();
    });
  });

  $('pipeline-console-toggle')?.addEventListener('click', () => {
    $('pipeline-console')?.classList.toggle('collapsed');
    $('pipeline-console-chevron').textContent = $('pipeline-console')?.classList.contains('collapsed') ? '▶' : '▼';
  });

  $('btn-assistant')?.addEventListener('click', () => {
    renderAssistantHome(state, fmtEur);
    $('btn-open-assistant')?.click();
  });

  $('compare-mode-toggle')?.addEventListener('change', (e) => {
    state.compareMode = e.target.checked;
    showToast(state.compareMode ? 'Mode comparaison · Shift+clic' : 'Mode comparaison désactivé', 'info');
  });

  $('fab-filters')?.addEventListener('click', () => {
    document.querySelector('.zen-tags')?.classList.toggle('is-mobile-open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea' && !e.target?.isContentEditable) {
        e.preventDefault();
        $('search-input')?.focus();
      }
    }
    if (e.key === 'Escape') {
      if (state.detailPage) closeDetailPage();
      else if (!$('command-palette')?.classList.contains('hidden')) { /* assistant handles */ }
      else if (!$('focus-panel')?.classList.contains('hidden')) closeFocus();
      else {
        $('menu-dropdown')?.classList.add('hidden');
        $('layers-panel')?.classList.add('hidden');
        hideSearchDropdown();
        document.querySelector('.zen-tags')?.classList.remove('is-mobile-open');
      }
    }
  });

  window.addEventListener('popstate', () => handleRoute());

  window.addEventListener('resize', () => state.map?.invalidateSize());
}

// ── Init ──

function initAssistantIntegration() {
  initAssistant({
    getState: () => state,
    fmtEur,
    selectEntity: (type, id) => {
      if (type === 'artisan') {
        const a = state.data?.artisans?.find((x) => x.id === id);
        setLayerVisibility('artisans', true);
        if (a?.schoolIds?.length === 1) openFocus('school', a.schoolIds[0]);
        else showToast(`${a?.nom ?? 'Artisan'} · ${a?.schoolCount ?? 0} école(s)`, 'info');
        return;
      }
      openFocus(type, id);
    },
    setMapFilter,
    loadBootstrap,
    startPipelineRun,
    exportCsv,
    fitMapBounds,
    showToast,
    downloadMgpePdf: (insee) => downloadMgpePdPdf(insee, { apiHeaders, showToast }),
    switchSidePanel: (panel) => {
      if (panel === 'tableau' || panel === 'portfolios') setViewMode('portfolios');
      else setViewMode('map');
    },
    openLemlistForCommune: (communeQuery) => {
      const q = String(communeQuery ?? '').trim().toLowerCase();
      const row = state.dashboardData?.schools?.find((r) =>
        String(r.Commune ?? '').toLowerCase().includes(q)
        || String(r.Code_INSEE) === q,
      );
      if (row?.Code_INSEE) openFocus('mairie', row.Code_INSEE);
      else showToast('Commune introuvable', 'error');
    },
  });
}

initMap();
setupEvents();
initAssistantIntegration();
setViewMode('map');
checkPipelineStatus();
loadBootstrap();

export {
  state, loadBootstrap, openFocus, closeFocus, setMapFilter, setViewMode,
  openCommuneDetail, openSchoolDetail, closeDetailPage,
};
