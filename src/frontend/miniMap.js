/** Mini-carte contextuelle école — init lazy, zéro impact bootstrap */

const Leaflet = typeof L !== 'undefined' ? L : window.L;

let miniMapInstance = null;

function tealDotIcon() {
  return Leaflet.divIcon({
    className: '',
    html: '<div class="marker-zen marker-zen-hl" style="--sz:10px"></div>',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

export function initSchoolMiniMap(lat, lon, containerId = 'school-mini-map') {
  destroySchoolMiniMap();
  const el = document.getElementById(containerId);
  if (!el || lat == null || lon == null || !Leaflet) return;

  miniMapInstance = Leaflet.map(el, {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
  });

  Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(miniMapInstance);

  Leaflet.marker([lat, lon], { icon: tealDotIcon() }).addTo(miniMapInstance);
  miniMapInstance.setView([lat, lon], 16, { animate: false });

  requestAnimationFrame(() => miniMapInstance?.invalidateSize());
}

export function destroySchoolMiniMap() {
  if (miniMapInstance) {
    miniMapInstance.remove();
    miniMapInstance = null;
  }
}
