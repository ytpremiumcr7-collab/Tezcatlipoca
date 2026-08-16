import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Desktop build: MapLibre + Three.js + full tool panels
export default defineConfig({
  mode: 'desktop',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  define: {
    __PLATFORM__: JSON.stringify('desktop'),
    __MOBILE__: JSON.stringify(false),
  },
  build: {
    outDir: 'dist-desktop',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('three')) return 'three'
          if (id.includes('cesium')) return 'cesium'
          if (id.includes('maplibre')) return 'maplibre'
          if (id.includes('force-graph') || id.includes('d3-')) return 'graph'
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
