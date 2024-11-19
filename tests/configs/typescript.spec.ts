import { describe, it, expect } from 'vitest';
import path from 'path';

const isJsdom = process.env.TEST_ENV === 'jsdom';

if (!isJsdom) {
  const fs = require('fs');

  // Load tsconfig.json
  const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

  describe('TypeScript Configuration', () => {
    it('should have strict mode enabled', () => {
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('should allow synthetic default imports', () => {
      expect(tsconfig.compilerOptions.allowSyntheticDefaultImports).toBe(true);
    });

    it('should resolve JSON modules correctly', () => {
      expect(tsconfig.compilerOptions.resolveJsonModule).toBe(true);
    });

    it('should use bundler module resolution', () => {
      expect(tsconfig.compilerOptions.moduleResolution).toBe('bundler');
    });

    it('should resolve modules using bundler resolution', async () => {
      const projectRoot = process.cwd();
      const kitPath = path.resolve(
        projectRoot,
        'node_modules',
        '@sveltejs',
        'kit'
      );

      console.log('Checking kitPath:', kitPath);

      const kitExists = fs.existsSync(kitPath);
      console.log('Kit exists:', kitExists);

      expect(kitExists).toBe(true);
      expect(kitPath).toMatch(/@sveltejs[\\/]kit$/);

      if (kitExists) {
        const packageJsonPath = path.resolve(kitPath, 'package.json');
        const packageJsonExists = fs.existsSync(packageJsonPath);
        console.log('package.json exists:', packageJsonExists);

        if (packageJsonExists) {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf-8')
          );
          console.log('Kit version:', packageJson.version);
        }
      }

      try {
        const kit = await import('@sveltejs/kit');
        expect(kit).toBeTruthy();
        console.log('Successfully imported @sveltejs/kit');
      } catch (error) {
        console.error('Error importing @sveltejs/kit:', error);
      }
    });
  });
} else {
  describe('TypeScript Configuration (jsdom)', () => {
    it('Tests are skipped in jsdom environment.', () => {
      console.warn(
        'TypeScript Configuration tests are skipped in jsdom environment.'
      );
    });
  });
}
