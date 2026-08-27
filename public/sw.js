/**
 * public/sw.js
 * ============================================================================
 * ResQFlow Emergency PWA Service Worker
 * Full Offline Caching Engine + SOS Push Notifications
 * ============================================================================
 */

const STATIC_CACHE = "resqflow-static-v3";
const RUNTIME_CACHE = "resqflow-runtime-v3";
const MAP_TILES_CACHE = "resqflow-map-tiles-v1";
const MAX_TILE_ENTRIES = 500;

// Map tile hostnames to cache offline
const MAP_TILE_HOSTS = [
  "tile.openstreetmap.org",
  "server.arcgisonline.com",
  "a.basemaps.cartocdn.com",
  "b.basemaps.cartocdn.com",
  "c.basemaps.cartocdn.com",
  "cartodb-basemaps-a.global.ssl.fastly.net",
];

const CORE_ASSETS = [
  "/",
  "/offline-sos",
  "/sos",
  "/map",
  "/camps",
  "/resources",
  "/allocation",
  "/field",
  "/analytics",
  "/offline",
  "/demo",
  "/manifest.webmanifest",
  "/robots.txt",
];

// 1. Install: Pre-cache essential App Shell routes
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(CORE_ASSETS).catch((err) => {
          console.warn("[ResQFlow/SW] Non-fatal pre-cache warning:", err);
        });
      })
      .then(() => self.skipWaiting()),
  );
});

// 2. Activate: Purge obsolete caches and claim all clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (
              name !== STATIC_CACHE &&
              name !== RUNTIME_CACHE &&
              name !== MAP_TILES_CACHE
            ) {
              return caches.delete(name);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// 3. Fetch: Intercept all network traffic with robust Offline Caching
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Skip /backend/* API routes — always go to network, never cache
  if (url.pathname.startsWith("/backend/")) {
    return;
  }

  // M. Map Tiles — Cache-First with 500-tile LRU-style limit
  if (MAP_TILE_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.match(request).then((cachedTile) => {
        if (cachedTile) return cachedTile;

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(MAP_TILES_CACHE).then(async (cache) => {
                const keys = await cache.keys();
                if (keys.length >= MAX_TILE_ENTRIES) {
                  // Evict oldest tile to stay under limit
                  await cache.delete(keys[0]);
                }
                cache.put(request, networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(async () => {
            // Offline: serve blank tile placeholder
            return new Response("", { status: 204, statusText: "Tile Offline" });
          });
      }),
    );
    return;
  }

  // A. Navigation (HTML Pages): Network-First with Offline Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline, check matching cache, then static cache, then fallback to /offline-sos
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlinePage = await caches.match("/offline-sos");
          if (offlinePage) {
            return offlinePage;
          }
          return caches.match("/");
        }),
    );
    return;
  }

  // B. Next.js Static Assets & Styles (_next/static/*, fonts, images, css, js)
  // Cache-First with Network Revalidation
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated version in background (Stale-While-Revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Return empty fallback or cached placeholder if available
            return new Response("", { status: 408, statusText: "Offline" });
          });
      }),
    );
    return;
  }

  // C. Other GET requests (API / dynamic): Network-first with runtime cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ offline: true, message: "Operating in offline degraded mode" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
  );
});

// 4. Background SOS Push & Local Notifications
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "TRIGGER_OFFLINE_FLOOD_SOS") {
    const { name, distanceKm, cardinalHeading, bearingAngle } = event.data.payload || {};

    const title = `🚨 Flood SOS: Safehouse ${name || "Identified"}`;
    const options = {
      body: `Vector: ${cardinalHeading || "Target"} (${bearingAngle || 0}°) · Distance: ${distanceKm || "?"} km. Follow offline compass now.`,
      icon: "/icon.png",
      badge: "/icon.png",
      tag: `qflow-flood-sos-${Date.now()}`,
      requireInteraction: true,
      renotify: true,
      vibrate: [300, 100, 300, 100, 300],
      data: {
        url: "/offline-sos",
        timestamp: Date.now(),
      },
      actions: [
        { action: "navigate", title: "Open Compass" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(title, options).catch((err) => {
        console.warn("[ResQFlow/SW] Notification warning:", err);
      }),
    );
  }
});

// 5. Handle Notification Click Navigation
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/offline-sos") && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/offline-sos");
      }
    }),
  );
});