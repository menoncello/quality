import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { DetectionCache } from '../../src/detection/detection-cache';
import { DetectionResult } from '../../src/detection/types';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createTestDir, cleanupTestDir } from '../test-utils';

describe('DetectionCache', () => {
  let cache: DetectionCache;
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir('cache-test');
    cache = new DetectionCache({ ttl: 1000, maxSize: 3 });
  });

  afterEach(() => {
    cache.clear();
    cleanupTestDir(testDir);
  });

  describe('constructor', () => {
    it('should create cache with default options', () => {
      const defaultCache = new DetectionCache();
      const stats = defaultCache.getStats();

      expect(stats.fileCache.maxSize).toBe(1000);
      expect(stats.configCache.maxSize).toBe(1000);
    });

    it('should create cache with custom options', () => {
      const customCache = new DetectionCache({ ttl: 5000, maxSize: 100 });
      const stats = customCache.getStats();

      expect(stats.fileCache.maxSize).toBe(100);
    });
  });

  describe('file caching', () => {
    it('should cache file content with modification time', () => {
      const filePath = join(testDir, 'test.txt');
      writeFileSync(filePath, 'test content');

      cache.setCachedFile(filePath, 'test content');
      const cached = cache.getCachedFile(filePath);

      expect(cached).toBe('test content');
    });

    it('should return null for non-existent file', () => {
      const result = cache.getCachedFile(join(testDir, 'non-existent.txt'));
      expect(result).toBeNull();
    });

    it('should invalidate cache when file is modified', async () => {
      const filePath = join(testDir, 'test.txt');
      writeFileSync(filePath, 'original content');

      cache.setCachedFile(filePath, 'original content');

      // Wait a bit to ensure different mtime
      await new Promise(resolve => setTimeout(resolve, 10));

      // Modify file
      writeFileSync(filePath, 'modified content');

      const cached = cache.getCachedFile(filePath);
      expect(cached).toBeNull();
    });

    it('should not cache non-existent file', () => {
      const filePath = join(testDir, 'non-existent.txt');
      cache.setCachedFile(filePath, 'content');

      const cached = cache.getCachedFile(filePath);
      expect(cached).toBeNull();
    });

    it('should return cached content when file unchanged', () => {
      const filePath = join(testDir, 'test.txt');
      writeFileSync(filePath, 'content');

      cache.setCachedFile(filePath, 'content');

      // Get cache multiple times
      const cached1 = cache.getCachedFile(filePath);
      const cached2 = cache.getCachedFile(filePath);

      expect(cached1).toBe('content');
      expect(cached2).toBe('content');
    });
  });

  describe('config caching', () => {
    it('should cache configuration data', () => {
      const config = { name: 'test', version: '1.0.0' };
      cache.setCachedConfig('test-config', config);

      const cached = cache.getCachedConfig('test-config');
      expect(cached).toEqual(config);
    });

    it('should return null for non-existent config', () => {
      const result = cache.getCachedConfig('non-existent');
      expect(result).toBeNull();
    });

    it('should invalidate config after TTL expires', async () => {
      const config = { name: 'test' };
      cache.setCachedConfig('test-config', config);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const cached = cache.getCachedConfig('test-config');
      expect(cached).toBeNull();
    });

    it('should return config before TTL expires', async () => {
      const config = { name: 'test' };
      cache.setCachedConfig('test-config', config);

      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 500));

      const cached = cache.getCachedConfig('test-config');
      expect(cached).toEqual(config);
    });

    it('should cache different config keys separately', () => {
      const config1 = { name: 'config1' };
      const config2 = { name: 'config2' };

      cache.setCachedConfig('key1', config1);
      cache.setCachedConfig('key2', config2);

      expect(cache.getCachedConfig('key1')).toEqual(config1);
      expect(cache.getCachedConfig('key2')).toEqual(config2);
    });
  });

  describe('dependency caching', () => {
    it('should cache dependency tree', () => {
      const deps = { deps: ['react', 'typescript'] };
      cache.setCachedDependencies(testDir, deps);

      const cached = cache.getCachedDependencies(testDir);
      expect(cached).toEqual(deps);
    });

    it('should return null for non-existent dependency cache', () => {
      const result = cache.getCachedDependencies('/non-existent');
      expect(result).toBeNull();
    });

    it('should invalidate dependencies after TTL expires', async () => {
      const deps = { deps: ['react'] };
      cache.setCachedDependencies(testDir, deps);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const cached = cache.getCachedDependencies(testDir);
      expect(cached).toBeNull();
    });

    it('should return dependencies before TTL expires', async () => {
      const deps = { deps: ['react'] };
      cache.setCachedDependencies(testDir, deps);

      await new Promise(resolve => setTimeout(resolve, 500));

      const cached = cache.getCachedDependencies(testDir);
      expect(cached).toEqual(deps);
    });
  });

  describe('result caching', () => {
    const mockResult: DetectionResult = {
      project: {
        name: 'test-project',
        version: '1.0.0',
        description: 'Test',
        type: 'backend',
        frameworks: [],
        hasTypeScript: true,
        hasTests: true,
        packageManager: 'npm',
      },
      tools: [],
      dependencies: [],
      structure: {
        isMonorepo: false,
        workspaceType: null,
        packages: [],
        sourceDirectories: ['src'],
        testDirectories: ['test'],
        configDirectories: [],
        complexity: 'simple',
      },
      issues: [],
      recommendations: [],
      timestamp: Date.now(),
    };

    it('should cache detection result', () => {
      // Create package.json for tracking
      writeFileSync(join(testDir, 'package.json'), '{}');

      cache.setCachedResult(testDir, mockResult);
      const cached = cache.getCachedResult(testDir);

      expect(cached).toEqual(mockResult);
    });

    it('should return null for non-existent result', () => {
      const result = cache.getCachedResult('/non-existent');
      expect(result).toBeNull();
    });

    it('should invalidate result when package.json modified', async () => {
      const packageJsonPath = join(testDir, 'package.json');
      writeFileSync(packageJsonPath, '{"name":"test"}');

      cache.setCachedResult(testDir, mockResult);

      // Wait and modify package.json
      await new Promise(resolve => setTimeout(resolve, 10));
      writeFileSync(packageJsonPath, '{"name":"modified"}');

      const cached = cache.getCachedResult(testDir);
      expect(cached).toBeNull();
    });

    it('should cache result even without package.json', () => {
      cache.setCachedResult(testDir, mockResult);
      const cached = cache.getCachedResult(testDir);

      expect(cached).toEqual(mockResult);
    });

    it('should invalidate result after TTL expires', async () => {
      writeFileSync(join(testDir, 'package.json'), '{}');
      cache.setCachedResult(testDir, mockResult);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const cached = cache.getCachedResult(testDir);
      expect(cached).toBeNull();
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate all caches for a path', () => {
      const filePath = join(testDir, 'test.txt');
      writeFileSync(filePath, 'content');
      writeFileSync(join(testDir, 'package.json'), '{}');

      cache.setCachedFile(filePath, 'content');
      cache.setCachedConfig(testDir + '/config', { test: true });
      cache.setCachedDependencies(testDir, { deps: [] });
      cache.setCachedResult(testDir, {
        project: {} as unknown,
        tools: [],
        dependencies: [],
        structure: {} as unknown,
        issues: [],
        recommendations: [],
        timestamp: Date.now(),
      });

      cache.invalidate(testDir);

      expect(cache.getCachedFile(filePath)).toBeNull();
      expect(cache.getCachedConfig(testDir + '/config')).toBeNull();
      expect(cache.getCachedDependencies(testDir)).toBeNull();
      expect(cache.getCachedResult(testDir)).toBeNull();
    });

    it('should only invalidate caches for specified path', () => {
      const path1 = join(testDir, 'project1');
      const path2 = join(testDir, 'project2');
      mkdirSync(path1, { recursive: true });
      mkdirSync(path2, { recursive: true });

      const file1 = join(path1, 'test.txt');
      const file2 = join(path2, 'test.txt');
      writeFileSync(file1, 'content1');
      writeFileSync(file2, 'content2');

      cache.setCachedFile(file1, 'content1');
      cache.setCachedFile(file2, 'content2');

      cache.invalidate(path1);

      expect(cache.getCachedFile(file1)).toBeNull();
      expect(cache.getCachedFile(file2)).toBe('content2');
    });
  });

  describe('cache clearing', () => {
    it('should clear all caches', () => {
      const filePath = join(testDir, 'test.txt');
      writeFileSync(filePath, 'content');

      cache.setCachedFile(filePath, 'content');
      cache.setCachedConfig('key', { test: true });
      cache.setCachedDependencies(testDir, { deps: [] });

      cache.clear();

      const stats = cache.getStats();
      expect(stats.fileCache.size).toBe(0);
      expect(stats.configCache.size).toBe(0);
      expect(stats.dependencyCache.size).toBe(0);
      expect(stats.resultCache.size).toBe(0);
    });
  });

  describe('cache statistics', () => {
    it('should return correct cache statistics', () => {
      const stats = cache.getStats();

      expect(stats.fileCache.size).toBe(0);
      expect(stats.fileCache.maxSize).toBe(3);
      expect(stats.configCache.size).toBe(0);
      expect(stats.configCache.maxSize).toBe(3);
    });

    it('should update statistics when items added', () => {
      const filePath = join(testDir, 'test.txt');
      writeFileSync(filePath, 'content');

      cache.setCachedFile(filePath, 'content');
      cache.setCachedConfig('key', { test: true });

      const stats = cache.getStats();
      expect(stats.fileCache.size).toBe(1);
      expect(stats.configCache.size).toBe(1);
    });
  });

  describe('cache size limits', () => {
    it('should enforce max cache size for file cache', () => {
      // Create 4 files (maxSize is 3)
      for (let i = 0; i < 4; i++) {
        const filePath = join(testDir, `file${i}.txt`);
        writeFileSync(filePath, `content${i}`);
        cache.setCachedFile(filePath, `content${i}`);
      }

      const stats = cache.getStats();
      expect(stats.fileCache.size).toBeLessThanOrEqual(3);
    });

    it('should enforce max cache size for config cache', () => {
      // Add 4 configs (maxSize is 3)
      for (let i = 0; i < 4; i++) {
        cache.setCachedConfig(`key${i}`, { index: i });
      }

      const stats = cache.getStats();
      expect(stats.configCache.size).toBeLessThanOrEqual(3);
    });

    it('should remove oldest entries when exceeding size', () => {
      const file1 = join(testDir, 'file1.txt');
      const file2 = join(testDir, 'file2.txt');
      const file3 = join(testDir, 'file3.txt');
      const file4 = join(testDir, 'file4.txt');

      writeFileSync(file1, 'content1');
      writeFileSync(file2, 'content2');
      writeFileSync(file3, 'content3');
      writeFileSync(file4, 'content4');

      cache.setCachedFile(file1, 'content1');
      cache.setCachedFile(file2, 'content2');
      cache.setCachedFile(file3, 'content3');
      cache.setCachedFile(file4, 'content4'); // This should evict file1

      // First file should be evicted
      expect(cache.getCachedFile(file1)).toBeNull();
      // Others should still be cached
      expect(cache.getCachedFile(file2)).toBe('content2');
      expect(cache.getCachedFile(file3)).toBe('content3');
      expect(cache.getCachedFile(file4)).toBe('content4');
    });

    it('should enforce size limit for dependency cache', () => {
      for (let i = 0; i < 4; i++) {
        cache.setCachedDependencies(`/path${i}`, { deps: [i] });
      }

      const stats = cache.getStats();
      expect(stats.dependencyCache.size).toBeLessThanOrEqual(3);
    });

    it('should enforce size limit for result cache', () => {
      const mockResult: DetectionResult = {
        project: {} as unknown,
        tools: [],
        dependencies: [],
        structure: {} as unknown,
        issues: [],
        recommendations: [],
        timestamp: Date.now(),
      };

      for (let i = 0; i < 4; i++) {
        cache.setCachedResult(`/path${i}`, mockResult);
      }

      const stats = cache.getStats();
      expect(stats.resultCache.size).toBeLessThanOrEqual(3);
    });
  });
});