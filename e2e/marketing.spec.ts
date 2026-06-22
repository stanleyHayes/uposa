import { test, expect } from '@playwright/test';

const APP = 'http://localhost:5174';

test.describe('marketing', () => {
  test('home renders with title and nav', async ({ page }) => {
    await page.goto(APP + '/');
    await expect(page).toHaveTitle(/UPOSA/i);
    await expect(page.locator('header').first()).toBeVisible();
  });

  test('exposes the Open Graph social image', async ({ page }) => {
    await page.goto(APP + '/');
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /og-image\.png/);
  });

  test('theme toggle switches the active theme', async ({ page }) => {
    await page.goto(APP + '/');
    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');
    await page.getByRole('button', { name: /theme|mode|dark|light/i }).first().click();
    await expect
      .poll(async () => html.getAttribute('data-theme'))
      .not.toBe(before);
  });
});
