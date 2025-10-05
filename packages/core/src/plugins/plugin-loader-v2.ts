import type { AnalysisPlugin, Logger } from './analysis-plugin.js';
import type { PluginRegistry, PluginRegistryEntry, PluginManifest } from './plugin-registry.js';
import { PluginSource } from './plugin-registry.js';
import type { PluginLoader as BasePluginLoader } from './plugin-loader.js';

/**
 * Enhanced plugin loading options
 */
export interface PluginLoadingOptions {
  autoUpdate?: boolean;
  checkCompatibility?: boolean;
  validateSignature?: boolean;
  enableCache?: boolean;
  timeout?: number;
  retries?: number;
  fallbackToBuiltin?: boolean;
}

/**
 * Plugin loading result
 */
export interface PluginLoadingResult {
  success: boolean;
  plugin?: AnalysisPlugin;
  entry?: PluginRegistryEntry;
  error?: Error;
  warnings: string[];
  loadingTime: number;
}

/**
 * Enhanced plugin loader with registry integration
 */
export class PluginLoaderV2 {
  private registry: PluginRegistry;
  private logger: Logger;
  private baseLoader: BasePluginLoader | null = null;
  private loadingCache = new Map<string, PluginLoadingResult>();
  private defaultOptions: PluginLoadingOptions = {
    autoUpdate: false,
    checkCompatibility: true,
    validateSignature: false,
    enableCache: true,
    timeout: 30000,
    retries: 3,
    fallbackToBuiltin: true
  };

  constructor(registry: PluginRegistry, logger: Logger) {
    this.registry = registry;
    this.logger = logger;
    this.baseLoader = null;
  }

  /**
   * Initialize the plugin loader
   */
  async init(): Promise<void> {
    const { PluginLoader } = await import('./plugin-loader.js');
    this.baseLoader = new PluginLoader(this.logger);
  }

  /**
   * Load plugin from various sources
   */
  async loadPlugin(
    identifier: string,
    options: PluginLoadingOptions = {}
  ): Promise<PluginLoadingResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    this.logger.debug(`Loading plugin: ${identifier}`);

    // Check cache first
    if (mergedOptions.enableCache && this.loadingCache.has(identifier)) {
      const cached = this.loadingCache.get(identifier);
      this.logger.debug(`Plugin loaded from cache: ${identifier}`);
      return cached as any;
    }

    const result = await this.performPluginLoad(identifier, mergedOptions);
    result.loadingTime = Date.now() - startTime;

    // Cache result
    if (mergedOptions.enableCache && result.success) {
      this.loadingCache.set(identifier, result);
    }

