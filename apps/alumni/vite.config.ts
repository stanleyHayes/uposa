import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tailwind v4 runs via PostCSS (postcss.config.js) instead of the Vite plugin —
// @tailwindcss/vite churns the rolldown dev pipeline at high CPU in this setup.
export default defineConfig({
  plugins: [react()],
  server: {
    // 3000 is occupied by Grafana locally; use a dedicated free port.
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  // Force a single copy of React so transitive deps don't mix React 18/19.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
