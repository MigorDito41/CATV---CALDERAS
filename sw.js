const CACHE_NAME = 'tres-valles-app-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    ))
  );
  self.clients.claim();
});

// La app en si (HTML/CSS/JS/fuentes) se sirve desde cache primero, para que abra sin internet.
// Las llamadas a Supabase (datos) NO pasan por aqui, siguen yendo directo a la red;
// esas ya se manejan con el respaldo local (localStorage) dentro de la app.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if(url.includes('supabase.co')) return; // nunca cachear llamadas a la base de datos

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if(cached) return cached;
      return fetch(event.request).then((response) => {
        if(response && response.ok){
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
