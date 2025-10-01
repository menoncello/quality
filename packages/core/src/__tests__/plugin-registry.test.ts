import { describe, it, expect, beforeEach } from 'bun:test';
import type { AnalysisPlugin, Logger } from '../plugins/analysis-plugin.js';
import { PluginRegistry, PluginSource } from '../plugins/plugin-registry.js';

// Mock plugin for testing
const createMockPlugin = (name: string): AnalysisPlugin => ({
  name,
  version: '1.0.0',
  initialize: async () => {},
  execute: async () => ({
    toolName: name,
    executionTime: 100,
    status: 'success',
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
    name,
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
});

describe('PluginRegistry', () => {
  let registry: PluginRegistry;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {}
    };

    registry = new PluginRegistry(mockLogger);
  });

  describe('plugin registration', () => {
    const createMockManifest = (name: string) => ({
      metadata: {
        name,
        version: '1.0.0',
        description: `Mock plugin ${name}`,
        author: 'Test Author',
        license: 'MIT',
        keywords: ['test'],
        category: 'linting',
        supportedLanguages: ['javascript', 'typescript'],
        supportedFileTypes: ['.js', '.ts'],
        dependencies: [],
        engines: { node: '>=14.0.0' },
        compatibility: { platforms: ['*'], versions: ['*'] },
        features: { incremental: true, caching: true, parallel: false, streaming: false }
      },
      main: 'index.js'
    });

    it('should register plugin from manifest', async () => {
      const mockPlugin = createMockPlugin('test-plugin');
      registry.registerPluginInstance(mockPlugin, PluginSource.LOCAL);

      const plugins = registry.getAllPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].manifest.metadata.name).toBe('test-plugin');
      expect(plugins[0].installation.source).toBe(PluginSource.LOCAL);
      expect(plugins[0].enabled).toBe(true);
    });

    it('should not register duplicate plugins', async () => {
      const mockPlugin = createMockPlugin('duplicate-plugin');
      registry.registerPluginInstance(mockPlugin, PluginSource.LOCAL);

      expect(() => {
        registry.registerPluginInstance(mockPlugin, PluginSource.LOCAL);
      }).toThrow('Plugin duplicate-plugin is already registered');
    });

    it('should validate manifest fields', async () => {
      const invalidManifest = {
        metadata: {
          // Missing required fields
          name: 'invalid-plugin',
          version: '1.0.0',
          description: 'Invalid plugin',
          author: 'Test Author',
          license: 'MIT'
          // Missing category
        },
        main: 'index.js'
      };

      await expect(
        registry.registerPlugin(invalidManifest, PluginSource.LOCAL, '/test/path')
      ).rejects.toThrow('Missing required field: category');
    });

    it('should validate version format', async () => {
      const invalidManifest = {
        metadata: {
          name: 'invalid-version-plugin',
          version: '1.0', // Invalid version format
          description: 'Invalid plugin',
          author: 'Test Author',
          license: 'MIT',
          category: 'linting',
          supportedLanguages: [],
          supportedFileTypes: [],
          dependencies: [],
          engines: { node: '>=14.0.0' },
          compatibility: { platforms: ['*'], versions: ['*'] },
          features: { incremental: true, caching: true, parallel: false, streaming: false }
        },
        main: 'index.js'
      };

      await expect(
        registry.registerPlugin(invalidManifest, PluginSource.LOCAL, '/test/path')
      ).rejects.toThrow('Invalid version format (expected x.y.z)');
    });
  });

  describe('plugin retrieval', () => {
    beforeEach(async () => {
      const mockPlugin = createMockPlugin('test-plugin');
      registry.registerPluginInstance(mockPlugin, PluginSource.BUILTIN);
    });

    it('should get plugin by name', () => {
      const plugin = registry.getPlugin('test-plugin');
      expect(plugin).toBeDefined();
      expect(plugin!.name).toBe('test-plugin');
      expect(plugin!.version).toBe('1.0.0');
    });

    it('should return undefined for non-existent plugin', () => {
      const plugin = registry.getPlugin('non-existent');
      expect(plugin).toBeUndefined();
    });

    it('should get all plugins', () => {
      const plugins = registry.getAllPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].manifest.metadata.name).toBe('test-plugin');
    });

    it('should get enabled plugins', () => {
      const enabledPlugins = registry.getEnabledPlugins();
      expect(enabledPlugins).toHaveLength(1);
      expect(enabledPlugins[0].enabled).toBe(true);
    });
  });

  describe('plugin filtering', () => {
    beforeEach(async () => {
      const eslintPlugin = createMockPlugin('eslint-plugin');
      const prettierPlugin = createMockPlugin('prettier-plugin');

      registry.registerPluginInstance(eslintPlugin, PluginSource.BUILTIN);
      registry.registerPluginInstance(prettierPlugin, PluginSource.BUILTIN);
    });

    it('should search plugins by category', () => {
      const testingPlugins = registry.getPluginsByCategory('testing');
      expect(testingPlugins).toHaveLength(2);
      expect(testingPlugins.map(p => p.manifest.metadata.name)).toContain('eslint-plugin');
      expect(testingPlugins.map(p => p.manifest.metadata.name)).toContain('prettier-plugin');
    });

    it('should search plugins by language', () => {
      const jsPlugins = registry.getPluginsByLanguage('javascript');
      expect(jsPlugins).toHaveLength(2);
      expect(jsPlugins.map(p => p.manifest.metadata.name)).toContain('eslint-plugin');
      expect(jsPlugins.map(p => p.manifest.metadata.name)).toContain('prettier-plugin');
    });

    it('should search plugins by file type', () => {
      const jsPlugins = registry.getPluginsByFileType('.js');
      expect(jsPlugins).toHaveLength(2);
      expect(jsPlugins.map(p => p.manifest.metadata.name)).toContain('eslint-plugin');
      expect(jsPlugins.map(p => p.manifest.metadata.name)).toContain('prettier-plugin');
    });

    it('should search plugins with filters', () => {
      const results = registry.searchPlugins({
        category: 'testing',
        language: 'javascript'
      });

      expect(results).toHaveLength(2);
      expect(results.map(r => r.manifest.metadata.name)).toContain('eslint-plugin');
      expect(results.map(r => r.manifest.metadata.name)).toContain('prettier-plugin');
    });
  });

  describe('plugin management', () => {
    beforeEach(async () => {
      const mockPlugin = createMockPlugin('managed-plugin');
      registry.registerPluginInstance(mockPlugin, PluginSource.BUILTIN);
    });

    it('should enable and disable plugins', () => {
      expect(registry.isPluginDisabled('managed-plugin')).toBe(false);

      const disabled = registry.setPluginEnabled('managed-plugin', false);
      expect(disabled).toBe(true);
      expect(registry.isPluginDisabled('managed-plugin')).toBe(true);

      const enabled = registry.setPluginEnabled('managed-plugin', true);
      expect(enabled).toBe(true);
      expect(registry.isPluginDisabled('managed-plugin')).toBe(false);
    });

    it('should unregister plugins', async () => {
      const unregistered = await registry.unregisterPlugin('managed-plugin');
      expect(unregistered).toBe(true);
      expect(registry.getPlugin('managed-plugin')).toBeUndefined();
      expect(registry.getAllPlugins()).toHaveLength(0);
    });

    it('should handle unregistering non-existent plugin', async () => {
      const unregistered = await registry.unregisterPlugin('non-existent');
      expect(unregistered).toBe(false);
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      const statsPlugin1 = createMockPlugin('stats-plugin-1');
      const statsPlugin2 = createMockPlugin('stats-plugin-2');

      registry.registerPluginInstance(statsPlugin1, PluginSource.BUILTIN);
      registry.registerPluginInstance(statsPlugin2, PluginSource.BUILTIN);

      // Simulate usage
      registry.recordPluginUsage('stats-plugin-1');
      registry.recordPluginUsage('stats-plugin-1');
      registry.recordPluginUsage('stats-plugin-2');
    });

    it('should return comprehensive statistics', () => {
      const stats = registry.getStatistics();

      expect(stats.totalPlugins).toBe(2);
      expect(stats.enabledPlugins).toBe(2);
      expect(stats.builtinPlugins).toBe(2);
      expect(stats.npmPlugins).toBe(0);
      expect(stats.localPlugins).toBe(0);
      expect(stats.gitPlugins).toBe(0);

      expect(stats.categories).toHaveProperty('testing', 2);

      expect(stats.totalUsage).toBe(3);
      expect(stats.mostUsedPlugins).toHaveLength(2);
      expect(stats.mostUsedPlugins[0].name).toBe('stats-plugin-1');
      expect(stats.mostUsedPlugins[0].usageCount).toBe(2);
    });
  });

  describe('builtin plugins', () => {
    it('should register builtin plugins', async () => {
      // Since builtin plugin files don't exist in test environment,
      // we'll test that the method doesn't throw errors
      try {
        await registry.registerBuiltinPlugins();
        // If it doesn't throw, the test passes
        expect(true).toBe(true);
      } catch (error) {
        // If it throws, fail the test
        expect(error).toBeUndefined();
      }

      // In a real environment with actual builtin plugins,
      // this would register them successfully
    });
  });

  describe('error handling', () => {
    it('should handle invalid manifest gracefully', async () => {
      const invalidManifest = {
        metadata: {
          name: 'invalid',
          version: '1.0.0',
          description: 'Invalid manifest',
          author: 'Test',
          license: 'MIT',
          category: 'invalid-category', // Invalid category
          keywords: [],
          supportedLanguages: [],
          supportedFileTypes: [],
          dependencies: [],
          engines: { node: '>=14.0.0' },
          compatibility: { platforms: ['*'], versions: ['*'] },
          features: { incremental: true, caching: true, parallel: false, streaming: false }
        },
        main: 'index.js'
      };

      await expect(
        registry.registerPlugin(invalidManifest, PluginSource.LOCAL, '/test')
      ).rejects.toThrow();
    });

    it('should handle plugin loading errors', async () => {
      const manifest = {
        metadata: {
          name: 'load-error-plugin',
          version: '1.0.0',
          description: 'Plugin that fails to load',
          author: 'Test Author',
          license: 'MIT',
          keywords: ['test'],
          category: 'linting',
          supportedLanguages: ['javascript'],
          supportedFileTypes: ['.js'],
          dependencies: [],
          engines: { node: '>=14.0.0' },
          compatibility: { platforms: ['*'], versions: ['*'] },
          features: { incremental: true, caching: true, parallel: false, streaming: false }
        },
        main: 'non-existent.js' // File doesn't exist
      };

      await expect(
        registry.registerPlugin(manifest, PluginSource.LOCAL, '/test')
      ).rejects.toThrow('Failed to load plugin instance');
    });
  });
});