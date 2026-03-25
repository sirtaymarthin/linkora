const CACHE = 'linkora-v5';

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

    const url = new URL(e.request.url);

    // 👉 SOLO interceptar el share_target
    if (
        e.request.method === 'POST' &&
        url.pathname === '/linkora/'
    ) {
        e.respondWith((async () => {
            const formData = await e.request.formData();
            const sharedUrl = formData.get('url') || formData.get('text') || '';

            return Response.redirect(`/linkora/?url=${encodeURIComponent(sharedUrl)}`, 303);
        })());
        return;
    }

    // 👉 TODO lo demás pasa normal
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
