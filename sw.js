/* PilaLog · service worker
 * - Deja la app instalada y funcionando sin señal (archivos en caché).
 * - Archivos propios: primero la red (siempre la versión nueva) y, si no hay
 *   señal o tarda más de 4 segundos, la copia guardada.
 * - Código de Firebase (gstatic): caché primero, porque cada versión es fija.
 * - Los datos de la lista NO pasan por acá: los guarda el propio Firestore.
 *
 * Al publicar una versión nueva de la app, subí el número de VERSION.
 */
const VERSION = 'pilalog-v5';
const CACHE_FB = 'pilalog-firebase-v1';
const APP_SHELL = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'backend.js',
  'firebase-config.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/favicon-64.png',
  'fonts/alfa-slab-one-latin-400-normal.woff2',
  'fonts/atkinson-hyperlegible-latin-400-normal.woff2',
  'fonts/atkinson-hyperlegible-latin-700-normal.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION && k !== CACHE_FB).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function redConTiempo(req, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(req).then(
      (r) => { clearTimeout(t); resolve(r); },
      (err) => { clearTimeout(t); reject(err); }
    );
  });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Código de Firebase desde el CDN de Google: caché primero.
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    e.respondWith(
      caches.open(CACHE_FB).then((cache) =>
        cache.match(req).then((hit) => hit || fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  // Archivos propios: red primero, caché de respaldo.
  if (url.origin === self.location.origin) {
    e.respondWith(
      redConTiempo(req, 4000)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const copia = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copia));
          }
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((hit) =>
            hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())
          )
        )
    );
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      const abierta = lista.find((c) => 'focus' in c);
      return abierta ? abierta.focus() : self.clients.openWindow('./');
    })
  );
});
