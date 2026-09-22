const CACHE_NAME = 'tres-valles-app-v5';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch((err) => {
          console.warn('No se pudo guardar para uso sin conexion:', url, err);
        }))
      );
    })
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

// La app siempre intenta traer la version mas nueva de internet primero.
// Solo si no hay conexion, usa la copia guardada como respaldo.
// Las llamadas a Supabase (datos) NO pasan por aqui, siguen yendo directo a la red;
// esas ya se manejan con el respaldo local (localStorage) dentro de la app.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if(url.includes('supabase.co')) return; // nunca cachear llamadas a la base de datos

  event.respondWith(
    fetch(event.request).then((response) => {
      if(response && response.ok){
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
