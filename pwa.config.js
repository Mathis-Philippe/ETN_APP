// pwa.config.js
module.exports = function (config) {
  if (config.mode === 'production') {
    // Configurez workbox pour le caching
    config.workbox.options.runtimeCaching = [
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|js|css)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'assets-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
          },
        },
      },
      {
        urlPattern: /^https:\/\/cardiovascular-pitchier-duke\.ngrok-free\.dev\/order-pdf\//,
        handler: 'NetworkFirst',
        options: {
            cacheName: 'pdf-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
            },
        },
      },
    ];
  }
  return config;
};