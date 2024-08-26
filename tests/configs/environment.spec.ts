import { expect, it, describe, beforeEach, afterEach } from 'vitest';

describe('Environment Variables', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'sk-mockkey123456';
    process.env.PUBLIC_CONVEX_URL = 'https://confident-fennec-622.convex.cloud';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should have the correct OpenAI API key format', () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^sk-[a-zA-Z0-9]+$/);
  });

  it('should have the correct Convex URL', () => {
    const convexUrl = process.env.PUBLIC_CONVEX_URL;
    expect(convexUrl).toBeDefined();
    expect(convexUrl).toBe('https://confident-fennec-622.convex.cloud');
  });

  it('should have all required environment variables defined', () => {
    expect(process.env.OPENAI_API_KEY).toBeDefined();
    expect(process.env.PUBLIC_CONVEX_URL).toBeDefined();
  });
});
