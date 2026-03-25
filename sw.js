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

self.addEventListener('fetch', e => {

    // 👉 Interceptar share_target (POST)
    if (e.request.method === 'POST') {
        e.respondWith((async () => {
            const formData = await e.request.formData();
            const url = formData.get('url') || formData.get('text') || '';

            const redirectUrl = `/linkora/?url=${encodeURIComponent(url)}`;
            return Response.redirect(redirectUrl, 303);
        })());
        return;
    }

    // 👉 Comportamiento normal (cache)
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
