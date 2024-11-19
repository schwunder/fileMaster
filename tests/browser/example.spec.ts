import { test, expect } from 'vitest';
import { chromium } from 'playwright';

test('should display the homepage', async () => {
  // Launch a new browser instance
  const browser = await chromium.launch({ headless: true }); // Set to false if you want to see the browser UI
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to your app
  await page.goto('http://localhost:5173');

  // Interact with the page
  const heading = page.getByRole('heading', { name: /welcome/i });
  await expect(heading).toBeVisible();

  // Clean up
  await browser.close();
});
