"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New service worker available, prompt user to reload
                  console.log("[PWA] New service worker available");
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error);
        });

      // Handle service worker controller changes
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[PWA] Service worker controller changed");
        // Optionally reload the page to get the new service worker
        // window.location.reload();
      });
    }
  }, []);

  return null;
}
