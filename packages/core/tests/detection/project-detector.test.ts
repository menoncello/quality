import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ProjectDetector } from '../../src/detection/project-detector';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createTestDir, cleanupTestDir } from '../test-utils';

describe('ProjectDetector', () => {
  let detector: ProjectDetector;
  let testDir: string;

  beforeEach(() => {
    detector = new ProjectDetector();
    testDir = createTestDir('test-project');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  describe('detectProject', () => {
    it('should detect a React project', async () => {
      const packageJson = {
        name: 'react-project',
        version: '1.0.0',
        description: 'A React project',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
        },
      };

      setupTestProject(testDir, packageJson);

      const result = await detector.detectProject(testDir);

      expect(result.name).toBe('react-project');
      expect(result.version).toBe('1.0.0');
      expect(result.type).toBe('frontend');
      expect(result.frameworks).toContain('react');
      expect(result.hasTypeScript).toBe(true);
    });

    it('should detect a Node.js backend project', async () => {
      const packageJson = {
        name: 'backend-project',
        version: '1.0.0',
        dependencies: {
          express: '^4.18.0',
        },
      };

      setupTestProject(testDir, packageJson);

      const result = await detector.detectProject(testDir);

      expect(result.name).toBe('backend-project');
      expect(result.type).toBe('backend');
      expect(result.frameworks).toContain('node');
      expect(result.hasTypeScript).toBe(false);
    });

    it('should detect a monorepo project', async () => {
      const packageJson = {
        name: 'monorepo-project',
        version: '1.0.0',
        workspaces: ['packages/*'],
      };

      setupTestProject(testDir, packageJson);

      const result = await detector.detectProject(testDir);

      expect(result.type).toBe('monorepo');
      expect(result.isMonorepo).toBe(true);
    });

    it('should detect TypeScript from tsconfig.json', async () => {
      const packageJson = {
        name: 'ts-project',
        version: '1.0.0',
      };

      setupTestProject(testDir, packageJson);
      writeFileSync(
        join(testDir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'es2020',
            module: 'commonjs',
          },
        })
      );

      const result = await detector.detectProject(testDir);

      expect(result.hasTypeScript).toBe(true);
    });

    it('should detect test setup', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          test: 'jest',
          'test:watch': 'jest --watch',
        },
        devDependencies: {
          jest: '^29.0.0',
        },
      };

      setupTestProject(testDir, packageJson);

      const result = await detector.detectProject(testDir);

      expect(result.hasTests).toBe(true);
    });

    it('should detect build systems', async () => {
      const packageJson = {
        name: 'vite-project',
        version: '1.0.0',
      };

      setupTestProject(testDir, packageJson);
      writeFileSync(join(testDir, 'vite.config.ts'), 'export default {}');

      const result = await detector.detectProject(testDir);

      expect(result.buildSystems).toContain('vite');
    });

    it('should detect package manager', async () => {
      const packageJson = {
        name: 'pnpm-project',
        version: '1.0.0',
      };

      setupTestProject(testDir, packageJson);
      writeFileSync(join(testDir, 'pnpm-lock.yaml'), '');

      const result = await detector.detectProject(testDir);

      expect(result.packageManager).toBe('pnpm');
    });
  });

  function setupTestProject(dir: string, packageJson: unknown) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(join(dir, 'package.json'), JSON.stringify(packageJson, null, 2));
  }
});
