// Datos de ejemplo (snapshot real del 2026-07-24) para desarrollo local.
// En producción, reemplazar esta constante por un fetch al proxy de Cloudflare
// Workers (ver GEOVISOR/proxy-estaciones/worker.js) que consulta en vivo
// aireambiente.quito.gob.ec — ese sitio no envía cabeceras CORS, así que el
// navegador no puede llamarlo directamente.
const ESTACIONES_DATA = [
  { estacion: "Belisario", lat: -0.184719, lon: -78.495986, temperaturaC: 17.35 },
  { estacion: "Carapungo", lat: -0.095472, lon: -78.449809, temperaturaC: 18.47 },
  { estacion: "Centro", lat: -0.221393, lon: -78.514005, temperaturaC: 18.11 },
  { estacion: "Cotocollao", lat: -0.107777, lon: -78.497222, temperaturaC: 16.92 },
  { estacion: "El Camal", lat: -0.25, lon: -78.51, temperaturaC: null },
  { estacion: "Guamani", lat: -0.333949, lon: -78.553416, temperaturaC: null },
  { estacion: "LosChillos", lat: -0.297062, lon: -78.455248, temperaturaC: 20.63 },
  { estacion: "SanAntonio", lat: -0.009222, lon: -78.448001, temperaturaC: 18.76 },
  { estacion: "Tumbaco", lat: -0.214933, lon: -78.403253, temperaturaC: 21.93 }
];
