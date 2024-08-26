import { describe, it, expect } from 'vitest';
import svelteConfig from '../../svelte.config.js';
import type { Config } from '@sveltejs/kit';

describe('Application Configuration', () => {
  it('should have the correct aliases', () => {
    expect(svelteConfig.kit?.alias).toEqual({
      $convex: 'src/convex',
      $lib: 'src/lib',
      $components: 'src/lib/components',
      $schemas: 'src/lib/schemas',
      $utilities: 'src/lib/utilities',
      $types: 'src/types',
    });
  });

  it('should have the correct file structure', () => {
    expect(svelteConfig.kit?.files?.assets).toBe('static');
  });

  it('should resolve aliases correctly', () => {
    const config = svelteConfig as Config;
    expect(config.kit).toBeDefined();
    expect(config.kit?.alias).toBeDefined();

    const aliases = config.kit?.alias;
    if (!aliases) {
      throw new Error('Aliases are not defined in the Svelte config');
    }

    expect(aliases.$lib).toBe('src/lib');
    expect(aliases.$components).toBe('src/lib/components');
    expect(aliases.$schemas).toBe('src/lib/schemas');
    expect(aliases.$utilities).toBe('src/lib/utilities');
    expect(aliases.$types).toBe('src/types');
    expect(aliases.$convex).toBe('src/convex');
  });
});
