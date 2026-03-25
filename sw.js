const CACHE = 'linkora-v4';

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

self.addEventListener('fetch', e => {

    // 👉 SOLO interceptar peticiones POST del share_target
    if (e.request.method === 'POST') {
        e.respondWith((async () => {
            const formData = await e.request.formData();
            const url = formData.get('url') || formData.get('text') || '';

            return Response.redirect(`/linkora/?url=${encodeURIComponent(url)}`, 303);
        })());
        return;
    }

    // 👉 resto normal
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
