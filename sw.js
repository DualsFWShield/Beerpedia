const CACHE_NAME = 'Beerpedia-v4';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './js/app.js',
    './js/data.js',
    './js/guide_content.js',
    './js/runtime.js',
    './manifest.webmanifest',
    './icons/logo-bnr.png',
    './icons/192x192.png',
    './icons/512x512.png',
    // Articles
    './articles/intro.html',
    './articles/lager.html',
    './articles/ipa.html',
    './articles/stout.html',
    './articles/trappist.html',
    './articles/saison.html',
    './articles/sour.html'
];

// Install Event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching Beerpedia Shell');
                return cache.addAll(ASSETS);
            })
    );
    self.skipWaiting(); // Force activation
});

// Activate Event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] Clearing Old Cache:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim(); // Take control immediately
});

// Fetch Event - Network First for HTML, Cache First for assets
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // HTML pages: Network first
    if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone and cache the fresh response
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Other assets: Cache first
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return networkResponse;
            });
        })
    );
});

// Listen for skipWaiting message
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
