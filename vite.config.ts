import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { svelteTesting } from '@testing-library/svelte/vite';
import { svelteInspector } from '@sveltejs/vite-plugin-svelte-inspector';

export default defineConfig({
  plugins: [sveltekit(), svelteTesting(), svelteInspector()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
});
