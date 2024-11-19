// vite.config.ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [sveltekit(), tsconfigPaths()],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, 'src/lib'),
      $components: path.resolve(__dirname, 'src/lib/components'),
      $utilities: path.resolve(__dirname, 'src/lib/utilities'),
      $types: path.resolve(__dirname, 'src/types'),
      $app: path.resolve(__dirname, 'src'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
    hmr: {
      overlay: true,
    },
  },
  build: {
    sourcemap: true,
    minify: false,
  },
  optimizeDeps: {
    include: ['@sveltejs/kit'],
  },
});
