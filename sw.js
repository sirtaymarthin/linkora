const CACHE = 'linkora-v3';

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(['/linkora/', '/linkora/index.html']))
    );
});

self.addEventListener('activate', e => {
    self.clients.claim();
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
});
