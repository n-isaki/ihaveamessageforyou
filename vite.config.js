import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'firebase-config',
      generateBundle(options, bundle) {
        this.emitFile({
          type: 'asset',
          fileName: 'firebase-config.js',
          source: `
// This file is generated during build
// DO NOT EDIT MANUALLY

(function() {
  if (typeof window !== 'undefined') {
    window.FIREBASE_CONFIG = '${process.env.FIREBASE_CONFIG || ''}';
  }
})();
          `
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - separate third-party libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/functions'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'canvas-confetti', 'qrcode.react', 'browser-image-compression'],
          
          // Feature chunks - group by functionality
          'admin-core': [
            './src/pages/AdminDashboard.jsx',
            './src/pages/AdminLogin.jsx',
            './src/pages/ShopifyThemeExplorer.jsx',
            './src/components/AdminSidebar.jsx'
          ],
          
          'experience-viewer': [
            './src/modules/anima/core/UniversalViewer.jsx',
            './src/modules/anima/experiences/multimedia-gift/pages/Viewer.jsx',
            './src/modules/anima/experiences/noor/pages/NoorViewer.jsx',
            './src/modules/anima/experiences/memoria/pages/MemoryViewer.jsx'
          ],
          
          'wizard-core': [
            './src/modules/anima/experiences/multimedia-gift/pages/Wizard.jsx',
            './src/modules/anima/experiences/multimedia-gift/hooks/useGiftLogic.js',
            './src/modules/anima/experiences/multimedia-gift/components/WizardMessageEditor.jsx'
          ],
          
          'customer-setup': [
            './src/pages/CustomerSetup.redesign.jsx',
            './src/components/GiftFieldConfigurator.jsx'
          ],
          
          'modals': [
            './src/components/modals/EtsyModal.jsx',
            './src/components/modals/MemoriaModal.jsx'
          ],
          
          'services': [
            './src/services/auth.js',
            './src/services/gifts.js',
            './src/services/pinSecurity.js',
            './src/services/albumUpload.js'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase warning limit to reduce noise
  }
})
