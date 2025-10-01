import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import type { AnalysisPlugin, Logger } from '../plugins/analysis-plugin.js';
import { PluginManager } from '../plugins/plugin-manager.js';

describe('Plugin Lifecycle Management', () => {
  let pluginManager: PluginManager;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      error: (msg: string) => console.error(`[ERROR] ${msg}`),
      warn: (msg: string) => console.warn(`[WARN] ${msg}`),
      info: (msg: string) => console.info(`[INFO] ${msg}`),
      debug: (msg: string) => console.debug(`[DEBUG] ${msg}`)
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
      expect(pluginManager.getPluginCount()).toBe(0);
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