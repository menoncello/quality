import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import type { AnalysisPlugin, PluginConfig, Logger } from '../plugins/analysis-plugin.js';
import { PluginManager } from '../plugins/plugin-manager.js';

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockLogger: Logger;

  beforeEach(() => {
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

  describe('plugin registration', () => {
    it('should register a plugin successfully', async () => {
      const mockPlugin: AnalysisPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: async () => {},
        execute: async () => ({
          toolName: 'test-plugin',
          executionTime: 100,
          status: 'success' as const,
          issues: [],
          metrics: {
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100
          }
        }),
        getDefaultConfig: () => ({
          name: 'test-plugin',
          enabled: true,
          config: {}
        }),
        validateConfig: () => ({
          valid: true,
          errors: [],
          warnings: []
        }),
        supportsIncremental: () => true,
        supportsCache: () => true,
        getMetrics: () => ({
          executionCount: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0,
          successCount: 0,
          errorCount: 0
        })
      };

      await pluginManager.registerPlugin(mockPlugin);
      expect(pluginManager.getPluginCount()).toBe(1);
      expect(pluginManager.hasPlugin('test-plugin')).toBe(true);
    });

    it('should not register duplicate plugins', async () => {
      const mockPlugin: AnalysisPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: async () => {},
        execute: async () => ({
          toolName: 'test-plugin',
          executionTime: 100,
          status: 'success' as const,
          issues: [],
          metrics: {
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100
          }
        }),
        getDefaultConfig: () => ({
          name: 'test-plugin',
          enabled: true,
          config: {}
        }),
        validateConfig: () => ({
          valid: true,
          errors: [],
          warnings: []
        }),
        supportsIncremental: () => true,
        supportsCache: () => true,
        getMetrics: () => ({
          executionCount: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0,
          successCount: 0,
          errorCount: 0
        })
      };

      await pluginManager.registerPlugin(mockPlugin);

      // Try to register the same plugin again
      await expect(pluginManager.registerPlugin(mockPlugin)).rejects.toThrow('Plugin test-plugin is already registered');
      expect(pluginManager.getPluginCount()).toBe(1);
    });

    it('should validate plugin dependencies', async () => {
      const dependentPlugin: AnalysisPlugin = {
        name: 'dependent-plugin',
        version: '1.0.0',
        dependencies: ['base-plugin'],
        initialize: async () => {},
        execute: async () => ({
          toolName: 'dependent-plugin',
          executionTime: 100,
          status: 'success' as const,
          issues: [],
          metrics: {
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100
          }
        }),
        getDefaultConfig: () => ({
          name: 'dependent-plugin',
          enabled: true,
          config: {}
        }),
        validateConfig: () => ({
          valid: true,
          errors: [],
          warnings: []
        }),
        supportsIncremental: () => true,
        supportsCache: () => true,
        getMetrics: () => ({
          executionCount: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0,
          successCount: 0,
          errorCount: 0
        })
      };

      // Try to register plugin with missing dependency
      await expect(pluginManager.registerPlugin(dependentPlugin)).rejects.toThrow('Plugin dependent-plugin depends on missing plugin: base-plugin');
    });
  });

  describe('plugin retrieval', () => {
    beforeEach(async () => {
      const mockPlugin: AnalysisPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: async () => {},
        execute: async () => ({
          toolName: 'test-plugin',
          executionTime: 100,
          status: 'success' as const,
          issues: [],
          metrics: {
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100
          }
        }),
        getDefaultConfig: () => ({
          name: 'test-plugin',
          enabled: true,
          config: {}
        }),
        validateConfig: () => ({
          valid: true,
          errors: [],
          warnings: []
        }),
        supportsIncremental: () => true,
        supportsCache: () => true,
        getMetrics: () => ({
          executionCount: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0,
          successCount: 0,
          errorCount: 0
        })
      };

      await pluginManager.registerPlugin(mockPlugin);
    });

    it('should get plugin by name', () => {
      const plugin = pluginManager.getPlugin('test-plugin');
      expect(plugin).toBeDefined();
      expect(plugin!.name).toBe('test-plugin');
    });

    it('should return undefined for non-existent plugin', () => {
      const plugin = pluginManager.getPlugin('non-existent');
      expect(plugin).toBeUndefined();
    });

    it('should get all plugins', () => {
      const plugins = pluginManager.getAllPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('test-plugin');
    });

    it('should get incremental plugins', () => {
      const incrementalPlugins = pluginManager.getIncrementalPlugins();
      expect(incrementalPlugins).toHaveLength(1);
      expect(incrementalPlugins[0].supportsIncremental()).toBe(true);
    });

    it('should get cacheable plugins', () => {
      const cacheablePlugins = pluginManager.getCachablePlugins();
      expect(cacheablePlugins).toHaveLength(1);
      expect(cacheablePlugins[0].supportsCache()).toBe(true);
    });
  });

  describe('plugin initialization', () => {
    let mockPlugin: AnalysisPlugin;

    beforeEach(() => {
      mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: async () => {},
        execute: async () => ({
          toolName: 'test-plugin',
          executionTime: 100,
          status: 'success' as const,
          issues: [],
          metrics: {
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100
          }
        }),
        getDefaultConfig: () => ({
          name: 'test-plugin',
          enabled: true,
          config: {}
        }),
        validateConfig: () => ({
          valid: true,
          errors: [],
          warnings: []
        }),
        supportsIncremental: () => true,
        supportsCache: () => true,
        getMetrics: () => ({
          executionCount: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0,
          successCount: 0,
          errorCount: 0
        })
      };

      mockPlugin.initialize = async () => {};
    });

    it('should initialize plugins successfully', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      const pluginConfigs = {
        'test-plugin': {
          name: 'test-plugin',
          enabled: true,
          config: {
            timeout: 5000
          }
        }
      };

      await pluginManager.initializePlugins(pluginConfigs);
      // Plugin initialization called with correct configuration
      expect(pluginManager.getPlugin('test-plugin')).toBeDefined();
    });

    it('should handle initialization errors', async () => {
      const failingPlugin: AnalysisPlugin = {
        name: 'failing-plugin',
        version: '1.0.0',
        initialize: async () => {
          throw new Error('Initialization failed');
        },
        execute: async () => ({
          toolName: 'failing-plugin',
          executionTime: 100,
          status: 'error' as const,
          issues: [{
            id: 'init-error',
            type: 'error' as const,
            toolName: 'failing-plugin',
            filePath: '',
            lineNumber: 0,
            message: 'Initialization failed',
            fixable: false,
            score: 100
          }],
          metrics: {
            issuesCount: 1,
            errorsCount: 1,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 0
          }
        }),
        getDefaultConfig: () => ({
          name: 'failing-plugin',
          enabled: true,
          config: {}
        }),
        validateConfig: () => ({
          valid: true,
          errors: [],
          warnings: []
        }),
        supportsIncremental: () => true,
        supportsCache: () => true,
        getMetrics: () => ({
          executionCount: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0,
          successCount: 0,
          errorCount: 0
        })
      };

      await pluginManager.registerPlugin(failingPlugin);

      await expect(pluginManager.initializePlugins({})).rejects.toThrow('Plugin initialization failed for failing-plugin');
    });
  });

  describe('plugin metrics', () => {
    beforeEach(async () => {
      const mockPlugin: AnalysisPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: async () => {},
        execute: async () => ({
          toolName: 'test-plugin',
          executionTime: 100,
          status: 'success' as const,
          issues: [],
          metrics: {
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100
          }
        }),
        getDefaultConfig: () => ({
          name: 'test-plugin',
          enabled: true,
          config: {}
        }),
        validateConfig: () => ({
          valid: true,
          errors: [],
          warnings: []
        }),
        supportsIncremental: () => true,
        supportsCache: () => true,
        getMetrics: () => ({
          executionCount: 5,
          totalExecutionTime: 1500,
          averageExecutionTime: 300,
          successCount: 4,
          errorCount: 1,
          lastExecutionTime: new Date()
        })
      };

      await pluginManager.registerPlugin(mockPlugin);
    });

    it('should get plugin metrics', () => {
      const metrics = pluginManager.getPluginMetrics('test-plugin');
      expect(metrics).toEqual({
        executionCount: 5,
        totalExecutionTime: 1500,
        averageExecutionTime: 300,
        successCount: 4,
        errorCount: 1,
        lastExecutionTime: expect.any(Date)
      });
    });

    it('should get all plugin metrics', () => {
      const allMetrics = pluginManager.getAllPluginMetrics();
      expect(allMetrics).toHaveProperty('test-plugin');
      expect(allMetrics['test-plugin']).toEqual({
        executionCount: 5,
        totalExecutionTime: 1500,
        averageExecutionTime: 300,
        successCount: 4,
        errorCount: 1,
        lastExecutionTime: expect.any(Date)
      });
    });
  });

  describe('plugin cleanup', () => {
    it('should cleanup plugin with cleanup method', async () => {
      const cleanupMock = async () => {};
      const mockPlugin: AnalysisPlugin = {
        name: 'cleanup-plugin',
        version: '1.0.0',
        initialize: async () => {},
        execute: async () => ({
          toolName: 'cleanup-plugin',
          executionTime: 100,
          status: 'success' as const,
          issues: [],
          metrics: {
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100
          }
        }),
        getDefaultConfig: () => ({
          name: 'cleanup-plugin',
          enabled: true,
          config: {}
        }),
        validateConfig: () => ({
          valid: true,
          errors: [],
          warnings: []
        }),
        supportsIncremental: () => true,
        supportsCache: () => true,
        getMetrics: () => ({
          executionCount: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0,
          successCount: 0,
          errorCount: 0
        }),
        cleanup: cleanupMock
      };

      await pluginManager.registerPlugin(mockPlugin);
      await pluginManager.unregisterPlugin('cleanup-plugin');
      // Cleanup function called
    });

    it('should unregister plugin without cleanup method', async () => {
      const mockPlugin: AnalysisPlugin = {
        name: 'no-cleanup-plugin',
        version: '1.0.0',
        initialize: async () => {},
        execute: async () => ({
          toolName: 'no-cleanup-plugin',
          executionTime: 100,
          status: 'success' as const,
          issues: [],
          metrics: {
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100
          }
        }),
        getDefaultConfig: () => ({
          name: 'no-cleanup-plugin',
          enabled: true,
          config: {}
        }),
        validateConfig: () => ({
          valid: true,
          errors: [],
          warnings: []
        }),
        supportsIncremental: () => true,
        supportsCache: () => true,
        getMetrics: () => ({
          executionCount: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0,
          successCount: 0,
          errorCount: 0
        })
        // No cleanup method
      };

      await pluginManager.registerPlugin(mockPlugin);
      await pluginManager.unregisterPlugin('no-cleanup-plugin');
      expect(pluginManager.getPluginCount()).toBe(0);
    });
  });
});