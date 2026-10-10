// Balkans service worker - omogucava instalaciju i rad aplikacije bez interneta
const CACHE = 'balkans-v1';
const OSNOVNO = ['/', '/index.html', '/gradovi.js', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(OSNOVNO)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API pozive i spoljne servise uvek saljemo direktno na mrezu
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Stranice: prvo mreza (sveza verzija), a bez interneta iz kesa
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => { const kopija = r.clone(); caches.open(CACHE).then(c => c.put('/', kopija)); return r; })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Ostali fajlovi: iz kesa, pa osvezi u pozadini
  e.respondWith(
    caches.match(e.request).then(kes => {
      const mreza = fetch(e.request).then(r => {
        if (r.ok) { const kopija = r.clone(); caches.open(CACHE).then(c => c.put(e.request, kopija)); }
        return r;
      }).catch(() => kes);
      return kes || mreza;
    })
  );
});
