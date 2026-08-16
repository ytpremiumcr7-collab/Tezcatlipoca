import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Mobile build: Cesium-only, touch-optimized, bottom sheets
export default defineConfig({
  mode: 'mobile',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  define: {
    __PLATFORM__: JSON.stringify('mobile'),
    __MOBILE__: JSON.stringify(true),
  },
  build: {
    outDir: 'dist-mobile',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      // Exclude heavy libraries not needed on mobile
      external: ['maplibre-gl', 'force-graph', 'd3'],
      output: {
        manualChunks: (id: string) => {
          if (id.includes('cesium')) return 'cesium'
          if (id.includes('react')) return 'react'
          return null
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['cesium']
  }
})
