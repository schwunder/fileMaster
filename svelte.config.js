import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(), // Preprocessing with named import

  kit: {
    adapter: adapter(),
    alias: {
      $convex: 'src/convex',
      $lib: 'src/lib',
      $components: 'src/lib/components',
      $schemas: 'src/lib/schemas',
      $utilities: 'src/lib/utilities',
      $types: 'src/types',
    },
    files: {
      assets: 'static',
    },
  },
  optimizeDeps: {
    include: ['lodash.get', 'lodash.isequal', 'lodash.clonedeep'],
  },
  build: {
    sourcemap: process.env.NODE_ENV !== 'production', // Conditional sourcemap for production
  },
};

export default config;
