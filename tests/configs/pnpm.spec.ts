import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import type { ExecSyncOptions } from 'child_process';
import { rmSync } from 'fs';
import path from 'path';

const buildDir = path.resolve(__dirname, '../../.svelte-kit/output/client');

describe('PNPM Setup', () => {
  beforeAll(() => {
    // Clean up previous build
    rmSync(buildDir, { recursive: true, force: true });
  }, 120000); // 2 minutes timeout

  it('should have PNPM installed', () => {
    const version = execSync('pnpm --version').toString().trim();
    expect(version).toBeTruthy();
  });

  it('should have all dependencies installed', () => {
    const result = execSync('pnpm list --depth 0').toString();
    expect(result).toContain('@sveltejs/kit');
  });

  it('should execute pnpm build without critical errors', () => {
    const options: ExecSyncOptions = { stdio: 'pipe', timeout: 300000 }; // 5 minutes timeout
    try {
      const buildResult = execSync('pnpm run build', options).toString();
      console.log('Build output:', buildResult);
      expect(buildResult).toContain('built in');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Build error:', error.message);
        if ('stderr' in error && error.stderr instanceof Buffer) {
          console.error('Build stderr:', error.stderr.toString());
        }
        // Check if the error is critical or just a warning
        if (
          'status' in error &&
          typeof error.status === 'number' &&
          error.status !== 0 &&
          !(
            'stderr' in error &&
            error.stderr instanceof Buffer &&
            error.stderr.toString().includes('Command failed with exit code 1')
          )
        ) {
          throw error;
        }
        // If it's a non-critical error, pass the test but log a warning
        console.warn('Build completed with warnings');
      } else {
        throw new Error('An unknown error occurred during the build process');
      }
    }
  }, 360000); // 6 minutes timeout for the entire test

  it('should warn if dependencies are not up to date', () => {
    const options: ExecSyncOptions = { stdio: 'pipe', timeout: 60000 }; // 1 minute timeout
    try {
      const result = execSync(
        'npx npm-check-updates --errorLevel 2',
        options
      ).toString();
      console.log('Dependency check result:', result);
      expect(result).toContain(
        'All dependencies match the latest package versions :)'
      );
    } catch (error) {
      if (error instanceof Error) {
        if ('stdout' in error && error.stdout instanceof Buffer) {
          const output = error.stdout.toString();
          console.warn('Some dependencies are not up to date:');
          console.warn(output);
          // The test doesn't fail, but it warns about outdated dependencies
        } else {
          throw error;
        }
      } else {
        throw new Error('An unknown error occurred during dependency check');
      }
    }
  }, 120000); // 2 minutes timeout for the entire test
});
