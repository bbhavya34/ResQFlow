/**
 * public/sw.js
 * ============================================================================
 * ResQFlow Emergency PWA Service Worker
 * Full Offline Caching Engine + SOS Push Notifications
 * ============================================================================
 */

const STATIC_CACHE = "resqflow-static-v2";
const RUNTIME_CACHE = "resqflow-runtime-v2";

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
            if (name !== STATIC_CACHE && name !== RUNTIME_CACHE) {
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
      tag: "qflow-flood-sos",
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