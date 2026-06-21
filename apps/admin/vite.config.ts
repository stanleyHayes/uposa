import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  // Force a single copy of React (this app otherwise resolves the root's
  // hoisted React 18, which clashes with React 19 at runtime).
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
