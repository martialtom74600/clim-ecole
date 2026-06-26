/** Contours départementaux — couche persistante (non recréée à chaque refresh bootstrap) */

import { departmentBoundaryStyle } from './mapStyle.js';

let cachedKey = '';
let cachedGeoJson = null;
let fetchPromise = null;

function deptKey(departments) {
  return (departments ?? []).map((d) => String(d)).sort().join(',');
}

function ensureBoundaryPane(map) {
  if (!map.getPane('dept-boundaries')) {
    map.createPane('dept-boundaries');
    map.getPane('dept-boundaries').style.zIndex = '350';
  }
}

async function loadGeoJson(departments) {
  const key = deptKey(departments);
  if (cachedGeoJson && cachedKey === key) {
    return cachedGeoJson;
  }

  if (!fetchPromise || cachedKey !== key) {
    cachedKey = key;
    fetchPromise = fetch('/api/departements-geojson')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Contours départements indisponibles');
        }
        return data;
      })
      .finally(() => {
        fetchPromise = null;
      });
  }

  cachedGeoJson = await fetchPromise;
  return cachedGeoJson;
}

export function applyDepartmentBoundaryVisibility(state) {
  const layer = state.boundaryLayer;
  if (!layer || !state.map) {
    return;
  }
  if (state.layerVisibility.departments) {
    layer.addTo(state.map);
  } else {
    state.map.removeLayer(layer);
  }
}

export function updateDepartmentBoundaryStyle(state, tier = 'territory') {
  const style = departmentBoundaryStyle(tier);
  state.boundaryLayer?.eachLayer((layer) => layer.setStyle(style));
}

/**
 * Charge ou réaffiche les frontières selon config.departments.
 * Idempotent : ne refetch pas si la liste de départements est inchangée.
 */
export async function syncDepartmentBoundaries(state) {
  const departments = state.dashboardData?.config?.departments;
  if (!state.map || !departments?.length) {
    return;
  }

  const key = deptKey(departments);
  if (state.boundaryLayer && state.boundaryDeptKey === key) {
    applyDepartmentBoundaryVisibility(state);
    return;
  }

  try {
    const geojson = await loadGeoJson(departments);
    ensureBoundaryPane(state.map);

    if (state.boundaryLayer) {
      state.map.removeLayer(state.boundaryLayer);
    }

    state.boundaryLayer = L.geoJSON(geojson, {
      pane: 'dept-boundaries',
      interactive: false,
      style: departmentBoundaryStyle('territory'),
    });
    state.boundaryDeptKey = key;
    applyDepartmentBoundaryVisibility(state);
  } catch {
    /* silencieux — la carte reste utilisable sans contours */
  }
}
