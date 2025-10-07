import type {
  AnalysisPlugin,
  PluginConfig,
  PluginMetrics,
  Logger,
  ToolConfiguration
} from './analysis-plugin.js';

/**
 * Plugin manager for handling plugin lifecycle and coordination
 */
export class PluginManager {
  private plugins = new Map<string, AnalysisPlugin>();
  private pluginMetrics = new Map<string, PluginMetrics>();
  private initialized = false;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Register a plugin with the manager
   */
  async registerPlugin(plugin: AnalysisPlugin, _config?: PluginConfig): Promise<void> {
    const pluginName = plugin.name;

    if (this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already registered`);
    }

    // Validate plugin dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin ${pluginName} depends on missing plugin: ${dep}`);
        }
      }
    }

    this.plugins.set(pluginName, plugin);
    this.pluginMetrics.set(pluginName, {
      executionCount: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      successCount: 0,
      errorCount: 0
    });

    this.logger.info(`Plugin ${pluginName} v${plugin.version} registered`);
  }

  /**
   * Register multiple plugins
   */
  async registerPlugins(plugins: AnalysisPlugin[]): Promise<void> {
    for (const plugin of plugins) {
      await this.registerPlugin(plugin);
    }
  }

  /**
   * Initialize all registered plugins
   */
  async initializePlugins(pluginConfigs: Record<string, PluginConfig>): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Plugin manager is already initialized');
      return;
    }

    for (const [name, plugin] of this.plugins) {
      try {
        const toolConfig = (pluginConfigs[name]  || plugin.getDefaultConfig()) as unknown as ToolConfiguration;
        const validation = plugin.validateConfig(toolConfig);

        if (!validation.valid) {
          throw new Error(`Plugin configuration validation failed: ${validation.errors.join(', ')}`);
        }

        if (validation.warnings.length > 0) {
          this.logger.warn(`Plugin ${name} configuration warnings: ${validation.warnings.join(', ')}`);
        }

        // Convert ToolConfiguration to PluginConfig for initialize
        const pluginConfig = {
          enabled: toolConfig.enabled,
          timeout: this.getConfigValue(toolConfig, 'timeout', 30000) as number,
          cacheEnabled: this.getConfigValue(toolConfig, 'cacheEnabled', true) as boolean,
          logLevel: this.getConfigValue(toolConfig, 'logLevel', 'info') as 'error' | 'warn' | 'info' | 'debug',
          ...(toolConfig.config)
        };

        await plugin.initialize(pluginConfig);
        this.logger.info(`Plugin ${name} initialized successfully`);
      } catch (error) {
        this.logger.error(`Failed to initialize plugin ${name}:`, error);
        throw new Error(`Plugin initialization failed for ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    this.initialized = true;
    this.logger.info(`All ${this.plugins.size} plugins initialized`);
  }

  /**
   * Get a registered plugin by name
   */
  getPlugin(name: string): AnalysisPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): AnalysisPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins that support incremental analysis
   */
  getIncrementalPlugins(): AnalysisPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.supportsIncremental());
  }

  /**
   * Get plugins that support caching
   */
  getCachablePlugins(): AnalysisPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.supportsCache());
  }

  /**
   * Get metrics for a specific plugin
   */
  getPluginMetrics(name: string): PluginMetrics | undefined {
    const plugin = this.plugins.get(name);
    if (plugin?.getMetrics) {
      return plugin.getMetrics();
    }
    return this.pluginMetrics.get(name);
  }

  /**
   * Get metrics for all plugins
   */
  getAllPluginMetrics(): Record<string, PluginMetrics> {
    const result: Record<string, PluginMetrics> = {};

    for (const [name, plugin] of this.plugins) {
      if (plugin.getMetrics) {
        result[name] = plugin.getMetrics();
      } else {
        const internalMetrics = this.pluginMetrics.get(name);
        if (internalMetrics) {
          result[name] = internalMetrics;
        }
      }
    }

    return result;
  }

  /**
   * Update plugin metrics after execution
   */
  updatePluginMetrics(name: string, executionTime: number, success: boolean): void {
    const metrics = this.pluginMetrics.get(name);
    if (!metrics) return;

    metrics.executionCount++;
    metrics.totalExecutionTime += executionTime;
    metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.executionCount;
    metrics.lastExecutionTime = new Date();

    if (success) {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }
  }

  /**
   * Check if plugin manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get plugin count
   */
  getPluginCount(): number {
    return this.plugins.size;
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} is not registered`);
    }

    try {
      // Cleanup plugin if it supports it
      if (plugin.cleanup) {
        await plugin.cleanup();
      }
    } catch (error) {
      this.logger.warn(`Failed to cleanup plugin ${name}:`, error);
    }

    this.plugins.delete(name);
    this.pluginMetrics.delete(name);
    this.logger.info(`Plugin ${name} unregistered`);
  }

  /**
   * Unregister all plugins and cleanup
   */
  async cleanup(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    for (const [name, plugin] of this.plugins) {
      try {
        if (plugin.cleanup) {
          await plugin.cleanup();
        }
      } catch (error) {
        this.logger.warn(`Failed to cleanup plugin ${name}:`, error);
      }
    }

    this.plugins.clear();
    this.pluginMetrics.clear();
    this.initialized = false;
    this.logger.info('Plugin manager cleaned up');
  }

  /**
   * Helper method to get configuration value from ToolConfiguration
   */
  private getConfigValue(toolConfig: ToolConfiguration, key: string, defaultValue: unknown): unknown{
    if (toolConfig.config && typeof toolConfig.config === 'object') {
      return (toolConfig.config)[key]  ?? defaultValue;
    }
    return defaultValue;
  }
}