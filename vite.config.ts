import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('three')) return 'three'
          if (id.includes('cesium')) return 'cesium'
          if (id.includes('react-force-graph') || id.includes('force-graph') || id.includes('d3-')) return 'graph'
          if (id.includes('react') || id.includes('react-dom')) return 'react'
          return null
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    include: ['cesium', 'three', 'd3'],
  },
})