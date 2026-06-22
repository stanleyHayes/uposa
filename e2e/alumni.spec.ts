import { test, expect } from '@playwright/test';

const APP = 'http://localhost:5175';

test.describe('alumni portal', () => {
  test('login page renders the password field', async ({ page }) => {
    await page.goto(APP + '/login');
    await expect(page.locator('#password')).toBeVisible();
  });

  test('password visibility toggle reveals the value', async ({ page }) => {
    await page.goto(APP + '/login');
    const pw = page.locator('#password');
    await expect(pw).toBeVisible();
    await pw.fill('secret123');
    await expect(pw).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /show password/i }).click();
    await expect(pw).toHaveAttribute('type', 'text');
  });

  test('is excluded from search indexing (portal)', async ({ page }) => {
    await page.goto(APP + '/login');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  });
});
