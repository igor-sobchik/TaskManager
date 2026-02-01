import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        manifest: {
          name: env.VITE_APP_NAME || 'Task Manager',
          short_name: env.VITE_APP_SHORT_NAME || 'TaskManager',
          description: env.VITE_APP_DESCRIPTION || 'A simple task manager application',
          theme_color: '#ffffff',
          start_url: '.',
          display: 'standalone',
          icons: [
            {
              src: 'to-do.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: 'to-do.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            }
          ]
        }
      })
    ],
    build: {
      minify: false,
      rollupOptions: {
        output: {
          // 1. JS Entry file (e.g., assets/index.js)
          entryFileNames: 'assets/[name].js',
          
          // 2. JS Chunks (e.g., assets/Home.js) - used for code splitting
          chunkFileNames: 'assets/[name].js',
          
          // 3. CSS and Assets (e.g., assets/index.css)
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    }
  }
})