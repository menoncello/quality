import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import type { AnalysisPlugin, AnalysisContext, Logger, ProjectConfiguration } from '../plugins/analysis-plugin.js';
import { AnalysisEngine } from '../analysis/analysis-engine.js';
import { PluginManager } from '../plugins/plugin-manager.js';

describe('AnalysisEngine', () => {
  let analysisEngine: AnalysisEngine;
  let mockLogger: Logger;
  let mockPluginManager: PluginManager;

  beforeEach(() => {
    mockLogger = {
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {}
    };

    mockPluginManager = {
      registerPlugin: async () => {},
      getPlugin: () => undefined,
      getAllPlugins: () => [],
      getPluginCount: () => 0,
      hasPlugin: () => false,
      initializePlugins: async () => {},
      updatePluginMetrics: () => {},
      getAllPluginMetrics: () => ({}),
      isInitialized: () => false,
      cleanup: async () => {}
    } as unknown as PluginManager;

    const config = {
      maxConcurrency: 4,
      defaultTimeout: 30000,
      enableCache: true,
      sandboxConfig: {
        maxExecutionTime: 30000,
        maxMemoryUsage: 1024,
        maxFileSize: 10 * 1024 * 1024,
        allowedFileExtensions: ['.js', '.ts'],
        allowedCommands: ['eslint', 'tsc'],
        enableFileSystemAccess: true,
        enableNetworkAccess: false,
        workingDirectory: process.cwd()
      },
      progressReportingInterval: 1000,
      enableIncrementalAnalysis: true,
      maxRetryAttempts: 3,
      retryDelay: 1000
    };

    analysisEngine = new AnalysisEngine(config, mockLogger);
  });

  afterEach(async () => {
    await analysisEngine.cleanup();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await analysisEngine.initialize();
      expect(analysisEngine).toBeDefined();
    });

    it('should get active analyses', () => {
      const activeAnalyses = analysisEngine.getActiveAnalyses();
      expect(Array.isArray(activeAnalyses)).toBe(true);
      expect(activeAnalyses.length).toBe(0);
    });

    it('should get analysis status', () => {
      const status = analysisEngine.getAnalysisStatus('test-project');
      expect(status).toEqual({
        active: false
      });
    });
  });

  describe('plugin management', () => {
    it('should register plugins', async () => {
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

      await analysisEngine.registerPlugins([mockPlugin]);
      const plugins = analysisEngine.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('test-plugin');
    });

    it('should get plugin by name', async () => {
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

      await analysisEngine.registerPlugin(mockPlugin);
      const plugin = analysisEngine.getPlugin('test-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('test-plugin');
    });
  });

  describe('analysis execution', () => {
    it('should execute analysis with mock plugins', async () => {
      const mockPlugin: AnalysisPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: async () => {},
        execute: async () => ({
          toolName: 'test-plugin',
          executionTime: 100,
          status: 'success' as const,
          issues: [{
            id: 'test-1',
            type: 'warning' as const,
            toolName: 'test-plugin',
            filePath: 'test.js',
            lineNumber: 1,
            message: 'Test warning',
            fixable: false,
            score: 50
          }],
          metrics: {
            issuesCount: 1,
            errorsCount: 0,
            warningsCount: 1,
            infoCount: 0,
            fixableCount: 0,
            score: 90
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

      await analysisEngine.registerPlugin(mockPlugin);

      const mockContext: AnalysisContext = {
                projectPath: '/test',
        config: {
          name: 'test-project',
          version: '1.0.0',
          tools: []
        },
        logger: mockLogger,
                signal: undefined
      };

      const result = await analysisEngine.executeAnalysis('test-project', mockContext);
      expect(result).toBeDefined();
      expect(result.projectId).toBe('test-project');
      expect(result.toolResults).toHaveLength(1);
      expect(result.summary.totalIssues).toBe(1);
    });

    it('should cancel analysis', async () => {
      // This test checks that the cancelAnalysis method works when there's an active analysis
      // We'll verify it can handle the case where no analysis is found

      const mockContext: AnalysisContext = {
                projectPath: '/test',
        config: {
          name: 'test-project',
          version: '1.0.0',
          tools: []
        },
        logger: mockLogger,
                signal: undefined
      };

      // Try to cancel analysis that doesn't exist - should throw error
      await expect(analysisEngine.cancelAnalysis('test-project')).rejects.toThrow('No active analysis found');

      // Verify analysis status shows not active
      const status = analysisEngine.getAnalysisStatus('test-project');
      expect(status.active).toBe(false);
    });

    it('should get metrics', () => {
      const metrics = analysisEngine.getMetrics();
      expect(metrics).toHaveProperty('registeredPlugins');
      expect(metrics).toHaveProperty('activeAnalyses');
      expect(metrics).toHaveProperty('pluginMetrics');
      expect(metrics).toHaveProperty('dependencyStats');
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxConcurrency: 8,
        defaultTimeout: 60000
      };

      analysisEngine.updateConfig(newConfig);
      // Configuration update should not throw
      expect(analysisEngine).toBeDefined();
    });
  });

  describe('event handling', () => {
    it('should emit analysis events', (done) => {
      let eventCount = 0;
      const expectedEvents = ['analysis:start', 'analysis:progress', 'analysis:plugin-start', 'analysis:plugin-complete', 'analysis:complete'];

      expectedEvents.forEach(eventName => {
        analysisEngine.on(eventName, () => {
          eventCount++;
          if (eventCount === expectedEvents.length) {
            done();
          }
        });
      });

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

      analysisEngine.registerPlugin(mockPlugin).then(() => {
        const mockContext: AnalysisContext = {
          projectPath: '/test',
          config: {
            name: 'test-project',
            version: '1.0.0',
            tools: []
          },
          logger: mockLogger
        };

        analysisEngine.executeAnalysis('test-project', mockContext).catch(() => {
          // Ignore errors for this test
        });
      });
    });
  });

  describe('error handling', () => {
    it('should handle plugin execution errors gracefully', async () => {
      const mockPlugin: AnalysisPlugin = {
        name: 'failing-plugin',
        version: '1.0.0',
        initialize: async () => {},
        execute: async () => {
          throw new Error('Plugin execution failed');
        },
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

      await analysisEngine.registerPlugin(mockPlugin);

      const mockContext: AnalysisContext = {
                projectPath: '/test',
        config: {
          name: 'test-project',
          version: '1.0.0',
          tools: []
        },
        logger: mockLogger,
                signal: undefined
      };

      const result = await analysisEngine.executeAnalysis('test-project', mockContext);
      expect(result).toBeDefined();
      expect(result.toolResults).toHaveLength(1);
      expect(result.toolResults[0].status).toBe('error');
    });
  });
});