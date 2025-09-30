/**
 * Performance Benchmark Tests for Story 1.2
 * Validates NFR requirements specified in story lines 145-151:
 * - Fast Analysis: <2 seconds for typical projects
 * - Memory Efficiency: <50MB for analysis operations
 * - Scalability: Handle 100+ packages efficiently
 * - Concurrent Processing: Parallelize operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AutoConfigurationDetectionEngine } from '../../src/detection/detection-engine';
import { DetectionCache } from '../../src/detection/detection-cache';
import { createTestDir, cleanupTestDir } from '../test-utils';

describe('Performance Benchmarks', () => {
  let testDir: string;
  let engine: AutoConfigurationDetectionEngine;

  beforeEach(() => {
    testDir = createTestDir('perf-test');
    engine = new AutoConfigurationDetectionEngine();
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  /**
   * NFR: Fast Analysis <2s for typical projects
   * Test ID: 1.2-PERF-001
   */
  it('should complete typical project detection in <2 seconds', async () => {
    // Create a typical project structure
    createTypicalProject(testDir);

    const startTime = Date.now();
    await engine.detectAll(testDir);
    const duration = Date.now() - startTime;

    console.log(`Detection completed in ${duration}ms`);
    expect(duration).toBeLessThan(2000);
  });

  /**
   * NFR: Memory Efficiency <50MB for analysis operations
   * Test ID: 1.2-PERF-002
   */
  it('should use <50MB memory for typical project analysis', async () => {
    createTypicalProject(testDir);

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memBefore = process.memoryUsage().heapUsed;
    await engine.detectAll(testDir);

    if (global.gc) {
      global.gc();
    }

    const memAfter = process.memoryUsage().heapUsed;
    const memUsedMB = (memAfter - memBefore) / 1024 / 1024;

    console.log(`Memory used: ${memUsedMB.toFixed(2)}MB`);
    expect(memUsedMB).toBeLessThan(50);
  });

  /**
   * NFR: Concurrent Processing - Parallelize operations
   * Test ID: 1.2-PERF-003
   */
  it('should handle concurrent detection operations efficiently', async () => {
    // Create multiple test projects
    const projects = Array.from({ length: 5 }, (_, i) => {
      const projectDir = join(testDir, `project-${i}`);
      mkdirSync(projectDir, { recursive: true });
      createTypicalProject(projectDir);
      return projectDir;
    });

    const startTime = Date.now();

    // Run concurrent detections
    await Promise.all(projects.map(project => engine.detectAll(project)));

    const duration = Date.now() - startTime;

    console.log(`Concurrent detection of ${projects.length} projects in ${duration}ms`);
    // Should complete within reasonable time (not 5x serial time)
    expect(duration).toBeLessThan(5000);
  });

  /**
   * NFR: Scalability - Handle 100+ packages efficiently
   * Test ID: 1.2-PERF-004
   */
  it('should handle large monorepo with 100+ packages efficiently', async () => {
    // Create large monorepo
    createLargeMonorepo(testDir, 100);

    const startTime = Date.now();
    const result = await engine.detectAll(testDir);
    const duration = Date.now() - startTime;

    console.log(`Large monorepo detection completed in ${duration}ms`);
    expect(result.structure.packages.length).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(5000); // Allow more time for large projects
  });

  /**
   * Cache Performance: Verify cache improves performance
   * Test ID: 1.2-PERF-005
   */
  it('should demonstrate cache performance improvement', async () => {
    createTypicalProject(testDir);

    // First run (no cache)
    const startTime1 = Date.now();
    await engine.detectAll(testDir);
    const duration1 = Date.now() - startTime1;

    // Second run (with cache)
    const startTime2 = Date.now();
    await engine.detectAll(testDir);
    const duration2 = Date.now() - startTime2;

    console.log(`First run: ${duration1}ms, Second run (cached): ${duration2}ms`);
    // Cached run should be significantly faster
    expect(duration2).toBeLessThan(duration1);
  });

  /**
   * Cache Invalidation Performance
   * Test ID: 1.2-PERF-006
   */
  it('should invalidate cache when files change', async () => {
    createTypicalProject(testDir);

    // Initial detection
    const result1 = await engine.detectAll(testDir);

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Modify package.json
    const packageJsonPath = join(testDir, 'package.json');
    const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf-8'));
    packageJson.version = '2.0.0';
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Detect again - should invalidate cache and detect changes
    const result2 = await engine.detectAll(testDir);

    // Results should differ (cache was invalidated)
    expect(result1.timestamp).not.toBe(result2.timestamp);
    expect(result1.project.name).toBe(result2.project.name); // Same project
  });

  /**
   * Memory Leak Detection
   * Test ID: 1.2-PERF-007
   */
  it('should not leak memory on repeated operations', async () => {
    createTypicalProject(testDir);

    if (global.gc) {
      global.gc();
    }

    const memBefore = process.memoryUsage().heapUsed;

    // Run detection 10 times
    for (let i = 0; i < 10; i++) {
      await engine.detectAll(testDir);
    }

    if (global.gc) {
      global.gc();
    }

    const memAfter = process.memoryUsage().heapUsed;
    const memGrowthMB = (memAfter - memBefore) / 1024 / 1024;

    console.log(`Memory growth after 10 runs: ${memGrowthMB.toFixed(2)}MB`);
    // Memory growth should be minimal
    expect(memGrowthMB).toBeLessThan(10);
  });
});

