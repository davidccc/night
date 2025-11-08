import { test, expect } from '@playwright/test';

test.describe('Night-king LIFF Web smoke test', () => {
  test('home page renders hero content', async ({ page }) => {
    await page.goto(process.env.E2E_BASE_URL ?? 'http://localhost:3000');
    await expect(page.getByText('小夜X專業茶')).toBeVisible();
  });
});
