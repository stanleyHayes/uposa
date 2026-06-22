import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts'],
    testTimeout: 30_000,
    // testcontainers can take a while to pull the image / boot Mongo on first run.
    hookTimeout: 180_000,
  },
});
