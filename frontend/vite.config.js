import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Sépare les grosses dépendances qui changent rarement du code applicatif,
        // pour que le navigateur puisse les garder en cache d'un déploiement à l'autre.
        manualChunks: {
          'leaflet-vendor': ['leaflet', 'react-leaflet'],
          'socket-vendor':  ['socket.io-client'],
          'i18n-vendor':    ['i18next', 'react-i18next'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
