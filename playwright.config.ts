import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  // Use the development server for faster test iterations
  webServer: {
    command: 'pnpm run dev', // Start the development server
    port: 5177, // Ensure this matches your dev server's port
    reuseExistingServer: !process.env.CI, // Reuse the server when not in CI
    timeout: 2000, // Increase timeout to 2 minutes
  },
  use: {
    baseURL: 'http://localhost:5177', // Set the base URL for the development server
    trace: 'on', // Enable tracing by default
    video: 'off', // Capture video during tests
    screenshot: 'off', // Capture screenshots during tests
    launchOptions: {
      headless: false, // Run in non-headless mode for debugging
      slowMo: 50, // Slow down interactions for better visibility
    },
  },
};

export default config;
