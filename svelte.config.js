import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
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
    // Pre-bundle these lodash functions for better performance
    include: ['lodash.get', 'lodash.isequal', 'lodash.clonedeep'],
  },
  build: {
    // Generate source maps in production for better error tracking
    sourcemap: true,
  },
};

export default config;
