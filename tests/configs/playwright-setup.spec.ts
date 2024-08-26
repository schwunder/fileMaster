import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { startServer, waitForServer } from '../../start-server';
import { ChildProcess } from 'child_process';

describe('Playwright Setup', () => {
  let browser: Browser;
  let page: Page;
  let server: ChildProcess;

  beforeAll(async () => {
    server = await startServer();
    await waitForServer('http://localhost:5173');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
  }, 60000);

  afterAll(async () => {
    await browser.close();
    if (server) {
      server.kill();
    }
  });

  it('should navigate to the home page', async () => {
    await page.goto('http://localhost:5173');

    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title).toBe('Home');

    const h1Text = await page.locator('h1').innerText();
    expect(h1Text).toBe(
      'Images Gallery with Tags and Description and Suggested Title'
    );

    const isHeaderVisible = await page.locator('header').isVisible();
    expect(isHeaderVisible).toBe(true);

    const buttons = [
      'Process Image Directory',
      'Scan Json Directory',
      'Delete All Meta Entries',
    ];

    for (const buttonText of buttons) {
      const isButtonVisible = await page
        .locator(`header button:has-text("${buttonText}")`)
        .isVisible();
      expect(isButtonVisible).toBe(true);
    }
  });
});
