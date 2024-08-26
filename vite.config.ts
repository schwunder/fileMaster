import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { svelteInspector } from '@sveltejs/vite-plugin-svelte-inspector';

export default defineConfig(({ mode }) => {
  const testEnv = process.env.TEST_ENV || 'node'; // Default to 'node' if not specified
  const isTest = mode === 'test';
  let setupFiles = undefined;
  if (isTest) {
    setupFiles =
      testEnv === 'jsdom'
        ? ['./vitest.setup.jsdom.ts']
        : ['./vitest.setup.node.ts'];
  }

  return {
    plugins: [sveltekit(), svelteInspector()],
    test: {
      include: [
        'src/**/*.{test,spec}.{js,ts}',
        'tests/**/*.{test,spec}.{js,ts}',
      ],
      exclude: ['**/node_modules/**', '**/dist/**'],
      threads: true,
      maxThreads: 10,
      minThreads: 1,
      globals: true,
      environment: testEnv,
      setupFiles: setupFiles,
      environmentMatchGlobs: [
        ['**/integration/**/*.spec.ts', 'jsdom'],
        ['**/e2e/**/*.spec.ts', 'jsdom'],
        ['**/frameworks/**/*.spec.ts', 'jsdom'],
        ['**/configs/**/*.spec.ts', 'node'],
        ['**/api/**/*.spec.ts', 'node'],
        ['**/unit/**/*.spec.ts', 'node'],
      ],
      css: testEnv === 'jsdom', // Enable CSS modules only for jsdom environment
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
    deps: {
      optimizer: {
        web: {
          include: ['@sveltejs/kit'],
        },
      },
    },
    build: {
      sourcemap: true,
    },
  };
});