    return result;
  }

  /**
   * Load multiple plugins
   */
  async loadPlugins(
    identifiers: string[],
    options: PluginLoadingOptions = {}
  ): Promise<PluginLoadingResult[]> {
    const results: PluginLoadingResult[] = [];

    // Load plugins concurrently with limited concurrency
    const concurrency = Math.min(5, identifiers.length);
    const chunks = this.chunkArray(identifiers, concurrency);

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(id => this.loadPlugin(id, options))
      );

      for (const promiseResult of chunkResults) {
        if (promiseResult.status === 'fulfilled') {
          results.push(promiseResult.value);
        } else {
          results.push({
            success: false,
            error: promiseResult.reason instanceof Error ? promiseResult.reason : new Error('Unknown error'),
            warnings: [],
            loadingTime: 0
          });
        }
      }
    }

    return results;
  }

  /**
   * Load plugin from npm
   */
  async loadPluginFromNpm(
    packageName: string,
    version?: string,
    options: PluginLoadingOptions = {}
  ): Promise<PluginLoadingResult> {
    const identifier = version ? `${packageName}@${version}` : packageName;

    this.logger.info(`Loading plugin from npm: ${identifier}`);

    try {
      // Check if already installed
      const existingEntry = this.registry.getAllPlugins().find(
        p => p.manifest.metadata.name === packageName
      );

      if (existingEntry?.installation.source === PluginSource.NPM) {
        if (version && existingEntry.installation.version !== version) {
          // Version mismatch, need to update
          await this.updatePlugin(packageName, version);
        }

        return {
          success: true,
          plugin: existingEntry.instance,
          entry: existingEntry,
          warnings: [],
          loadingTime: 0
        };
      }

      // Install from npm
      await this.registry.installPluginFromNpm(identifier);

      const entry = this.registry.getAllPlugins().find(
        p => p.manifest.metadata.name === packageName
      );

      if (!entry) {
        throw new Error(`Plugin not found after installation: ${packageName}`);
      }

      return {
        success: true,
        plugin: entry.instance,
        entry,
        warnings: [],
        loadingTime: 0
      };

    } catch (error) {
      const loadError = error instanceof Error ? error : new Error('Unknown error');

      if (options.fallbackToBuiltin) {
        return this.tryBuiltinFallback(packageName, loadError, options);
      }

      return {
        success: false,
        error: loadError,
        warnings: [],
        loadingTime: 0
      };
    }
  }

  /**
   * Load plugin from git repository
   */
  async loadPluginFromGit(
    repositoryUrl: string,
    branch?: string,
    _options: PluginLoadingOptions = {}
  ): Promise<PluginLoadingResult> {
    const identifier = branch ? `${repositoryUrl}#${branch}` : repositoryUrl;

    this.logger.info(`Loading plugin from git: ${identifier}`);

    try {
      await this.registry.installPluginFromGit(identifier);

      const repoName = repositoryUrl.split('/').pop()?.replace('.git', '') ?? 'unknown';
      const entry = this.registry.getAllPlugins().find(
        p => p.manifest.metadata.name === repoName
      );

      if (!entry) {
        throw new Error(`Plugin not found after installation: ${repoName}`);
      }

      return {
        success: true,
        plugin: entry.instance,
        entry,
        warnings: [],
        loadingTime: 0
      };

    } catch (error) {
      const loadError = error instanceof Error ? error : new Error('Unknown error');

      return {
        success: false,
        error: loadError,
        warnings: [],
        loadingTime: 0
      };
    }
  }

  /**
   * Load plugin from local file system
   */
  async loadPluginFromPath(
    pluginPath: string,
    _options: PluginLoadingOptions = {}
  ): Promise<PluginLoadingResult> {
    this.logger.info(`Loading plugin from path: ${pluginPath}`);

    try {
      // Ensure base loader is initialized
      if (!this.baseLoader) {
        await this.init();
      }

      // Use base loader for local file loading
      const plugin = await this.baseLoader!.loadPlugin(pluginPath);

      // Create minimal manifest for local plugin
      const manifest = await this.createLocalManifest(pluginPath, plugin);

      // Register with registry
      await this.registry.registerPlugin(manifest, PluginSource.LOCAL, pluginPath);

      const entry = this.registry.getAllPlugins().find(
        p => p.manifest.metadata.name === manifest.metadata.name
      );

      return {
        success: true,
        plugin,
        entry,
        warnings: [],
        loadingTime: 0
      };

    } catch (error) {
      const loadError = error instanceof Error ? error : new Error('Unknown error');

      return {
        success: false,
        error: loadError,
        warnings: [],
        loadingTime: 0
      };
    }
  }

  /**
   * Auto-discover and load plugins
   */
  async discoverAndLoadPlugins(
    searchPaths: string[],
    _options: PluginLoadingOptions = {}
  ): Promise<PluginLoadingResult[]> {
    const results: PluginLoadingResult[] = [];

    for (const searchPath of searchPaths) {
      this.logger.debug(`Discovering plugins in: ${searchPath}`);

      try {
        await this.registry.registerPluginsFromDirectory(searchPath, PluginSource.LOCAL);

        const discoveredPlugins = this.registry.getAllPlugins().filter(
          p => p.installation.source === PluginSource.LOCAL && p.installation.location.startsWith(searchPath)
        );

        for (const entry of discoveredPlugins) {
          results.push({
            success: true,
            plugin: entry.instance,
            entry,
            warnings: [],
            loadingTime: 0
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to discover plugins in ${searchPath}:`, error);
      }
    }

    return results;
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginName: string): Promise<boolean> {
    this.logger.info(`Unloading plugin: ${pluginName}`);

    // Remove from cache
    this.loadingCache.delete(pluginName);

    // Unregister from registry
    return await this.registry.unregisterPlugin(pluginName);
  }

  /**
   * Update a plugin
   */
  async updatePlugin(pluginName: string, version?: string): Promise<void> {
    this.logger.info(`Updating plugin: ${pluginName}`);

    const entry = this.registry.getAllPlugins().find(p => p.manifest.metadata.name === pluginName);
    if (!entry) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    switch (entry.installation.source) {
      case PluginSource.NPM: {
        const identifier = version ? `${pluginName}@${version}` : pluginName;
        await this.registry.installPluginFromNpm(identifier);
        break;
      }

      case PluginSource.GIT:
        await this.registry.installPluginFromGit(entry.installation.location);
        break;

      case PluginSource.LOCAL:
        this.logger.warn(`Cannot update local plugin: ${pluginName}`);
        break;

      case PluginSource.BUILTIN:
        this.logger.warn(`Cannot update builtin plugin: ${pluginName}`);
        break;
    }
  }

  /**
   * Get loading statistics
   */
  getLoadingStatistics(): {
    cacheSize: number;
    cacheHitRate: number;
    totalLoadTime: number;
    averageLoadTime: number;
    pluginsBySource: Record<PluginSource, number>;
    recentLoads: Array<{
      identifier: string;
      success: boolean;
      loadingTime: number;
      timestamp: Date;
    }>;
  } {
    const cacheEntries = Array.from(this.loadingCache.values());
    const totalLoadTime = cacheEntries.reduce((sum, entry) => sum + entry.loadingTime, 0);
    const averageLoadTime = cacheEntries.length > 0 ? totalLoadTime / cacheEntries.length : 0;

    const pluginsBySource = {
      [PluginSource.BUILTIN]: 0,
      [PluginSource.NPM]: 0,
      [PluginSource.LOCAL]: 0,
      [PluginSource.GIT]: 0
    };

    for (const entry of this.registry.getAllPlugins()) {
      pluginsBySource[entry.installation.source]++;
    }

    return {
      cacheSize: this.loadingCache.size,
      cacheHitRate: 0, // Would need to track actual hits vs misses
      totalLoadTime,
      averageLoadTime,
      pluginsBySource,
      recentLoads: [] // Would need to track load history
    };
  }

  /**
   * Clear loading cache
   */
  clearCache(): void {
    this.loadingCache.clear();
    this.logger.debug('Plugin loading cache cleared');
  }

  // Private methods

  /**
   * Perform the actual plugin loading
   */
  private async performPluginLoad(
    identifier: string,
    options: PluginLoadingOptions
  ): Promise<PluginLoadingResult> {
    const warnings: string[] = [];

    try {
      // Check if plugin is already loaded
      const existingEntry = this.registry.getAllPlugins().find(
        p => p.manifest.metadata.name === identifier
      );

      if (existingEntry?.instance) {
        return {
          success: true,
          plugin: existingEntry.instance,
          entry: existingEntry,
          warnings,
          loadingTime: 0
        };
      }

      // Determine source and load accordingly
      if (identifier.startsWith('git+')) {
        return await this.loadPluginFromGit(identifier.slice(4), undefined, options);
      } else if (identifier.includes('@') && !identifier.startsWith('.')) {
        // NPM package with version
        return await this.loadPluginFromNpm(identifier, undefined, options);
      } else if (identifier.includes('/') ?? identifier.startsWith('.')) {
        // Local path
        return await this.loadPluginFromPath(identifier, options);
      } else {
        // Try NPM first, then fallback to builtin
        try {
          return await this.loadPluginFromNpm(identifier, undefined, options);
        } catch (npmError) {
          if (options.fallbackToBuiltin) {
            return this.tryBuiltinFallback(identifier, npmError instanceof Error ? npmError : new Error('Unknown error'), options);
          }
          throw npmError;
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        warnings,
        loadingTime: 0
      };
    }
  }

  /**
   * Try to load builtin plugin as fallback
   */
  private async tryBuiltinFallback(
    identifier: string,
    originalError: Error,
    _options: PluginLoadingOptions
  ): Promise<PluginLoadingResult> {
    this.logger.warn(`Failed to load ${identifier}, trying builtin fallback:`, originalError);

    const builtinName = this.getBuiltinEquivalent(identifier);
    if (!builtinName) {
      return {
        success: false,
        error: originalError,
        warnings: [`No builtin equivalent found for ${identifier}`],
        loadingTime: 0
      };
    }

    try {
      const entry = this.registry.getAllPlugins().find(
        p => p.manifest.metadata.name === builtinName
      );

      if (!entry) {
        throw new Error(`Builtin plugin not found: ${builtinName}`);
      }

      return {
        success: true,
        plugin: entry.instance,
        entry,
        warnings: [`Using builtin fallback: ${builtinName} instead of ${identifier}`],
        loadingTime: 0
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: originalError,
        warnings: [
          `Failed to load ${identifier}`,
          `Builtin fallback ${builtinName} also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
        ],
        loadingTime: 0
      };
    }
  }

  /**
   * Get builtin equivalent for external plugin
   */
  private getBuiltinEquivalent(identifier: string): string | null {
    const equivalents: Record<string, string> = {
      'eslint': 'eslint-adapter',
      '@typescript-eslint/cli': 'typescript-adapter',
      'prettier': 'prettier-adapter',
      'typescript': 'typescript-adapter',
      'bun': 'bun-test-adapter'
    };

    const baseName = identifier.split('@')[0].split('/')[0];
    return equivalents[baseName]  || null;
  }

  /**
   * Create manifest for local plugin
   */
  private async createLocalManifest(pluginPath: string, plugin: AnalysisPlugin): Promise<PluginManifest> {
    const path = await import('path');
    const filename = path.basename(pluginPath, path.extname(pluginPath));

    return {
      metadata: {
        name: plugin.name ?? filename,
        version: plugin.version ?? '1.0.0',
        description: `Local plugin: ${filename}`,
        author: 'Local Developer',
        license: 'MIT',
        keywords: [],
        category: 'other',
        supportedLanguages: [],
        supportedFileTypes: [],
        dependencies: plugin.dependencies ?? [],
        engines: { node: '>=14.0.0' },
        compatibility: { platforms: ['*'], versions: ['*'] },
        features: {
          incremental: plugin.supportsIncremental(),
          caching: plugin.supportsCache(),
          parallel: false,
          streaming: false
        }
      },
      main: path.basename(pluginPath)
    };
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}