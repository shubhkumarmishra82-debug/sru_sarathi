/* =========================================================================
   REAL CAMPUS MAP (Leaflet + CartoDB tiles)
   Every building from SRU_DATA plotted at its approximate real-world
   coordinates on an actual map, plus a "you are here" marker when
   location is available. Coordinates are illustrative estimates derived
   from the campus layout, not a surveyed plan — good for orientation;
   each pin's popup links out to Google Maps for the exact walking route.

   Tiles come from CartoDB's free basemaps rather than the raw
   tile.openstreetmap.org servers — OSM's own tile servers apply usage-
   policy throttling to sites that get repeat/heavy traffic, which shows
   up as "loads sometimes, stalls other times". CartoDB is built for
   exactly this kind of embedding and doesn't need an API key either.
   A short load timeout + Retry button covers the rare case tiles still
   stall, instead of leaving a silent spinner forever.
   ========================================================================= */

(function () {
  const mapEl = document.getElementById('campusMap');
  const btnMapLocate = document.getElementById('btnMapLocate');
  const errEl = document.getElementById('mapLoadError');
  const btnRetry = document.getElementById('btnMapRetry');
  if (!mapEl || typeof L === 'undefined' || !SRU_DATA || !SRU_DATA.buildings) return;

  const buildings = SRU_DATA.buildings.filter(b => b.coords);
  const cafeteria = buildings.find(b => b.id === 'cafeteria');
  const center = [cafeteria ? cafeteria.coords.lat : 17.9797, cafeteria ? cafeteria.coords.lng : 79.5800];

  const map = L.map(mapEl, { zoomControl: true, attributionControl: true }).setView(center, 17);

  let tileLayer = null;
  let loadTimer = null;
  let firstTileArrived = false;

  function showError() {
    if (errEl) errEl.hidden = false;
  }
  function hideError() {
    if (errEl) errEl.hidden = true;
  }

  function addTiles() {
    hideError();
    firstTileArrived = false;
    if (tileLayer) { map.removeLayer(tileLayer); tileLayer = null; }

    tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>'
    }).addTo(map);

    tileLayer.on('load', () => { firstTileArrived = true; hideError(); clearTimeout(loadTimer); });
    tileLayer.on('tileerror', () => { if (!firstTileArrived) showError(); });

    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => { if (!firstTileArrived) showError(); }, 8000);
  }
  addTiles();
  if (btnRetry) btnRetry.addEventListener('click', addTiles);

  function pinIcon(color) {
    return L.divIcon({
      className: '',
      html: `<div class="map-pin" style="background:${color};"><span>●</span></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -24]
    });
  }

  const markers = {};
  const bounds = [];
  buildings.forEach(b => {
    const marker = L.marker([b.coords.lat, b.coords.lng], { icon: pinIcon(b.color) }).addTo(map);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${b.coords.lat},${b.coords.lng}&travelmode=walking`;
    marker.bindPopup(`
      <div class="map-popup">
        <span class="tour-zone">${b.zone}</span>
        <h4>${b.name}</h4>
        <p style="margin:0 0 8px;">${b.blurb}</p>
        <a href="${mapsUrl}" target="_blank" rel="noopener">Get walking directions ↗</a>
      </div>`);
    marker.on('click', () => { if (window.SRU_selectBuilding) window.SRU_selectBuilding(b.id); });
    markers[b.id] = marker;
    bounds.push([b.coords.lat, b.coords.lng]);
  });
  if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });

  // ---------- "you are here" ----------
  let youMarker = null, watchId = null;
  function showMe(recenter) {
    if (!('geolocation' in navigator)) return;
    if (btnMapLocate) btnMapLocate.disabled = true;
    navigator.geolocation.getCurrentPosition(pos => {
      if (btnMapLocate) btnMapLocate.disabled = false;
      placeYou(pos, recenter);
      if (watchId === null) {
        watchId = navigator.geolocation.watchPosition(p => placeYou(p, false), () => {}, { enableHighAccuracy: true, maximumAge: 5000 });
      }
    }, () => { if (btnMapLocate) btnMapLocate.disabled = false; }, { enableHighAccuracy: true, timeout: 10000 });
  }
  function placeYou(pos, recenter) {
    const ll = [pos.coords.latitude, pos.coords.longitude];
    if (!youMarker) {
      youMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="map-pin-you"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }) })
        .addTo(map).bindPopup('You are here');
    } else {
      youMarker.setLatLng(ll);
    }
    if (recenter) map.setView(ll, 18);
  }
  if (btnMapLocate) btnMapLocate.addEventListener('click', () => showMe(true));

  // expose so the building list / Live Navigate can drop a pin + open its popup
  window.SRU_setMapPlace = function (id) {
    const m = markers[id];
    if (!m) return;
    map.setView(m.getLatLng(), 18);
    m.openPopup();
  };
  window.SRU_focusOnMap = window.SRU_setMapPlace;
})();
