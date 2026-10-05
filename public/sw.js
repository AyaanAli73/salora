// Salora Service Worker v1.0
const CACHE_NAME = 'salora-cache-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/salora.png',
  '/icons/icon-maskable.svg',
]

// 1. Install & Cache Shell Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// 2. Activate & Purge Stale Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// 3. Network First / Cache Fallback Fetch Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request
  // Skip non-GET requests (NEVER cache mutating financial POST/PUT/DELETE requests!)
  if (request.method !== 'GET') return

  // Skip browser extension requests
  if (!request.url.startsWith(self.location.origin)) return

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Clone and store valid 200 responses in cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return networkResponse
      })
      .catch(() => {
        // Offline: Serve cached asset or fall back to root HTML shell
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          if (request.mode === 'navigate') {
            return caches.match('/index.html')
          }
          return new Response('Network unavailable', { status: 503, statusText: 'Offline' })
        })
      })
  )
})

// 4. Push Notification Ingestion
self.addEventListener('push', (event) => {
  let data = {
    title: 'Salora Alert',
    body: 'You have a new update in your salon portal.',
    icon: '/salora.png',
    badge: '/salora.png',
    data: { url: '/dashboard' },
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/salora.png',
    badge: data.badge || '/salora.png',
    vibrate: [100, 50, 100],
    data: data.data || { url: '/dashboard' },
    actions: [
      { action: 'open', title: 'Open Salora' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// 5. Notification Click Navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})

// 6. Background Sync Listener (Replays offline queue when network returns)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-salon-operations') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_TRIGGERED' })
        })
      })
    )
  }
})
