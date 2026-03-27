// LAYAN Service Worker — app shell caching + background audio support
const CACHE_NAME = "layan-v2";

// App shell files to cache on install
const SHELL = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Remove old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache: API routes, blob URLs, YouTube, or cross-origin
  if (
    url.pathname.startsWith("/api/") ||
    event.request.url.startsWith("blob:") ||
    url.hostname.includes("youtube") ||
    url.hostname.includes("googleapis") ||
    url.origin !== self.location.origin
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for navigation (always get fresh HTML)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/"))
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts, images)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Only cache successful same-origin responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => new Response("Offline", { status: 503 }));
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
