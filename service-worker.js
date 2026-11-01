const CACHE = 'minicity-web-4.7.81-ponts3d';
const LOCAL = ['./', './index.html', './web_minicity.apk', './web_minicity.tar.gz', './favicon.png', './manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(LOCAL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const path = url.pathname;
  // Liste et fichiers des villes en ligne : toujours le reseau (jamais une copie ancienne).
  if (url.hostname === 'api.github.com' || path.includes('/villes/')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  if (path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('/web_minicity.apk') || path.endsWith('/web_minicity.tar.gz')) {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (event.request.method === 'GET' && (response.ok || response.type === 'opaque')) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
