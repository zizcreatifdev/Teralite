// Service Worker Teralite
// Cache le catalogue pour consultation offline

const CACHE_NAME = 'teralite-v1'
const STATIC_ASSETS = [
  '/',
  '/produits',
  '/manifest.json',
]

// Installation : mise en cache des assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activation : suppression des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch : stratégie Cache First pour assets statiques, Network First pour APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Ne pas intercepter les requêtes API, auth ou admin
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    event.request.method !== 'GET'
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          // Mettre en cache les pages du catalogue
          if (
            response.ok &&
            (url.pathname === '/' ||
              url.pathname.startsWith('/produits'))
          ) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached)

      return cached || networkFetch
    })
  )
})
