import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

// Determine environment (jsdom or node)
const isJsdom = process.env.TEST_ENV === 'jsdom';

// Declare fs variable (only assign it in non-jsdom environment)
let fs: typeof import('fs');

if (!isJsdom) {
  // Use require for dynamic import in node environment
  fs = require('fs');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(__dirname, '../../.svelte-kit/output/client');
const immutableDir = path.join(buildDir, '_app/immutable');

describe('Vite Build Configuration', () => {
  if (isJsdom) {
    // Skip tests in jsdom environment
    it('should skip Vite build tests in jsdom environment', () => {
      console.log('Vite build tests are skipped in jsdom environment.');
    });
  } else {
    beforeAll(async () => {
      // Clean up previous build
      if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
      }
      // Run the build once for all tests
      await build();
    }, 300000); // 5 minutes timeout

    afterAll(() => {
      // Clean up after tests
      if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
      }
    });

    it('should generate the correct build artifacts', () => {
      expect(fs.existsSync(path.join(buildDir, '_app/version.json'))).toBe(
        true
      );

      const entryFiles = fs
        .readdirSync(path.join(immutableDir, 'entry'))
        .filter(
          (file: string | Buffer): file is string => typeof file === 'string'
        );

      console.log('Entry files:', entryFiles);

      expect(entryFiles.some((file) => file.startsWith('start.'))).toBe(true);
      expect(entryFiles.some((file) => file.startsWith('app.'))).toBe(true);

      expect(fs.existsSync(path.join(immutableDir, 'chunks'))).toBe(true);
      expect(fs.existsSync(path.join(immutableDir, 'assets'))).toBe(true);
    });

    it('should generate JS files with expected characteristics', () => {
      const jsFiles = fs
        .readdirSync(immutableDir, { recursive: true })
        .filter(
          (file: string | Buffer): file is string => typeof file === 'string'
        )
        .filter((file: string) => file.endsWith('.js'));

      expect(jsFiles.length).toBeGreaterThan(0);

      jsFiles.forEach((jsFile) => {
        const filePath = path.join(immutableDir, jsFile);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        console.log(`Checking file: ${jsFile}`);
        expect(fileContent.length).toBeGreaterThan(0);
        expect(fileContent).toContain(';'); // Basic check for JavaScript syntax
      });
    });

    it('should generate CSS files', () => {
      const cssFiles = fs
        .readdirSync(immutableDir, { recursive: true })
        .filter(
          (file: string | Buffer): file is string => typeof file === 'string'
        )
        .filter((file: string) => file.endsWith('.css'));

      expect(cssFiles.length).toBeGreaterThan(0);

      cssFiles.forEach((cssFile) => {
        const filePath = path.join(immutableDir, cssFile);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        expect(fileContent.length).toBeGreaterThan(0);
      });
    });

    it('should generate a manifest file', () => {
      const manifestPath = path.join(buildDir, '.vite/manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifestContent = JSON.parse(
        fs.readFileSync(manifestPath, 'utf-8')
      );
      expect(manifestContent).toBeInstanceOf(Object);
      expect(Object.keys(manifestContent).length).toBeGreaterThan(0);
    });

    it('should include source maps for JS files', () => {
      const allFiles = fs
        .readdirSync(immutableDir, { recursive: true })
        .filter(
          (file: string | Buffer): file is string => typeof file === 'string'
        );
      const jsFiles = allFiles.filter((file: string) => file.endsWith('.js'));
      const sourceMapFiles = allFiles.filter((file: string) =>
        file.endsWith('.js.map')
      );

      console.log('JS files:', jsFiles);
      console.log('Source map files:', sourceMapFiles);

      expect(sourceMapFiles.length).toBeGreaterThan(0);
      expect(sourceMapFiles.length).toBe(jsFiles.length);

      jsFiles.forEach((jsFile) => {
        const mapFile = jsFile + '.map';
        expect(sourceMapFiles).toContain(mapFile);
      });
    });
  }
}, 360000); // 6 minutes timeout for the entire describe block
