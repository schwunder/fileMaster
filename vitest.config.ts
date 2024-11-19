// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tsconfigPaths from 'vite-tsconfig-paths';
import AutoImport from 'unplugin-auto-import/vite';
import path from 'path';

console.log('Starting vitest configuration...');

export default defineConfig({
  plugins: [
    // Svelte plugin to handle Svelte components in the project
    svelte(),
    // Plugin to automatically resolve paths based on tsconfig.json
    tsconfigPaths(),
    // Auto-import plugin to automatically import common functions without manual imports
    AutoImport({
      imports: ['vitest'], // Automatically import vitest functions (e.g., describe, test, etc.)
      dts: true, // Generate TypeScript declaration file for auto-imports
    }),
  ],
  test: {
    globals: true, // Enable global variables for tests (e.g., describe, test, etc.)
    setupFiles: [
      // List of setup files to run before tests
      //'./vitest.setup.common.ts',
      './vitest.setup.node.ts',
      //'./vitest.setup.jsdom.ts',
      //'./vitest.setup.browser.ts',
      //'./vitest.setup.integration.ts',
      //'./vitest.setup.e2e.ts',
    ],
    include: [
      // Include test files from the src and tests directories
      'src/**/*.{test,spec}.{js,ts}',
      'tests/**/*.{test,spec}.{js,ts}',
    ],
    exclude: [
      // Exclude certain directories and files from tests
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    environment: 'jsdom', // Default test environment is jsdom (for simulating browser-like environment)
    environmentMatchGlobs: [
      // Match specific test files to different environments
      ['**/*.node.spec.{js,ts}', 'node'], // Use node environment for .node.spec files
      ['**/*.jsdom.spec.{js,ts}', 'jsdom'], // Use jsdom environment for .jsdom.spec files
      ['**/*.browser.spec.{js,ts}', 'jsdom'], // Use jsdom environment for .browser.spec files
      ['**/*.integration.spec.{js,ts}', 'node'], // Use node environment for .integration.spec files
      ['**/*.e2e.spec.{js,ts}', 'node'], // Use node environment for .e2e.spec files
    ],
    poolMatchGlobs: [
      // Assign specific test files to different worker pools
      ['**/*.heavy.spec.{js,ts}', 'forks'], // Use separate processes (forks) for heavy tests
      ['**/*.light.spec.{js,ts}', 'threads'], // Use threads for light tests
      ['**/*.browser.spec.{js,ts}', 'browser'], // Use browser pool for browser-specific tests
    ],
    browser: {
      enabled: true, // Enable browser testing
      name: 'chromium', // Use Chromium as the browser for testing
      provider: 'playwright', // Use Playwright to manage the browser
      headless: false, // Run tests with a visible browser window (not headless)
      providerOptions: {
        launch: {
          devtools: true, // Open DevTools in the browser for debugging
        },
        context: {
          viewport: { width: 1280, height: 720 }, // Set browser viewport size for tests
        },
      },
    },
    css: {
      modules: {
        classNameStrategy: 'scoped', // Use scoped strategy for CSS modules (to avoid class name conflicts)
      },
    },
    reporters: ['verbose'],
    testTimeout: 20000,
    hookTimeout: 20000,
    deps: {
      optimizer: {
        web: {
          include: ['(?!.*vitest).*'], // Changed from RegExp to string pattern
        },
      },
    },
  },
  resolve: {
    alias: {
      // Define path aliases for easier imports
      $lib: path.resolve(__dirname, 'src/lib'),
      $components: path.resolve(__dirname, 'src/lib/components'),
      $utilities: path.resolve(__dirname, 'src/lib/utilities'),
      $types: path.resolve(__dirname, 'src/types'),
      $app: path.resolve(__dirname, 'src'),
    },
  },
});