describe('Cache Performance Tests', () => {
  let testDir: string;
  let cache: DetectionCache;

  beforeEach(() => {
    testDir = createTestDir('cache-test');
    cache = new DetectionCache({ ttl: 5000, maxSize: 100 });
  });

  afterEach(() => {
    cleanupTestDir(testDir);
    cache.clear();
  });

  it('should cache file reads efficiently', () => {
    const filePath = join(testDir, 'test.txt');
    writeFileSync(filePath, 'test content');

    const startTime1 = Date.now();
    cache.setCachedFile(filePath, 'test content');
    const cached = cache.getCachedFile(filePath);
    const duration1 = Date.now() - startTime1;

    expect(cached).toBe('test content');
    expect(duration1).toBeLessThan(10); // Should be very fast
  });

  it('should handle cache size limits efficiently', () => {
    const smallCache = new DetectionCache({ maxSize: 10 });

    // Add more than maxSize entries
    for (let i = 0; i < 20; i++) {
      smallCache.setCachedConfig(`key-${i}`, { data: i });
    }

    const stats = smallCache.getStats();
    expect(stats.configCache.size).toBeLessThanOrEqual(10);
  });

  it('should provide accurate cache statistics', () => {
    const filePath = join(testDir, 'test.txt');
    writeFileSync(filePath, 'content');

    cache.setCachedFile(filePath, 'content');
    cache.setCachedConfig('key1', { data: 'value' });
    cache.setCachedDependencies(testDir, { deps: [] });

    const stats = cache.getStats();

    expect(stats.fileCache.size).toBe(1);
    expect(stats.configCache.size).toBe(1);
    expect(stats.dependencyCache.size).toBe(1);
  });
});

/**
 * Helper: Create a typical project structure for testing
 */
function createTypicalProject(dir: string): void {
  // package.json
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'typical-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
        },
        devDependencies: {
          typescript: '^5.3.3',
          eslint: '^8.57.0',
          prettier: '^3.0.0',
          vitest: '^1.0.0',
        },
        scripts: {
          test: 'vitest',
          build: 'tsc',
        },
      },
      null,
      2
    )
  );

  // tsconfig.json
  writeFileSync(
    join(dir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
        },
      },
      null,
      2
    )
  );

  // .eslintrc.json
  writeFileSync(
    join(dir, '.eslintrc.json'),
    JSON.stringify(
      {
        extends: ['eslint:recommended'],
      },
      null,
      2
    )
  );

  // Create directory structure
  mkdirSync(join(dir, 'src'), { recursive: true });
  mkdirSync(join(dir, 'test'), { recursive: true });

  // Add some source files
  writeFileSync(join(dir, 'src', 'index.ts'), 'export const hello = "world";');
  writeFileSync(join(dir, 'test', 'index.test.ts'), 'import { expect, test } from "vitest";');
}

/**
 * Helper: Create a large monorepo for scalability testing
 */
function createLargeMonorepo(dir: string, packageCount: number): void {
  // Root package.json with workspaces
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'large-monorepo',
        version: '1.0.0',
        workspaces: ['packages/*'],
      },
      null,
      2
    )
  );

  // Create packages directory
  const packagesDir = join(dir, 'packages');
  mkdirSync(packagesDir, { recursive: true });

  // Create multiple packages
  for (let i = 0; i < packageCount; i++) {
    const packageDir = join(packagesDir, `package-${i}`);
    mkdirSync(packageDir, { recursive: true });

    writeFileSync(
      join(packageDir, 'package.json'),
      JSON.stringify(
        {
          name: `@monorepo/package-${i}`,
          version: '1.0.0',
          dependencies: {},
        },
        null,
        2
      )
    );

    // Add source file
    mkdirSync(join(packageDir, 'src'), { recursive: true });
    writeFileSync(join(packageDir, 'src', 'index.ts'), `export const pkg${i} = true;`);
  }
}
