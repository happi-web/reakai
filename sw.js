const CACHE_NAME = 'app-cache-v5';
const CACHE_ASSETS = [
    '/',                  
    '/index.html',        
    '/script.js',         
    '/styles.css',        
    '/icon.png',  
    '/logo.png',         
];

// Install event: Cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CACHE_ASSETS))
            .catch((error) => console.error('Caching failed:', error))
    );
    self.skipWaiting(); // Activate the new service worker immediately
});

// Activate event: Clear old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim(); // Ensure the new service worker controls the pages
});

// Fetch event: Serve cached files if offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
            .catch(() => caches.match('/index.html')) // Fallback for offline
    );
});
