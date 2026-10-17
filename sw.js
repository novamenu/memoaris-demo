// Memoaris service worker: laat de app offline werken.
// Verhoog het versienummer als je bestanden toevoegt of hernoemt.
const CACHE = 'memoaris-v2';

const BASIS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './logo-licht.png',
  './logo-donker.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // Eén ontbrekend bestand mag de installatie niet blokkeren.
      .then(cache => Promise.allSettled(BASIS.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(namen => Promise.all(namen.filter(naam => naam !== CACHE).map(naam => caches.delete(naam))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const verzoek = event.request;
  if (verzoek.method !== 'GET' || new URL(verzoek.url).origin !== location.origin) return;

  // De app zelf: eerst online proberen (zodat updates meteen binnenkomen), anders de opgeslagen versie.
  if (verzoek.mode === 'navigate') {
    event.respondWith(
      fetch(verzoek)
        .then(antwoord => {
          const kopie = antwoord.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', kopie));
          return antwoord;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Overige bestanden (iconen, logo): eerst uit de opslag, anders online ophalen en bewaren.
  event.respondWith(
    caches.match(verzoek).then(opgeslagen => opgeslagen || fetch(verzoek).then(antwoord => {
      if (antwoord.ok) {
        const kopie = antwoord.clone();
        caches.open(CACHE).then(cache => cache.put(verzoek, kopie));
      }
      return antwoord;
    }))
  );
});
