/* Service worker: aplikace se otevře i bez signálu.
   Všechny soubory aplikace se uloží při instalaci pod jednou verzí, takže se nikdy nemíchají staré a nové.
   Číslo verze se mění ručně při každé úpravě. Soubory aplikace se berou primárně ze sítě a z mezipaměti jen bez signálu,
   takže se stará verze nemůže zasekat. */
const VERSION = 'v7-doma';
const CACHE = 'zk-' + VERSION, FONTS = 'zk-fonts';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon.svg',
  'js/data.js', 'js/equipment.js', 'js/storage.js', 'js/core.js', 'js/views-home.js', 'js/views-plans.js',
  'js/views-lib-hist.js', 'js/coach.js', 'js/settings.js', 'js/events.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('zk-') && k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Dropboxu a WebDAV se to netýká: jsou to jiné domény, ty SW nechává být.
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => {
      if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : null) || Response.error())));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
