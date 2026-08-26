/* Daily Practice — offline cache.
   Keeps the whole app on the phone so it opens with no signal at all.
   Bump CACHE when index.html changes so the new version is picked up. */
const CACHE = "daily-practice-v3";
const SHELL = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) {
        // Serve instantly from cache, then quietly refresh it for next time.
        fetch(e.request).then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }).catch(() => {});
        return hit;
      }
      return fetch(e.request)
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
