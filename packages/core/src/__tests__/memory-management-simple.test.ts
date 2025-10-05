/**
 * Simple Memory Management Tests for Story 1.4
 *
 * Tests to validate basic memory efficiency and plugin lifecycle
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PluginManager } from '../plugins/plugin-manager';
import { createTestPlugin } from './test-utils-simple';
import type { Logger, AnalysisContext } from '../plugins/analysis-plugin';

describe('Memory Management', () => {
  let pluginManager: PluginManager;
  let mockLogger: Logger;

  beforeEach(async () => {
    mockLogger = {
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {}
    };

    pluginManager = new PluginManager(mockLogger);
  });

  afterEach(async () => {
    await pluginManager.cleanup();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Memory Usage Monitoring', () => {
    it('should track memory usage during plugin operations', async () => {
      const initialMemory = process.memoryUsage();

      // Register multiple plugins
      const plugins = Array.from({ length: 10 }, (_, i) =>
        createTestPlugin({
          name: `memory-plugin-${i}`,
          async execute(context: AnalysisContext): Promise<any> {
            // Allocate some memory
            const data = new Array(1000).fill(Math.random());
            return {
              toolName: `memory-plugin-${i}`,
              status: 'success' as const,
              executionTime: 100,
              issues: [],
              metrics: {
                issuesCount: 0,
                score: 100,
                memoryAllocated: data.length * 8
              }
            };
          }
        })
      );

      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      const afterRegistrationMemory = process.memoryUsage();
      const registrationMemoryDiff = afterRegistrationMemory.heapUsed - initialMemory.heapUsed;

      expect(pluginManager.getPluginCount()).toBe(10);

      // Memory increase should be reasonable (less than 10MB for 10 simple plugins)
      expect(registrationMemoryDiff).toBeLessThan(10 * 1024 * 1024);
    });

    it('should clean up memory properly after plugin unregistration', async () => {
      const initialMemory = process.memoryUsage();

      // Register and then unregister plugins
      const plugins = Array.from({ length: 5 }, (_, i) =>
        createTestPlugin({
          name: `cleanup-plugin-${i}`,
          async execute(context: AnalysisContext) {
            return {
              toolName: `cleanup-plugin-${i}`,
              status: 'success' as const,
              executionTime: 50,
              issues: [],
              metrics: {
                issuesCount: 0,
                errorsCount: 0,
                warningsCount: 0,
                infoCount: 0,
                fixableCount: 0,
                score: 100
              }
            };
          },
          async cleanup() {
            // Simulate cleanup work
            const data = new Array(100).fill(Math.random());
            data.length = 0; // Clear array
          }
        })
      );

      // Register all plugins
      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      const afterRegistrationMemory = process.memoryUsage();

      // Unregister all plugins
      for (const plugin of plugins) {
        await pluginManager.unregisterPlugin(plugin.name);
      }

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      const afterCleanupMemory = process.memoryUsage();
      const memoryDiff = afterCleanupMemory.heapUsed - initialMemory.heapUsed;

      expect(pluginManager.getPluginCount()).toBe(0);

      // Memory should not have grown significantly after cleanup
      expect(memoryDiff).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
    });
  });

  describe('Plugin Lifecycle Memory Management', () => {
    it('should handle plugin initialization without memory leaks', async () => {
      const initialMemory = process.memoryUsage();

      const memoryIntensivePlugin = createTestPlugin({
        name: 'memory-intensive-plugin',
        async initialize(config) {
          // Allocate memory during initialization
          this.cache = new Array(5000).fill(Math.random());
        },
        async execute(context: AnalysisContext) {
          return {
            toolName: 'memory-intensive-plugin',
            status: 'success' as const,
            executionTime: 100,
            issues: [],
            metrics: {
                issuesCount: 0,
                errorsCount: 0,
                warningsCount: 0,
                infoCount: 0,
                fixableCount: 0,
                score: 100
              }
          };
        },
        async cleanup() {
          // Clean up allocated memory
          (this).cache = null;
          delete (this).cache;
        }
      });

      await pluginManager.registerPlugin(memoryIntensivePlugin);

      const afterRegistrationMemory = process.memoryUsage();

      await pluginManager.unregisterPlugin(memoryIntensivePlugin.name);

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      const afterCleanupMemory = process.memoryUsage();
      const memoryDiff = afterCleanupMemory.heapUsed - initialMemory.heapUsed;

      // Memory should be properly cleaned up
      expect(memoryDiff).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });

    it('should handle repeated plugin operations efficiently', async () => {
      const initialMemory = process.memoryUsage();

      // Perform multiple register/unregister cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        const plugin = createTestPlugin({
          name: `cycle-plugin-${cycle}`,
          async execute(context: AnalysisContext) {
            return {
              toolName: `cycle-plugin-${cycle}`,
              status: 'success' as const,
              executionTime: 50,
              issues: [],
              metrics: {
                issuesCount: 0,
                errorsCount: 0,
                warningsCount: 0,
                infoCount: 0,
                fixableCount: 0,
                score: 100
              }
            };
          }
        });

        await pluginManager.registerPlugin(plugin);
        await pluginManager.unregisterPlugin(plugin.name);
      }

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory growth should be minimal after multiple cycles
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
      expect(pluginManager.getPluginCount()).toBe(0);
    });
  });

  describe('Memory Pressure Detection', () => {
    it('should monitor memory usage trends', async () => {
      const memorySnapshots = [];

      // Take baseline memory snapshot
      memorySnapshots.push(process.memoryUsage().heapUsed);

      // Register plugins incrementally and monitor memory
      for (let i = 0; i < 10; i++) {
        const plugin = createTestPlugin({
          name: `pressure-plugin-${i}`,
          async execute(context: AnalysisContext) {
            // Simulate work that uses memory
            const data = new Array(100 * (i + 1)).fill(Math.random());
            return {
              toolName: `pressure-plugin-${i}`,
              status: 'success' as const,
              executionTime: 100,
              issues: [],
              metrics: {
                issuesCount: 0,
                errorsCount: 0,
                warningsCount: 0,
                infoCount: 0,
                fixableCount: 0,
                score: 100,
                memoryUsed: data.length * 8
              }
            };
          }
        });

        await pluginManager.registerPlugin(plugin);
        memorySnapshots.push(process.memoryUsage().heapUsed);
      }

      // Memory should grow gradually but not explode
      const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];

      expect(memoryGrowth).toBeGreaterThanOrEqual(0); // Should use some memory or stay same
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // But not too much (< 50MB)
      expect(pluginManager.getPluginCount()).toBe(10);

      // Memory growth should be somewhat linear
      const averageGrowthPerPlugin = memoryGrowth / 10;
      expect(averageGrowthPerPlugin).toBeLessThan(5 * 1024 * 1024); // Less than 5MB per plugin
    });
  });
});