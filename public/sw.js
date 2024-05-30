const CACHE = "pwabuilder-offline";

importScripts('/workbox-v7.1.0/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix:'/workbox-v7.1.0',
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

workbox.routing.registerRoute(
  new RegExp('/*'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE
  })
);