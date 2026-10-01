// Service worker simples da BRL Health.
// Estratégias:
//  - app shell pré-cacheado no install (home + página offline + manifest);
//  - navegações: network-first com fallback pro cache e, por fim, /offline.html;
//  - assets estáticos (build do Next, fontes, imagens): cache-first.
// Registrado apenas em produção (ver service-worker-register.tsx), então não
// interfere no dev.

const VERSION = "brl-v1";
const STATIC_CACHE = `brl-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = ["/", OFFLINE_URL, "/manifest.webmanifest"];

const STATIC_ASSET = /\.(?:css|js|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|avif|ico)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // allSettled: um asset ausente não derruba a instalação inteira.
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegações: network-first, cai pro cache e por fim pra página offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL));
        }
      })(),
    );
    return;
  }

  // Assets estáticos: cache-first, populando o cache no primeiro acesso.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    STATIC_ASSET.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          if (fresh && fresh.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          return caches.match(request);
        }
      })(),
    );
  }
});
