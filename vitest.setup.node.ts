import { vi } from 'vitest';

// Ensure TextEncoder and TextDecoder are globally available for Node.js
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encoding = 'utf-8';
    encode() {
      return new Uint8Array();
    }
    encodeInto(input: string, dest: Uint8Array) {
      const encoder = new TextEncoder();
      return encoder.encodeInto(input, dest);
    }
  } as any;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    encoding = 'utf-8';
    fatal = false;
    ignoreBOM = false;
    decode() {
      return '';
    }
  } as any;
}

// Common environment setup
process.env.NODE_ENV = 'test';
process.env.PUBLIC_CONVEX_URL = 'https://confident-fennec-622.convex.cloud';
process.env.OPENAI_API_KEY = 'mock-api-key';

global.fetch = vi.fn(); // Mock global fetch for tests

// Mock SvelteKit's goto function and page store
vi.mock('$app/navigation', () => ({
  default: {
    goto: vi.fn(),
  },
  goto: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  default: {
    page: {
      subscribe: vi.fn(),
    },
  },
  page: {
    subscribe: vi.fn(),
  },
}));

// Simplify Svelte mock
vi.mock('svelte', () => ({
  onMount: vi.fn((fn) => fn()),
}));

// Mock testing library's render method if necessary
vi.mock('@testing-library/svelte', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>; // Explicitly cast 'actual' as an object
  return {
    ...actual, // Spread only works on object types
    render: actual.render, // Preserve the render method
    cleanup: actual.cleanup, // Preserve cleanup function
  };
});

// Suppress console.error and console.warn in tests
console.error = vi.fn();
console.warn = vi.fn();

// Node.js-specific setup for fs mocking
vi.mock('fs', async (importOriginal) => {
  const actual = (await importOriginal<
    typeof import('fs')
  >()) as typeof import('fs'); // Cast the imported module to fs
  return {
    ...actual,
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    rmSync: vi.fn(),
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
  };
});

// Optionally, mock `window` for SSR environments (server-side rendering)
if (typeof global.window === 'undefined') {
  global.window = undefined as any; // Only mock if window is not required
}

console.log('Node environment set up');
