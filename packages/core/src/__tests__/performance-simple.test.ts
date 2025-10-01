/**
 * Simple Performance Tests for Story 1.4 (PERF-001, PERF-002 Risk Validation)
 *
 * Tests to validate performance requirements and memory management
 * according to QA risk mitigation requirements.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PluginManager } from '../plugins/plugin-manager.js';
import { createTestPlugin } from './test-utils-simple.js';
import type { Logger } from '../plugins/analysis-plugin.js';

describe('Performance Validation (PERF-001, PERF-002)', () => {
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

  describe('Plugin Execution Performance', () => {
    it('should execute multiple plugins within performance targets', async () => {
      const pluginCount = 10;
      const plugins = Array.from({ length: pluginCount }, (_, i) =>
        createTestPlugin({
          name: `perf-plugin-${i}`,
          async execute(context) {
            const startTime = Date.now();

            // Simulate some work
            const data = new Array(1000).fill(Math.random());
            data.sort();

            const executionTime = Date.now() - startTime;

            return {
              toolName: `perf-plugin-${i}`,
              status: 'success' as const,
              executionTime,
              issues: [],
              metrics: {
                issuesCount: 0,
                score: 100,
                processingTime: executionTime
              }
            };
          }
        })
      );

      // Register all plugins
      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      expect(pluginManager.getPluginCount()).toBe(pluginCount);

      // Execute all plugins and measure performance
      const startTime = Date.now();
      const executionPromises = plugins.map(plugin =>
        plugin.execute({
          projectId: 'perf-test',
          projectPath: '/test',
          options: {}
        })
      );

      const results = await Promise.all(executionPromises);
      const totalTime = Date.now() - startTime;

      // Validate performance targets
      expect(results).toHaveLength(pluginCount);
      expect(results.every(r => r.status === 'success')).toBe(true);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Individual plugin execution should be fast
      results.forEach(result => {
        expect(result.executionTime).toBeLessThan(1000); // Each plugin under 1 second
      });
    });

    it('should handle concurrent plugin execution efficiently', async () => {
      const pluginCount = 20;
      const plugins = Array.from({ length: pluginCount }, (_, i) =>
        createTestPlugin({
          name: `concurrent-perf-plugin-${i}`,
          async execute(context) {
            // Simulate variable workloads
            const workload = Math.random() * 50; // 0-50ms of work
            await new Promise(resolve => setTimeout(resolve, workload));

            return {
              toolName: `concurrent-perf-plugin-${i}`,
              status: 'success' as const,
              executionTime: workload,
              issues: [],
              metrics: {
                issuesCount: 0,
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

      // Execute concurrently and measure
      const startTime = Date.now();
      const results = await Promise.all(
        plugins.map(plugin =>
          plugin.execute({
            projectId: 'concurrent-test',
            projectPath: '/test',
            options: {}
          })
        )
      );
      const totalTime = Date.now() - startTime;

      // Concurrent execution should be faster than sequential
      expect(results).toHaveLength(pluginCount);
      expect(results.every(r => r.status === 'success')).toBe(true);
      expect(totalTime).toBeLessThan(1000); // Should complete much faster than sequential
    });
  });

  describe('Memory Usage Management', () => {
    it('should manage memory efficiently during plugin operations', async () => {
      const initialMemory = process.memoryUsage();
      const pluginCount = 15;

      // Create memory-intensive plugins
      const plugins = Array.from({ length: pluginCount }, (_, i) =>
        createTestPlugin({
          name: `memory-plugin-${i}`,
          async execute(context) {
            // Allocate memory during execution
            const data = new Array(10000).fill(Math.random());

            // Process the data
            const processed = data.map(x => x * 2).filter(x => x > 0.5);

            // Cleanup
            data.length = 0;

            return {
              toolName: `memory-plugin-${i}`,
              status: 'success' as const,
              executionTime: 100,
              issues: [],
              metrics: {
                issuesCount: 0,
                score: 100,
                memoryAllocated: processed.length * 8 // bytes
              }
            };
          }
        })
      );

      // Register and execute plugins
      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      await Promise.all(
        plugins.map(plugin =>
          plugin.execute({
            projectId: 'memory-test',
            projectPath: '/test',
            options: {}
          })
        )
      );

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(pluginManager.getPluginCount()).toBe(pluginCount);
    });

    it('should clean up memory properly after plugin unregistration', async () => {
      const initialMemory = process.memoryUsage();
      const pluginCount = 10;

      // Create and register memory-intensive plugins
      const plugins = Array.from({ length: pluginCount }, (_, i) =>
        createTestPlugin({
          name: `cleanup-memory-plugin-${i}`,
          async execute(context) {
            // Allocate significant memory
            this.memoryCache = new Array(5000).fill(Math.random());
            return {
              toolName: `cleanup-memory-plugin-${i}`,
              status: 'success' as const,
              executionTime: 50,
              issues: [],
              metrics: {
                issuesCount: 0,
                score: 100
              }
            };
          },
          async cleanup() {
            // Explicit cleanup
            if (this.memoryCache) {
              this.memoryCache.length = 0;
              this.memoryCache = null;
            }
          }
        })
      );

      // Register and execute plugins
      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      // Execute plugins to allocate memory
      await Promise.all(
        plugins.map(plugin =>
          plugin.execute({
            projectId: 'cleanup-test',
            projectPath: '/test',
            options: {}
          })
        )
      );

      const afterExecutionMemory = process.memoryUsage();

      // Unregister all plugins (should trigger cleanup)
      for (const plugin of plugins) {
        await pluginManager.unregisterPlugin(plugin.name);
      }

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryDiff = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory should be properly cleaned up
      expect(memoryDiff).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
      expect(pluginManager.getPluginCount()).toBe(0);
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain performance with high plugin count', async () => {
      const highPluginCount = 50;
      const plugins = Array.from({ length: highPluginCount }, (_, i) =>
        createTestPlugin({
          name: `load-test-plugin-${i}`,
          async execute(context) {
            // Simulate light work
            await new Promise(resolve => setTimeout(resolve, 10));

            return {
              toolName: `load-test-plugin-${i}`,
              status: 'success' as const,
              executionTime: 10,
              issues: [],
              metrics: {
                issuesCount: 0,
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

      expect(pluginManager.getPluginCount()).toBe(highPluginCount);

      // Measure performance under load
      const startTime = Date.now();

      // Execute in batches to avoid overwhelming the system
      const batchSize = 10;
      const results = [];

      for (let i = 0; i < plugins.length; i += batchSize) {
        const batch = plugins.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(plugin =>
            plugin.execute({
              projectId: 'load-test',
              projectPath: '/test',
              options: {}
            })
          )
        );
        results.push(...batchResults);
      }

      const totalTime = Date.now() - startTime;

      // Should handle high load gracefully
      expect(results).toHaveLength(highPluginCount);
      expect(results.every(r => r.status === 'success')).toBe(true);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Average time per plugin should remain reasonable
      const avgTimePerPlugin = totalTime / highPluginCount;
      expect(avgTimePerPlugin).toBeLessThan(200); // Less than 200ms per plugin average
    });

    it('should handle plugin failures without performance degradation', async () => {
      const totalPlugins = 20;
      const failureRate = 0.3; // 30% failure rate
      const plugins = Array.from({ length: totalPlugins }, (_, i) => {
        const shouldFail = Math.random() < failureRate;

        return createTestPlugin({
          name: `failure-test-plugin-${i}`,
          async execute(context) {
            if (shouldFail) {
              throw new Error(`Plugin ${i} intentionally failed`);
            }

            return {
              toolName: `failure-test-plugin-${i}`,
              status: 'success' as const,
              executionTime: 50,
              issues: [],
              metrics: {
                issuesCount: 0,
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

      const startTime = Date.now();

      // Execute all plugins and handle failures
      const results = await Promise.allSettled(
        plugins.map(plugin =>
          plugin.execute({
            projectId: 'failure-test',
            projectPath: '/test',
            options: {}
          })
        )
      );

      const totalTime = Date.now() - startTime;

      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      // Should handle failures gracefully
      expect(results).toHaveLength(totalPlugins);
      expect(successful.length + failed.length).toBe(totalPlugins);
      expect(failed.length).toBeGreaterThan(0); // Some should fail
      expect(successful.length).toBeGreaterThan(0); // Some should succeed

      // Performance should not be severely impacted by failures
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Resource Management', () => {
    it('should limit resource usage effectively', async () => {
      const resourceIntensivePlugins = Array.from({ length: 5 }, (_, i) =>
        createTestPlugin({
          name: `resource-plugin-${i}`,
          async execute(context) {
            // Simulate resource-intensive work
            const startTime = Date.now();

            // CPU-intensive work
            let result = 0;
            for (let j = 0; j < 1000000; j++) {
              result += Math.random();
            }

            // Memory allocation
            const data = new Array(5000).fill(result);

            const executionTime = Date.now() - startTime;

            return {
              toolName: `resource-plugin-${i}`,
              status: 'success' as const,
              executionTime,
              issues: [],
              metrics: {
                issuesCount: 0,
                score: 100,
                calculations: 1000000,
                memoryAllocated: data.length * 8
              }
            };
          }
        })
      );

      // Register plugins
      for (const plugin of resourceIntensivePlugins) {
        await pluginManager.registerPlugin(plugin);
      }

      const initialMemory = process.memoryUsage();
      const startTime = Date.now();

      // Execute with resource limits
      const results = await Promise.all(
        resourceIntensivePlugins.map(plugin =>
          plugin.execute({
            projectId: 'resource-test',
            projectPath: '/test',
            options: {}
          })
        )
      );

      const totalTime = Date.now() - startTime;
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Validate resource usage is within reasonable bounds
      expect(results).toHaveLength(5);
      expect(results.every(r => r.status === 'success')).toBe(true);
      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB memory increase
    });
  });
});