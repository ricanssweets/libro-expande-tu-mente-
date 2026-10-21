/* Service Worker — Expande Tu Mente
 * v2: la app es autocontenida (no hay CDN), así que el precache local basta para
 * funcionar sin conexión. Estrategias:
 *   - navegación (HTML): red primero, caché como respaldo -> las actualizaciones llegan.
 *   - resto de activos: caché primero + revalidación en segundo plano.
 * Al cambiar archivos o el bundle, subir VERSION para que los lectores reciban la nueva.
 */
const VERSION = 'v3.0.0';
const CACHE = 'expande-mente-' + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './contenido.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // addAll() falla entero si un solo recurso falla: se cachea uno a uno.
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (err) {
        console.warn('[sw] no se pudo precachear', url, err);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

function isNavigation(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' && (request.headers.get('accept') || '').includes('text/html'));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; // los terceros no se interceptan

  if (isNavigation(request)) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (err) {
        const cached = (await caches.match(request)) || (await caches.match('./index.html'));
        if (cached) return cached;
        return new Response(
          '<!doctype html><meta charset="utf-8"><h1>Sin conexión</h1><p>Vuelve a intentarlo cuando recuperes la red.</p>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const network = fetch(request).then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        caches.open(CACHE).then((cache) => cache.put(request, response.clone())).catch(() => {});
      }
      return response;
    }).catch(() => null);

    if (cached) {
      network.catch(() => {});
      return cached;
    }
    const fresh = await network;
    return fresh || (await caches.match('./index.html')) || Response.error();
  })());
});
