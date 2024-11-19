import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { JSDOM } from 'jsdom';
import { onMount } from 'svelte';

// Custom TextEncoder to fix compatibility with JSDOM
class ESBuildAndJSDOMCompatibleTextEncoder extends TextEncoder {
  encode(input: string) {
    const decodedURI = decodeURIComponent(encodeURIComponent(input));
    const arr = new Uint8Array(decodedURI.length);
    for (let i = 0; i < decodedURI.length; i++) {
      arr[i] = decodedURI.charCodeAt(i);
    }
    return arr;
  }
}

global.TextEncoder = ESBuildAndJSDOMCompatibleTextEncoder;

// Set up JSDOM environment
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'file://localhost/', // Ensure file URL scheme is used
});

// Assign window and document globally for JSDOM
global.window = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Ensure TextDecoder is globally available (use Node.js's util module if not present)
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

// Mock SvelteKit-specific modules to avoid errors in the test environment
vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
  building: false,
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  page: { subscribe: vi.fn() },
  navigating: { subscribe: vi.fn() },
  updated: { subscribe: vi.fn() },
}));

// Instead of requireActual, use importActual in Vitest
vi.mock('svelte', async () => {
  const actual = await vi.importActual('svelte');
  return {
    ...actual,
    onMount: vi.fn(), // Mocking onMount
  };
});
