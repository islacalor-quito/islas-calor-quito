const QUITO_CENTER = [-0.19, -78.48];

const map = L.map('map', { zoomControl: false }).setView(QUITO_CENTER, 11);
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO',
  maxZoom: 19
}).addTo(map);

const manchaUrbanaLayer = L.geoJSON(null, {
  style: {
    color: '#1c2f5e',
    weight: 1.5,
    fillColor: '#4a90c4',
    fillOpacity: 0.12
  }
}).addTo(map);

fetch('data/mancha_urbana.geojson')
  .then((r) => r.json())
  .then((geojson) => manchaUrbanaLayer.addData(geojson))
  .catch((err) => console.error('No se pudo cargar mancha_urbana.geojson', err));

const parquesLayer = L.geoJSON(null, {
  style: {
    color: '#2e7d32',
    weight: 1,
    fillColor: '#66bb6a',
    fillOpacity: 0.5
  },
  onEachFeature: (feature, layer) => {
    const p = feature.properties || {};
    layer.bindPopup(`<div class="estacion-popup"><b>${p.PRK || 'Parque'}</b><br>${p['Categoría'] || ''}</div>`);
  }
}).addTo(map);

fetch('data/parques.geojson')
  .then((r) => r.json())
  .then((geojson) => parquesLayer.addData(geojson))
  .catch((err) => console.error('No se pudo cargar parques.geojson', err));

// Bounds exactos de la exportación LST en GEE (aoi.bounds().coordinates()),
// deben coincidir con la región usada en getThumbURL o la imagen queda mal alineada.
const LST_BOUNDS = [
  [-0.39345769352669147, -78.76944485706954],
  [0.18054008948711725, -78.28890987699648]
];
const lstLayer = L.imageOverlay('data/lst_dmq.png', LST_BOUNDS, { opacity: 0.85 }).addTo(map);

function colorPorTemperatura(tempC) {
  if (tempC === null || tempC === undefined) return '#9e9e9e';
  if (tempC < 16) return '#4a90c4';
  if (tempC < 19) return '#6aa84f';
  if (tempC < 22) return '#e8b923';
  return '#d32f2f';
}

// Cloudflare Worker desplegado (proxy-estaciones/worker.js) que consulta
// aireambiente.quito.gob.ec del lado del servidor y evita el bloqueo CORS.
const ESTACIONES_ENDPOINT = 'https://solitary-sea-066d.velascojorge93.workers.dev/';
const ACTUALIZAR_CADA_MS = 5 * 60 * 1000;

const estacionesLayer = L.layerGroup().addTo(map);

function pintarEstaciones(datos) {
  estacionesLayer.clearLayers();
  datos.forEach((e) => {
    const label = e.temperaturaC !== null && e.temperaturaC !== undefined
      ? `${e.temperaturaC.toFixed(1)} °C`
      : 'Sin datos';
    const hora = e.medidoEn ? new Date(e.medidoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '';
    L.circleMarker([e.lat, e.lon], {
      radius: 8,
      color: '#fff',
      weight: 2,
      fillColor: colorPorTemperatura(e.temperaturaC),
      fillOpacity: 0.9
    }).bindPopup(`<div class="estacion-popup"><b>${e.estacion}</b><br>${label}${hora ? ` &middot; ${hora}` : ''}</div>`)
      .addTo(estacionesLayer);
  });
}

function marcarEstadoActualizacion(texto) {
  const el = document.getElementById('estaciones-status');
  if (el) el.textContent = texto;
}

function cargarEstacionesEnVivo() {
  fetch(ESTACIONES_ENDPOINT)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((datos) => {
      pintarEstaciones(datos);
      marcarEstadoActualizacion(`Actualizado ${new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`);
    })
    .catch((err) => {
      console.error('No se pudo obtener estaciones en vivo, usando último dato disponible', err);
      if (typeof ESTACIONES_DATA !== 'undefined' && estacionesLayer.getLayers().length === 0) {
        pintarEstaciones(ESTACIONES_DATA);
      }
      marcarEstadoActualizacion('Sin conexión al proxy de estaciones');
    });
}

cargarEstacionesEnVivo();
setInterval(cargarEstacionesEnVivo, ACTUALIZAR_CADA_MS);

document.getElementById('legend-temp').innerHTML = [
  ['< 16 °C', '#4a90c4'],
  ['16 – 19 °C', '#6aa84f'],
  ['19 – 22 °C', '#e8b923'],
  ['> 22 °C', '#d32f2f'],
  ['Sin datos', '#9e9e9e']
].map(([label, color]) =>
  `<div class="legend__item"><span class="legend__swatch" style="background:${color}"></span>${label}</div>`
).join('');

// Los rangos son solo para que la leyenda se lea fácil; el mapa en sí usa
// el estiramiento continuo por percentil 2-98 (25.4-39.6°C), sin tocarlo.
document.getElementById('legend-lst').innerHTML = [
  ['< 25 °C', '#0000ff'],
  ['25 – 29 °C', '#00ffff'],
  ['29 – 32 °C', '#ffff00'],
  ['32 – 36 °C', '#ff7f00'],
  ['> 36 °C', '#ff0000']
].map(([label, color]) =>
  `<div class="legend__item"><span class="legend__swatch" style="background:${color}"></span>${label}</div>`
).join('');

document.getElementById('toggle-lst').addEventListener('change', (e) => {
  if (e.target.checked) map.addLayer(lstLayer);
  else map.removeLayer(lstLayer);
});

document.getElementById('toggle-mancha').addEventListener('change', (e) => {
  if (e.target.checked) map.addLayer(manchaUrbanaLayer);
  else map.removeLayer(manchaUrbanaLayer);
});

document.getElementById('toggle-parques').addEventListener('change', (e) => {
  if (e.target.checked) map.addLayer(parquesLayer);
  else map.removeLayer(parquesLayer);
});

document.getElementById('toggle-estaciones').addEventListener('change', (e) => {
  if (e.target.checked) map.addLayer(estacionesLayer);
  else map.removeLayer(estacionesLayer);
});
