const CACHE = 'mws-restaurant-v1';

self.addEventListener('install', event => {
    const urlsToCache = [
        '/',
        './index.html',
        './restaurant.html',
        './js/dbhelper.js',
        './js/main.js',
        './js/restaurant_info.js',
        './css/styles.css',
        './data/restaurants.json',
        './img/1.jpg',
        './img/2.jpg',
        './img/3.jpg',
        './img/4.jpg',
        './img/5.jpg',
        './img/6.jpg',
        './img/7.jpg',
        './img/8.jpg',
        './img/9.jpg',
        './img/10.jpg',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
    ];

    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(cacheName => cacheName.startsWith('mws-restaurant-') && cacheName !== CACHE)
                    .map(cacheName => caches.delete(cacheName))
            )
        )
    );
});

self.addEventListener('fetch', event => {
    const requestURL = new URL(event.request.url);
    if (requestURL.origin === location.origin || requestURL.hostname === 'localhost') {
        event.respondWith(
            caches
                .match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }

                    const fetchRequest = event.request.clone();
                    return fetch(fetchRequest).then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE).then(cache => cache.put(event.request, responseToCache));

                        return response;
                    });
                })
        );
    }
});
