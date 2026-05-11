import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-og.png', 'watermark.png', 'pwa-192x192.png', 'pwa-512x512.png', 'robots.txt'],
      manifest: {
        name: 'Gelabert Homes Real Estate',
        short_name: 'Gelabert Homes',
        description: 'Encuentra tu propiedad ideal con Gelabert Homes',
        theme_color: '#0F0F0F',
        background_color: '#0F0F0F',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'any',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // El nuevo SW toma el control inmediatamente sin esperar a que se cierren pestañas
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Rutas de navegación HTML: siempre intenta red primero para obtener la última versión
        // Si falla la red (offline), usa la caché. Esto evita servir HTML viejo tras un deploy.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [
          /^\/admin/,            // Admin siempre desde la red
          /^\/_/,                // Netlify internals
          /\/[^/?]+\.[^/]+$/    // Archivos con extensión (imágenes, etc.)
        ],
        runtimeCaching: [
          // HTML de navegación: red primero, caché como fallback (offline)
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas máximo
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          // Imágenes de Unsplash: caché agresiva (no cambian)
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Imágenes de Supabase Storage: caché con revalidación
          {
            urlPattern: /^https:\/\/.*supabase\.co\/storage\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts: caché larga (no cambian)
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    })
  ],
  define: {
    'process.env': {}
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-framer': ['framer-motion'],
          'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-editor': ['@tiptap/react', '@tiptap/starter-kit'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    sourcemap: false
  }
})
