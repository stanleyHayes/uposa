import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

// Inlined (no cross-file relative import) to avoid Playwright's TS-loader
// resolve hook, which is incompatible with Node 23's module hooks.
const APPS = {
  marketing: 'http://localhost:5174',
  alumni: 'http://localhost:5175',
  admin: 'http://localhost:5173',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  use: {
    trace: 'on-first-retry',
    navigationTimeout: 30_000,
    actionTimeout: 20_000,
    // Locally, reuse the installed Chrome (no browser download needed).
    // In CI, use the Playwright-managed chromium (run `playwright install chromium`).
    ...(isCI ? {} : { channel: 'chrome' }),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Reuse running dev servers locally; start them in CI.
  webServer: [
    { command: 'npm run dev -w apps/marketing', url: APPS.marketing, reuseExistingServer: !isCI, timeout: 120_000 },
    { command: 'npm run dev -w apps/alumni', url: APPS.alumni, reuseExistingServer: !isCI, timeout: 120_000 },
    { command: 'npm run dev -w apps/admin', url: APPS.admin, reuseExistingServer: !isCI, timeout: 120_000 },
  ],
});
