// LAYAN Service Worker — enables background audio and PWA
const CACHE_NAME = "layan-v1";

// Install — activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Keep the service worker alive for background audio
self.addEventListener("fetch", (event) => {
  // Only cache same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        return new Response("Offline", { status: 503 });
      });
    })
  );
});

// Handle messages from main thread
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
