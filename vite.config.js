import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Gnamo',
        short_name: 'Gnamo',
        description: 'I tuoi impegni, senza sensi di colpa.',
        lang: 'it',
        start_url: '/',
        scope: '/',
        display: 'standalone', // apre a schermo intero, senza barra del browser
        orientation: 'portrait',
        background_color: '#0f1226',
        theme_color: '#0f1226',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // I dati veri stanno su Supabase: qui teniamo solo il guscio dell'app,
        // così si apre anche senza rete.
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
      devOptions: {
        enabled: true, // per poterla provare anche in sviluppo
      },
    }),
  ],
})
