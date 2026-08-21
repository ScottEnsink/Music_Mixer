/* Endless — service worker.
 *
 * The whole app is one HTML file with no external dependencies, so "offline
 * support" just means caching a handful of files. Strategy is deliberately
 * simple: stale-while-revalidate. Serve from cache instantly (the player opens
 * with no network at all), then refresh the cache in the background so the next
 * launch picks up any deploy.
 *
 * Bump CACHE_VERSION whenever you deploy, so old entries get cleaned out.
 */

const CACHE_VERSION = "endless-v2";   // v2: master volume moved, stepwise chords, bassline

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // addAll is atomic — one 404 fails the whole install — so add individually
      .then(cache => Promise.all(
        PRECACHE.map(url => cache.add(url).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;

  // Only same-origin GETs. Everything else goes straight to the network.
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });

      const network = fetch(req)
        .then(res => {
          if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => null);

      // Cache first for instant, offline-capable launches.
      if (cached) return cached;

      const fresh = await network;
      if (fresh) return fresh;

      // Offline with nothing cached: fall back to the app shell for navigations.
      if (req.mode === "navigate") {
        const shell = await cache.match("./index.html");
        if (shell) return shell;
      }
      return new Response("Offline", { status: 503, statusText: "Offline" });
    })
  );
});
