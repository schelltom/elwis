/* LOTSE112 Service Worker – macht die App nach dem ersten Besuch offline nutzbar.
   Strategie: Precache der App-Dateien, danach stale-while-revalidate
   (aus dem Cache antworten, im Hintergrund aktualisieren). */
const VERSION = "elwis-v207";
const ASSETS = [
  "./",
  "./app.css",
  "./app.js",
  "./icon.svg",
  "./manifest.webmanifest",
  // (demo-einsatz.json bewusst NICHT im Precache – nur „Beispieldaten laden" holt es)
  // In index.html synchron eingebundene Vendor-Dateien – müssen offline da sein,
  // sonst startet die App-Shell nicht. Schwergewichte (tesseract, pdfjs) werden
  // dagegen erst bei Nutzung geladen und dann per stale-while-revalidate gecacht.
  "./vendor/leaflet.css",
  "./vendor/leaflet.js",
  "./vendor/qrcode.js",
];
// Schwergewichte (OCR, PDF-Import): ebenfalls vorab laden, damit sie im Einsatz ohne
// Netz da sind. Getrennt vom App-Shell-Precache, damit ein Abbruch bei schwachem Netz
// die Installation nicht verhindert – fehlende Dateien werden dann bei Nutzung nachgeholt.
// Nur die SIMD-Variante von Tesseract (alle aktuellen Geräte); die Nicht-SIMD-Variante
// wird bei Bedarf per stale-while-revalidate gecacht.
const ASSETS_SCHWER = [
  "./vendor/tesseract/tesseract.min.js",
  "./vendor/tesseract/worker.min.js",
  "./vendor/tesseract/deu.traineddata.gz",
  "./vendor/tesseract/tesseract-core-simd-lstm.wasm.js",
  "./vendor/tesseract/tesseract-core-simd-lstm.wasm",
  "./vendor/pdfjs/pdf.min.js",
  "./vendor/pdfjs/pdf.worker.min.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(ASSETS).then(() =>
        Promise.all(ASSETS_SCHWER.map((u) => c.add(u).catch(() => {})))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
