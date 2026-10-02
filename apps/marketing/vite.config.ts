import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Tailwind v4 runs via PostCSS (postcss.config.js) instead of the Vite plugin —
// @tailwindcss/vite churns the rolldown dev pipeline at high CPU in this setup.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
  // Force a single copy of React so transitive deps don't pull the root's
  // hoisted React 18 alongside this app's React 19 (causes "older version of
  // React was rendered" runtime error).
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    // scripts/prerender.mjs reads this to add <link rel="modulepreload"> for
    // each prerendered route's own chunk (then deletes it from dist).
    manifest: true,
  },
  // The prerender (SSR) build must bundle its dependencies too: hoisted
  // packages like framer-motion would otherwise import the root's React 18 at
  // runtime instead of this app's React 19 (same issue as `dedupe` above).
  ssr: {
    noExternal: true,
  },
})
