// vitest.setup.e2e.ts
import { vi } from 'vitest';

// Setup for end-to-end tests

// Configure global variables or authentication
process.env.AUTH_TOKEN = 'mock-auth-token';

console.log('End-to-end tests environment set up');
