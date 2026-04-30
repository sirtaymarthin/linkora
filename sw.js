const CACHE = 'lv-v101';
const FILES = ['/linkora/', '/linkora/index.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
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

// Interceptar POST del Web Share Target (archivos)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.method === 'POST' && url.pathname === '/linkora/') {
    e.respondWith((async () => {
      const formData = await e.request.formData();

      const shareUrl   = formData.get('share_url')   || '';
      const shareText  = formData.get('share_text')  || '';
      const shareTitle = formData.get('share_title') || '';
      const file       = formData.get('shared_file');

      let pendingShare = {};

      if (file && file instanceof File && file.size > 0) {
        // Es un archivo: convertir a base64 para pasarlo al cliente
        const buffer  = await file.arrayBuffer();
        const bytes   = new Uint8Array(buffer);
        let binary    = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        const base64  = btoa(binary);

        pendingShare = {
          type:     'file',
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileData: base64,
          note:     shareTitle || shareText || ''
        };
      } else {
        // Es un link / texto
        const urlFromText = (shareText || '').match(/https?:\/\/[^\s]+/)?.[0] || '';
        pendingShare = {
          type: 'url',
          url:  shareUrl || urlFromText || shareText || '',
          note: shareTitle || ''
        };
      }

      // Mandar datos al cliente mediante postMessage o sessionStorage vía cliente
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: 'SHARE_TARGET', payload: pendingShare });
      }

      // Si no hay cliente abierto, guardar en cache temporal para que lo lea al arrancar
      if (clients.length === 0) {
        const cache = await caches.open(CACHE);
        await cache.put(
          '/__pending_share__',
          new Response(JSON.stringify(pendingShare), { headers: { 'Content-Type': 'application/json' } })
        );
      }

      // Redirigir a la app
      return Response.redirect('/linkora/', 303);
    })());
    return;
  }

  // GET normal: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
