// vitest.setup.common.ts
import { vi } from 'vitest';

// Common environment setup for all tests
process.env.NODE_ENV = 'test';
process.env.PUBLIC_CONVEX_URL = 'https://example.convex.cloud';
process.env.OPENAI_API_KEY = 'mock-api-key';

// Suppress console.error and console.warn in tests
console.error = vi.fn();
console.warn = vi.fn();

// Mock SvelteKit-specific modules common to all environments
vi.mock('$app/environment', () => ({
  browser: typeof window !== 'undefined',
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

// Mock Svelte's onMount function
vi.mock('svelte', async () => {
  const actual = await vi.importActual('svelte');
  return {
    ...actual,
    onMount: vi.fn(),
  };
});
