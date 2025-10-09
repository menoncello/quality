import type { AnalysisPlugin } from './analysis-plugin.js';
import { PluginManager } from './plugin-manager.js';
import type { Logger } from './analysis-plugin.js';

/**
 * Plugin loader for discovering and loading plugins
 */
export class PluginLoader {
  private logger: Logger;
  private loadedPlugins = new Map<string, AnalysisPlugin>();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Load a plugin from a module path
   */
  async loadPlugin(pluginPath: string): Promise<AnalysisPlugin> {
    try {
      const module = await import(pluginPath);
      const PluginClass = module.default ?? module.AnalysisPlugin;

      if (!PluginClass) {
        throw new Error(`No default export found in ${pluginPath}`);
      }

      const plugin = new PluginClass();

      if (!this.isValidPlugin(plugin)) {
        throw new Error(`Invalid plugin: missing required methods or properties`);
      }

      this.loadedPlugins.set(plugin['name'], plugin);
      this.logger.info(`Loaded plugin: ${plugin['name']} v${plugin['version']} from ${pluginPath}`);

      return plugin;
    } catch (error) {
      this.logger.error(`Failed to load plugin from ${pluginPath}:`, error);
      throw new Error(`Plugin loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load multiple plugins from an array of paths
   */
  async loadPlugins(pluginPaths: string[]): Promise<AnalysisPlugin[]> {
    const plugins: AnalysisPlugin[] = [];

    for (const path of pluginPaths) {
      try {
        const plugin = await this.loadPlugin(path);
        plugins.push(plugin);
      } catch (error) {
        this.logger.warn(`Skipping plugin from ${path}:`, error);
        // Continue loading other plugins even if one fails
      }
    }

    this.logger.info(`Loaded ${plugins.length} out of ${pluginPaths.length} plugins`);
    return plugins;
  }

  /**
   * Discover plugins in a directory
   */
  async discoverPlugins(directory: string): Promise<string[]> {
    const { readdir, stat } = await import('fs/promises');
    const { join } = await import('path');

    try {
      const entries = await readdir(directory);
      const pluginPaths: string[] = [];

      for (const entry of entries) {
        const fullPath = join(directory, entry);
        const stats = await stat(fullPath);

        if (stats.isFile() && this.isPluginFile(entry)) {
          pluginPaths.push(fullPath);
        } else if (stats.isDirectory()) {
          // Look for index.js or main.js in subdirectories
          const subDirFiles = await readdir(fullPath);
          const mainFile = subDirFiles.find(file =>
            file === 'index.js'  || file === 'main.js'  || file.endsWith('.js')
          );

          if (mainFile) {
            pluginPaths.push(join(fullPath, mainFile));
          }
        }
      }

      this.logger.info(`Discovered ${pluginPaths.length} potential plugins in ${directory}`);
      return pluginPaths;
    } catch (error) {
      this.logger.error(`Failed to discover plugins in ${directory}:`, error);
      return [];
    }
  }

  /**
   * Load built-in plugins
   */
  async loadBuiltinPlugins(): Promise<AnalysisPlugin[]> {
    const builtinPluginPaths = [
      './builtin/eslint-adapter.js',
      './builtin/prettier-adapter.js',
      './builtin/typescript-adapter.js',
      './builtin/bun-test-adapter.js'
    ];

    return this.loadPlugins(builtinPluginPaths);
  }

  /**
   * Register discovered plugins with the plugin manager
   */
  async registerDiscoveredPlugins(
    pluginManager: PluginManager,
    directory?: string
  ): Promise<void> {
    const plugins: AnalysisPlugin[] = [];

    // Load built-in plugins first
    try {
      const builtinPlugins = await this.loadBuiltinPlugins();
      plugins.push(...builtinPlugins);
    } catch (error) {
      this.logger.warn('Failed to load built-in plugins:', error);
    }

    // Load external plugins if directory is provided
    if (directory) {
      try {
        const discoveredPaths = await this.discoverPlugins(directory);
        const discoveredPlugins = await this.loadPlugins(discoveredPaths);
        plugins.push(...discoveredPlugins);
      } catch (error) {
        this.logger.warn(`Failed to load plugins from ${directory}:`, error);
      }
    }

    // Register all loaded plugins
    if (plugins.length > 0) {
      await pluginManager.registerPlugins(plugins);
      this.logger.info(`Registered ${plugins.length} plugins with plugin manager`);
    } else {
      this.logger.warn('No plugins were loaded or registered');
    }
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): AnalysisPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Check if a plugin is loaded
   */
  isPluginLoaded(name: string): boolean {
    return this.loadedPlugins.has(name);
  }

  /**
   * Get a loaded plugin by name
   */
  getLoadedPlugin(name: string): AnalysisPlugin | undefined {
    return this.loadedPlugins.get(name);
  }

  /**
   * Validate that a plugin implements the required interface
   */
  private isValidPlugin(plugin: unknown): plugin is AnalysisPlugin {
    if (typeof plugin !== 'object'  || plugin === null) {
      return false;
    }

    const p = plugin as Record<string, unknown>;

    return (
      typeof p['name'] === 'string' &&
      typeof p['version'] === 'string' &&
      typeof p['initialize'] === 'function' &&
      typeof p['execute'] === 'function' &&
      typeof p['getDefaultConfig'] === 'function' &&
      typeof p['validateConfig'] === 'function' &&
      typeof p['supportsIncremental'] === 'function' &&
      typeof p['supportsCache'] === 'function' &&
      typeof p['getMetrics'] === 'function'
    );
  }

  /**
   * Check if a file is likely a plugin file
   */
  private isPluginFile(filename: string): boolean {
    return (
      (filename.endsWith('.js') || filename.endsWith('.ts')) ?? filename.endsWith('.mjs')
    );
  }

  /**
   * Cleanup loaded plugins
   */
  async cleanup(): Promise<void> {
    for (const [name, plugin] of this.loadedPlugins) {
      try {
        if (plugin.cleanup) {
          await plugin.cleanup();
        }
      } catch (error) {
        this.logger.warn(`Failed to cleanup plugin ${name}:`, error);
      }
    }

    this.loadedPlugins.clear();
    this.logger.info('Plugin loader cleaned up');
  }
}