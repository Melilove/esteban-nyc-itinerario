// Itinerario NYC — Esteban — Service Worker
// Sube este numero cada vez que modifiques la app (index.html, manifest, iconos, etc.)
// para que el navegador detecte la nueva version y el banner de "Actualizacion disponible" aparezca.
const SW_VERSION = 'v1.0.0';
const CACHE_NAME = 'esteban-nyc-' + SW_VERSION;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// --- INSTALACION: guarda los archivos base en cache ---
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// --- ACTIVACION: borra caches de versiones anteriores ---
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key.startsWith('esteban-nyc-') && key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// --- MENSAJE: permite que el boton "Actualizar ahora" active la nueva version ---
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- FETCH: red primero para el HTML (detecta cambios rapido), cache primero para el resto ---
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var isNavigation = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (isNavigation) {
    event.respondWith(
      fetch(req).then(function (res) {
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, resClone); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, resClone); });
        return res;
      }).catch(function () { /* sin red y sin cache */ });
    })
  );
});
