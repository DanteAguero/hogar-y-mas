self.addEventListener("install", event => {
    event.waitUntil(
        caches.open("market-ff-cache").then(cache => {
            return cache.addAll([
                "/",
                "/static/global.css",
                "/static/scripts.js",
                "/static/particles.js"
            ]);
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
