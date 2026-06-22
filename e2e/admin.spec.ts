import { test, expect } from '@playwright/test';

const APP = 'http://localhost:5173';

test.describe('admin dashboard', () => {
  test('renders the admin app shell', async ({ page }) => {
    await page.goto(APP + '/');
    await expect(page).toHaveTitle(/UPOSA Admin/i);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('is excluded from search indexing (portal)', async ({ page }) => {
    await page.goto(APP + '/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  });
});
