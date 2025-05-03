// Service Worker for SchoolChat PWA
const CACHE_NAME = 'schoolchat-v1';
const OFFLINE_URL = '/';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@mdi/font@6.5.95/css/materialdesignicons.min.css'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // Skip waiting forces the waiting service worker to become active
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => {
        // Claim clients allows an active service worker to set itself as the controller for all clients within its scope
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests and requests to the API
  if (event.request.method !== 'GET' || event.request.url.includes('/api/') || event.request.url.includes('/ws')) {
    return;
  }
  
  // For navigation requests (HTML documents), use a network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // For all other requests, use a cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response because it's a stream and can only be consumed once
            const responseToCache = networkResponse.clone();
            
            // Open the cache and put the new response there
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, return a generic offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            
            // For other resource types, just return a 404-like response
            return new Response('Not available offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
    );
});

// Handle sync events for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Helper function to sync pending messages
async function syncMessages() {
  try {
    // Open IndexedDB
    const dbPromise = indexedDB.open('SchoolChatDB', 1);
    
    dbPromise.onsuccess = function(event) {
      const db = event.target.result;
      
      // Get pending messages
      const transaction = db.transaction('messages', 'readwrite');
      const store = transaction.objectStore('messages');
      const pendingIndex = store.index('pending');
      const pendingMessages = pendingIndex.getAll(true);
      
      pendingMessages.onsuccess = function() {
        const messages = pendingMessages.result;
        
        // Send each pending message to the server
        messages.forEach(async (message) => {
          try {
            const response = await fetch('/api/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                content: message.content,
                recipientId: message.recipientId,
                channelId: message.channelId,
                fileId: message.fileId
              })
            });
            
            if (response.ok) {
              // Update message as not pending
              message.pending = false;
              const updateRequest = store.put(message);
              
              updateRequest.onsuccess = function() {
                console.log('[Service Worker] Message synced successfully', message.id);
              };
            }
          } catch (error) {
            console.error('[Service Worker] Error syncing message', message.id, error);
          }
        });
      };
    };
  } catch (error) {
    console.error('[Service Worker] Error syncing messages', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.content,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('SchoolChat', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
