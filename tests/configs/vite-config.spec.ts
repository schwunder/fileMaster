import { describe, it, expect } from 'vitest';
import type { UserConfig } from 'vite';
import viteConfig from '../../vite.config';
import path from 'path';
import { URL } from 'url'; // Import URL module

const runtimeDirectory = path.resolve(__dirname, '../src'); // Adjust path if needed
const fileUrl = new URL(`file://${runtimeDirectory}/`);

const testEnv = process.env.TEST_ENV || 'node';

const mockConfig: UserConfig = {
  plugins: [],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    environment: testEnv === 'jsdom' ? 'jsdom' : 'node',
    setupFiles: [
      testEnv === 'jsdom'
        ? './vitest.setup.jsdom.ts'
        : './vitest.setup.node.ts',
    ],
    environmentOptions: {
      jsdom: {
        url: fileUrl.href, // Ensure JSDOM uses file URL
        referrer: 'http://localhost/',
        contentType: 'text/html',
        includeNodeLocations: true,
        storageQuota: 10000000,
      },
    },
    css: {
      modules: {
        classNameStrategy: 'scoped',
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    logHeapUsage: true,
    reporters: ['verbose'],
  },
  server: {
    fs: {
      allow: ['..'], // Adjust this as per your directory structure
    },
  },
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['@sveltejs/kit'],
  },
};

describe('Vite Config', () => {
  it('should correctly configure plugins', () => {
    const config = viteConfig as UserConfig;

    // Match the plugins more flexibly, allowing for async plugins (Promises)
    expect(config.plugins?.length).toBeGreaterThan(0); // Check there are plugins defined
  });

  it('should set the correct test environment', () => {
    const config = viteConfig as UserConfig;
    const expectedEnv = testEnv === 'jsdom' ? 'jsdom' : 'node';
    expect(config.test?.environment).toBe(expectedEnv);
  });

  it('should set up correct setup files based on environment', () => {
    const config = viteConfig as UserConfig;
    const expectedSetupFiles = [
      testEnv === 'jsdom'
        ? './vitest.setup.jsdom.ts'
        : './vitest.setup.node.ts',
    ];
    expect(config.test?.setupFiles).toEqual(expectedSetupFiles);
  });

  it('should correctly configure CSS for the environment', () => {
    const config = viteConfig as UserConfig;
    const expectedCssConfig = mockConfig.test?.css;

    expect(config.test?.css).toEqual(expectedCssConfig);
  });

  it('should correctly set up environment-specific options', () => {
    const config = viteConfig as UserConfig;

    // Dynamically adjust the expected URL based on the current directory
    const expectedUrl = new URL(
      `file://${path.resolve(__dirname, '../../src')}/`
    ).href;

    // If JSDOM is being used, check for the JSDOM configuration; otherwise, expect undefined
    const expectedEnvOptions =
      testEnv === 'jsdom'
        ? {
            ...mockConfig.test?.environmentOptions?.jsdom,
            url: expectedUrl,
          }
        : undefined;

    expect(config.test?.environmentOptions?.jsdom).toEqual(expectedEnvOptions);
  });

  it('should correctly configure alias paths', () => {
    const config = viteConfig as UserConfig;

    // Dynamically determine the expected alias paths based on the environment
    const baseDir =
      process.env.TEST_ENV === 'jsdom'
        ? path.resolve(__dirname, '../../src') // Use the `src` for jsdom
        : path.resolve(__dirname, '../../src'); // Use the `src` for node environment

    const expectedAliases = {
      $app: `file://${baseDir}/`,
      $lib: `${baseDir}/lib`,
    };

    expect(config.resolve?.alias || {}).toEqual(expectedAliases);
  });
});
