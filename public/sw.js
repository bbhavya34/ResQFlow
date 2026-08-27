/**
 * public/sw.js
 * ============================================================================
 * QFlow Emergency PWA Service Worker
 * Handles offline assets, background notifications & SOS routing alerts.
 * ============================================================================
 */

const CACHE_NAME = "qflow-emergency-v1";
const OFFLINE_URL = "/offline-sos";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/offline-sos",
        "/manifest.json",
        "/robots.txt",
      ]).catch((err) => {
        console.warn("[QFlow/SW] Pre-caching non-fatal warning:", err);
      });
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }).then(() => self.clients.claim()),
  );
});

// Listen for offline SOS trigger from the application thread
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "TRIGGER_OFFLINE_FLOOD_SOS") {
    const { name, distanceKm, cardinalHeading, bearingAngle } = event.data.payload || {};

    const title = `🚨 Flood SOS: Safehouse ${name || "Identified"}`;
    const options = {
      body: `Head ${cardinalHeading || "towards target"} (${bearingAngle || 0}°) · Distance: ${distanceKm || "?"} km. Follow offline compass now.`,
      icon: "/icon.png",
      badge: "/icon.png",
      tag: "qflow-flood-sos",
      requireInteraction: true,
      renotify: true,
      vibrate: [300, 100, 300, 100, 300],
      data: {
        url: OFFLINE_URL,
        timestamp: Date.now(),
      },
      actions: [
        { action: "navigate", title: "Open Compass" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(title, options).catch((err) => {
        console.warn("[QFlow/SW] showNotification warning:", err);
      }),
    );
  }
});

// Handle notification click to focus or open /offline-sos
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
        return self.clients.openWindow(OFFLINE_URL);
      }
    }),
  );
});