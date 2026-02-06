import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'admin-core': [
            './src/pages/AdminDashboard.jsx',
            './src/pages/AdminLogin.jsx',
            './src/pages/ShopifyThemeExplorer.jsx'
          ],
          'experience-viewer': [
            './src/modules/anima/core/UniversalViewer.jsx',
            './src/modules/anima/experiences/multimedia-gift/pages/Viewer.jsx'
            // Other viewers will be grouped here or stay separate depending on logic
          ]
        }
      }
    }
  }
})
