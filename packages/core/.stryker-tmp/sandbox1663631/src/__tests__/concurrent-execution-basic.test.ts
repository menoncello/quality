/**
 * Basic Concurrent Execution Tests for Story 1.4
 *
 * Tests to validate concurrent execution safety using PluginManager
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PluginManager } from '../plugins/plugin-manager';
import { createTestPlugin } from './test-utils-simple';
import type { Logger, AnalysisContext, ProjectConfiguration, AnalysisPlugin, ToolResult } from '../plugins/analysis-plugin';

describe('Concurrent Execution', () => {
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
  });

  describe('Concurrent Plugin Operations', () => {
    it('should handle multiple plugin registrations concurrently', async () => {
      const pluginCount = 10;
      const plugins = Array.from({ length: pluginCount }, (_, i) =>
        createTestPlugin({
          name: `concurrent-plugin-${i}`,
          async execute(context: AnalysisContext): Promise<ToolResult> {
            // Simulate work
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
            return {
              toolName: `concurrent-plugin-${i}`,
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
        })
      );

      // Register plugins concurrently
      const registrationPromises = plugins.map(plugin =>
        pluginManager.registerPlugin(plugin)
      );

      await Promise.all(registrationPromises);

      expect(pluginManager.getPluginCount()).toBe(pluginCount);

      // Verify all plugins are registered
      for (let i = 0; i < pluginCount; i++) {
        expect(pluginManager.hasPlugin(`concurrent-plugin-${i}`)).toBe(true);
      }
    });

    it('should handle concurrent plugin initialization', async () => {
      const sharedState = { initialized: 0 };
      const pluginCount = 5;

      const plugins = Array.from({ length: pluginCount }, (_, i) =>
        createTestPlugin({
          name: `init-plugin-${i}`,
          async initialize(config) {
            // Simulate initialization work
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
            sharedState.initialized++;
          },
          async execute(context: AnalysisContext) {
            // Simulate initialization during execution if not already initialized
            if (!this.initialized) {
              await this.initialize({});
              this.initialized = true;
            }
            return {
              toolName: `init-plugin-${i}`,
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
        })
      );

      // Register all plugins
      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      // Execute all plugins to trigger initialization
      const executionPromises = plugins.map(plugin =>
        plugin.execute({
          projectPath: '/test',
          config: { name: 'test', version: '1.0.0', tools: [] } as ProjectConfiguration,
          logger: mockLogger
        })
      );

      await Promise.all(executionPromises);

      expect(sharedState.initialized).toBe(pluginCount);
      expect(pluginManager.getPluginCount()).toBe(pluginCount);
    });
  });

  describe('Race Condition Prevention', () => {
    it('should handle concurrent operations without crashing', async () => {
      const sharedCounter = { value: 0 };
      const pluginCount = 10;

      const plugins = Array.from({ length: pluginCount }, (_, i) =>
        createTestPlugin({
          name: `concurrent-plugin-${i}`,
          async execute(context: AnalysisContext) {
            // Each plugin performs some work and updates shared state
            const increment = Math.floor(Math.random() * 5) + 1; // 1-5 increments
            sharedCounter.value += increment;

            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));

            return {
              toolName: `concurrent-plugin-${i}`,
              status: 'success' as const,
              executionTime: 50,
              issues: [],
              metrics: {
                issuesCount: 0,
                errorsCount: 0,
                warningsCount: 0,
                infoCount: 0,
                fixableCount: 0,
                score: 100,
                increment
              }
            };
          }
        })
      );

      // Register all plugins
      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      // Execute all plugins concurrently
      const executionPromises = plugins.map(async (plugin) => {
        return plugin.execute({
          projectPath: '/test',
          config: { name: 'test', version: '1.0.0', tools: [] },
          logger: mockLogger
        });
      });

      const results = await Promise.all(executionPromises);

      expect(results).toHaveLength(pluginCount);
      expect(results.every(r => r.status === 'success')).toBe(true);

      // Should have some increments but not exceed maximum possible
      expect(sharedCounter.value).toBeGreaterThan(0); // Should have some increments
      expect(sharedCounter.value).toBeLessThanOrEqual(pluginCount * 5); // Not more than max possible

      // Verify each plugin contributed something
      const totalIncrement = results.reduce((sum, r) => sum + ((r.metrics as { increment?: number }).increment ?? 0), 0);
      expect(totalIncrement).toBe(sharedCounter.value);
    });

    it('should handle concurrent map operations safely', async () => {
      const sharedMap = new Map<string, string[]>();
      const pluginCount = 10;

      const plugins = Array.from({ length: pluginCount }, (_, i) =>
        createTestPlugin({
          name: `map-plugin-${i}`,
          async execute(context: AnalysisContext) {
            const key = `key-${i}`;
            const values = Array.from({ length: 5 }, (_, j) => `value-${i}-${j}`);

            // Add to map
            sharedMap.set(key, values);

            // Simulate work
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));

            // Retrieve and verify
            const retrieved = sharedMap.get(key);
            expect(retrieved).toEqual(values);

            return {
              toolName: `map-plugin-${i}`,
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
        })
      );

      // Register all plugins
      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      // Execute all plugins concurrently
      const executionPromises = plugins.map(plugin =>
        plugin.execute({
          projectPath: '/test',
          config: { name: 'test', version: '1.0.0', tools: [] } as ProjectConfiguration,
          logger: mockLogger
        })
      );

      const results = await Promise.all(executionPromises);

      expect(results).toHaveLength(pluginCount);
      expect(results.every(r => r.status === 'success')).toBe(true);
      expect(sharedMap.size).toBe(pluginCount);
    });
  });

  describe('Resource Management', () => {
    it('should handle plugin cleanup under concurrent load', async () => {
      const cleanupTracker = { cleaned: 0 };
      const pluginCount = 8;

      const plugins = Array.from({ length: pluginCount }, (_, i) =>
        createTestPlugin({
          name: `cleanup-plugin-${i}`,
          async execute(context: AnalysisContext) {
            // Allocate some memory
            const data = new Array(100).fill(Math.random());
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
            await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
            cleanupTracker.cleaned++;
          }
        })
      );

      // Register all plugins
      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      expect(pluginManager.getPluginCount()).toBe(pluginCount);

      // Unregister all plugins concurrently
      const unregistrationPromises = plugins.map(plugin =>
        pluginManager.unregisterPlugin(plugin.name)
      );

      await Promise.all(unregistrationPromises);

      expect(pluginManager.getPluginCount()).toBe(0);
      expect(cleanupTracker.cleaned).toBe(pluginCount);
    });

    it('should manage memory efficiently during concurrent operations', async () => {
      const initialMemory = process.memoryUsage();
      const pluginCount = 15;

      const memoryIntensivePlugins = Array.from({ length: pluginCount }, (_, i) =>
        createTestPlugin({
          name: `memory-plugin-${i}`,
          async execute(context: AnalysisContext) {
            // Allocate memory during execution
            const data = new Array(1000).fill(Math.random());
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));

            // Cleanup
            data.length = 0;

            return {
              toolName: `memory-plugin-${i}`,
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
          }
        })
      );

      // Register all plugins
      for (const plugin of memoryIntensivePlugins) {
        await pluginManager.registerPlugin(plugin);
      }

      // Execute all plugins concurrently
      const executionPromises = memoryIntensivePlugins.map(plugin =>
        plugin.execute({
          projectPath: '/test',
          config: { name: 'test', version: '1.0.0', tools: [] } as ProjectConfiguration,
          logger: mockLogger
        })
      );

      const results = await Promise.all(executionPromises);

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryDiff = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(results).toHaveLength(pluginCount);
      expect(results.every(r => r.status === 'success')).toBe(true);

      // Memory increase should be reasonable
      expect(memoryDiff).toBeLessThan(20 * 1024 * 1024); // Less than 20MB
    });
  });

  describe('Error Handling Under Concurrency', () => {
    it('should handle plugin failures gracefully during concurrent execution', async () => {
      const pluginCount = 10;

      const plugins = Array.from({ length: pluginCount }, (_, i) => {
        // Make it deterministic: fail plugins at indices 0, 3, 6, 9 (40% failure rate)
        const shouldFail = i % 3 === 0;

        return createTestPlugin({
          name: `error-plugin-${i}`,
          async execute(context: AnalysisContext) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50));

            if (shouldFail) {
              throw new Error(`Plugin ${i} intentionally failed`);
            }

            return {
              toolName: `error-plugin-${i}`,
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
      });

      // Register all plugins
      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      // Execute all plugins concurrently
      const executionPromises = plugins.map(async (plugin) => {
        try {
          const result = await plugin.execute({
            projectPath: '/test',
            config: { name: 'test', version: '1.0.0', tools: [] },
            logger: mockLogger
          });
          return { success: true, result };
        } catch (error) {
          return { success: false, error };
        }
      });

      const results = await Promise.all(executionPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      expect(results).toHaveLength(pluginCount);
      expect(successful.length + failed.length).toBe(pluginCount);

      // Some should succeed, some should fail
      expect(successful.length).toBeGreaterThan(0);
      expect(failed.length).toBeGreaterThan(0);

      // Verify error details
      failed.forEach(result => {
        expect(result.error).toBeInstanceOf(Error);
      });
    });
  });
});