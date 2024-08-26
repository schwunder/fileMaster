import { vi } from 'vitest';

// Common setup
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

process.env.NODE_ENV = 'test';
process.env.PUBLIC_CONVEX_URL = 'https://confident-fennec-622.convex.cloud';
process.env.OPENAI_API_KEY = 'mock-api-key';

global.fetch = vi.fn();

// Mock SvelteKit's goto function and page store
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn(),
  },
}));

// Mock Svelte's onMount function
vi.mock('svelte', () => ({
  onMount: vi.fn((fn) => fn()),
}));

// Suppress console.error and console.warn in tests
console.error = vi.fn();
console.warn = vi.fn();

// Node.js-specific setup
if (!process.env.VITEST_CURRENT_FILE_PATH?.includes('vite-build.spec.ts')) {
  vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('fs')>();
    return {
      ...actual,
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
      rmSync: vi.fn(),
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
    };
  });
}

global.window = undefined as any;

console.log('Current environment: node');
