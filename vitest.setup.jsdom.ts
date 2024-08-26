import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { setup, tw } from 'twind';
import * as colors from 'twind/colors';

// Setup Twind
setup({
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        foreground: 'hsl(var(--foreground))',
        background: 'hsl(var(--background))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        ...colors,
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
    },
  },
});

// Add CSS variables to the document
const style = document.createElement('style');
style.textContent = `
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 72.2% 50.6%;
    --destructive-foreground: 0 0% 98%;
    --ring: 240 10% 3.9%;
    --radius: 0.5rem;
  }
`;
document.head.appendChild(style);

// Force Twind to generate styles
tw('text-red-500 sm:text-lg hover:bg-blue-500 bg-primary text-foreground p-4');

// Add this function to apply Twind styles
global.applyTwindStyles = (className: string) => {
  const div = document.createElement('div');
  div.className = tw(className);
  document.body.appendChild(div);
  return getComputedStyle(div);
};

// Basic JSDOM setup
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo with correct type
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private callback: IntersectionObserverCallback) {}

  observe(): void {
    vi.fn();
  }
  unobserve(): void {
    vi.fn();
  }
  disconnect(): void {
    vi.fn();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe(): void {
    vi.fn();
  }
  unobserve(): void {
    vi.fn();
  }
  disconnect(): void {
    vi.fn();
  }
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) =>
  setTimeout(callback, 0)
);
global.cancelAnimationFrame = vi.fn((id: number) => clearTimeout(id));
