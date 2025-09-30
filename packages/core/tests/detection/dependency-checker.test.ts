import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { DependencyChecker } from '../../src/detection/dependency-checker';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createTestDir, cleanupTestDir } from '../test-utils';

describe('DependencyChecker', () => {
  let checker: DependencyChecker;
  let testDir: string;

  beforeEach(() => {
    checker = new DependencyChecker();
    testDir = createTestDir('test-deps');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  describe('detectDependencies', () => {
    it('should detect all dependency types', async () => {
      const packageJson = {
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          typescript: '^5.3.3',
          eslint: '^8.57.0',
        },
        peerDependencies: {
          'react-redux': '^8.0.0',
        },
        optionalDependencies: {
          fsevents: '^2.3.0',
        },
      };

      setupTestProject(testDir, packageJson);

      const dependencies = await checker.detectDependencies(testDir);

      expect(dependencies.length).toBeGreaterThanOrEqual(5);
      expect(dependencies.some(d => d.name === 'react' && d.type === 'dependencies')).toBe(true);
      expect(dependencies.some(d => d.name === 'typescript' && d.type === 'devDependencies')).toBe(
        true
      );
      expect(
        dependencies.some(d => d.name === 'react-redux' && d.type === 'peerDependencies')
      ).toBe(true);
      expect(
        dependencies.some(d => d.name === 'fsevents' && d.type === 'optionalDependencies')
      ).toBe(true);
    });

    it('should detect compatible dependencies', async () => {
      const packageJson = {
        devDependencies: {
          typescript: '^5.3.3',
          eslint: '^8.57.0',
        },
      };

      setupTestProject(testDir, packageJson);

      const dependencies = await checker.detectDependencies(testDir);

      const tsDep = dependencies.find(d => d.name === 'typescript');
      const eslintDep = dependencies.find(d => d.name === 'eslint');

      expect(tsDep!.compatibility).toBe('compatible');
      expect(eslintDep!.compatibility).toBe('compatible');
      expect(tsDep!.issues).toHaveLength(0);
      expect(eslintDep!.issues).toHaveLength(0);
    });

    it('should detect incompatible dependencies', async () => {
      const packageJson = {
        devDependencies: {
          typescript: '^4.0.0', // Below minimum 4.9.0
          eslint: '^7.0.0', // Below minimum 8.0.0
        },
      };

      setupTestProject(testDir, packageJson);

      const dependencies = await checker.detectDependencies(testDir);

      const tsDep = dependencies.find(d => d.name === 'typescript');
      const eslintDep = dependencies.find(d => d.name === 'eslint');

      expect(tsDep!.compatibility).toBe('incompatible');
      expect(eslintDep!.compatibility).toBe('incompatible');
      expect(tsDep!.issues.length).toBeGreaterThan(0);
      expect(eslintDep!.issues.length).toBeGreaterThan(0);
    });

    it('should mark unknown dependencies as unknown compatibility', async () => {
      const packageJson = {
        dependencies: {
          'unknown-package': '^1.0.0',
        },
      };

      setupTestProject(testDir, packageJson);

      const dependencies = await checker.detectDependencies(testDir);

      const unknownDep = dependencies.find(d => d.name === 'unknown-package');
      expect(unknownDep!.compatibility).toBe('unknown');
    });
  });

  describe('checkCompatibility', () => {
    it('should return compatible when all deps are compatible', async () => {
      const dependencies = [
        {
          name: 'typescript',
          version: '^5.3.3',
          type: 'devDependencies',
          compatibility: 'compatible',
          issues: [],
        },
        {
          name: 'eslint',
          version: '^8.57.0',
          type: 'devDependencies',
          compatibility: 'compatible',
          issues: [],
        },
      ] as any;

      const result = await checker.checkCompatibility(dependencies);

      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should return incompatible when any dep is incompatible', async () => {
      const dependencies = [
        {
          name: 'typescript',
          version: '^4.0.0',
          type: 'devDependencies',
          compatibility: 'incompatible',
          issues: ['Too old'],
        },
        {
          name: 'eslint',
          version: '^8.57.0',
          type: 'devDependencies',
          compatibility: 'compatible',
          issues: [],
        },
      ] as any;

      const result = await checker.checkCompatibility(dependencies);

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('Too old');
    });

    it('should generate upgrade recommendations', async () => {
      const dependencies = [
        {
          name: 'typescript',
          version: '^4.0.0',
          type: 'devDependencies',
          compatibility: 'incompatible',
          issues: ['Too old'],
        },
      ] as any;

      const result = await checker.checkCompatibility(dependencies);

      expect(result.recommendations.some(r => r.includes('typescript'))).toBe(true);
    });
  });

  describe('getMinimumVersion', () => {
    it('should return minimum version for known tools', () => {
      expect(checker.getMinimumVersion('typescript')).toBe('4.9.0');
      expect(checker.getMinimumVersion('eslint')).toBe('8.0.0');
      expect(checker.getMinimumVersion('prettier')).toBe('2.0.0');
    });

    it('should return 0.0.0 for unknown tools', () => {
      expect(checker.getMinimumVersion('unknown-tool')).toBe('0.0.0');
    });
  });

  describe('getRecommendedVersion', () => {
    it('should return recommended version for known tools', () => {
      expect(checker.getRecommendedVersion('typescript')).toBe('5.3.3');
      expect(checker.getRecommendedVersion('eslint')).toBe('8.57.0');
      expect(checker.getRecommendedVersion('prettier')).toBe('3.0.0');
    });

    it('should return latest for unknown tools', () => {
      expect(checker.getRecommendedVersion('unknown-tool')).toBe('latest');
    });
  });

  describe('version comparison', () => {
    it('should compare versions correctly', () => {
      expect(checker['compareVersions']('5.3.3', '5.3.2')).toBe(1);
      expect(checker['compareVersions']('5.3.2', '5.3.3')).toBe(-1);
      expect(checker['compareVersions']('5.3.3', '5.3.3')).toBe(0);
      expect(checker['compareVersions']('5.10.0', '5.9.9')).toBe(1);
    });

    it('should clean versions correctly', () => {
      expect(checker['cleanVersion']('^5.3.3')).toBe('5.3.3');
      expect(checker['cleanVersion']('~5.3.3')).toBe('5.3.3');
      expect(checker['cleanVersion']('5.3.3-beta.1')).toBe('5.3.3');
      expect(checker['cleanVersion']('5.3.3')).toBe('5.3.3');
    });

    it('should satisfy version ranges correctly', () => {
      expect(checker['satisfiesVersion']('5.3.3', '>=4.9.0')).toBe(true);
      expect(checker['satisfiesVersion']('4.0.0', '>=4.9.0')).toBe(false);
      expect(checker['satisfiesVersion']('5.3.3', '<6.0.0')).toBe(true);
      expect(checker['satisfiesVersion']('6.0.0', '<6.0.0')).toBe(false);
    });
  });

  function setupTestProject(dir: string, packageJson: any) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(join(dir, 'package.json'), JSON.stringify(packageJson, null, 2));
  }
});
