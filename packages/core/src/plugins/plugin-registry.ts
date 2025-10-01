import type { AnalysisPlugin, ToolConfiguration, Logger } from './analysis-plugin.js';
import type { ValidationResult } from './analysis-plugin.js';

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license: string;
  keywords: string[];
  category: string;
  supportedLanguages: string[];
  supportedFileTypes: string[];
  dependencies: string[];
  engines: {
    node: string;
    npm?: string;
  };
  compatibility: {
    platforms: string[];
    versions: string[];
  };
  features: {
    incremental: boolean;
    caching: boolean;
    parallel: boolean;
    streaming: boolean;
  };
}

/**
 * Plugin manifest
 */
export interface PluginManifest {
  metadata: PluginMetadata;
  main: string;
  exports?: Record<string, string>;
  scripts?: Record<string, string>;
  config?: ToolConfiguration;
  resources?: {
    schemas: string[];
    templates: string[];
    examples: string[];
  };
}

/**
 * Plugin source
 */
export enum PluginSource {
  BUILTIN = 'builtin',
  NPM = 'npm',
  LOCAL = 'local',
  GIT = 'git'
}

/**
 * Plugin installation info
 */
export interface PluginInstallation {
  source: PluginSource;
  location: string;
  installedAt: Date;
  version: string;
  checksum?: string;
  dependencies: string[];
}

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  manifest: PluginManifest;
  installation: PluginInstallation;
  instance?: AnalysisPlugin;
  enabled: boolean;
  lastUsed?: Date;
  usageCount: number;
  validation: ValidationResult;
}

/**
 * Plugin search filters
 */
export interface PluginSearchFilters {
  category?: string;
  language?: string;
  fileType?: string;
  feature?: string;
  source?: PluginSource;
  query?: string;
}

/**
 * Extensible plugin registry
 */
export class PluginRegistry {
  private plugins = new Map<string, PluginRegistryEntry>();
  private logger: Logger;
  private pluginPaths: string[] = [];

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Register a plugin from manifest
   */
  async registerPlugin(
    manifest: PluginManifest,
    source: PluginSource,
    location: string
  ): Promise<void> {
    const pluginName = manifest.metadata.name;

    if (this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already registered`);
    }

    try {
      // Validate manifest
      this.validateManifest(manifest);

      // Load plugin instance
      const instance = await this.loadPluginInstance(manifest, location);

      // Validate plugin
      const validation = this.validatePlugin(instance);

      // Create registry entry
      const entry: PluginRegistryEntry = {
        manifest,
        installation: {
          source,
          location,
          installedAt: new Date(),
          version: manifest.metadata.version,
          dependencies: manifest.metadata.dependencies
        },
        instance,
        enabled: true,
        usageCount: 0,
        validation
      };

      this.plugins.set(pluginName, entry);
      this.logger.info(`Plugin registered: ${pluginName} v${manifest.metadata.version} from ${source}`);

    } catch (error) {
      this.logger.error(`Failed to register plugin ${pluginName}:`, error);
      throw new Error(`Plugin registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Register a plugin instance directly (for testing)
   */
  registerPluginInstance(
    plugin: AnalysisPlugin,
    source: PluginSource = PluginSource.LOCAL
  ): void {
    const pluginName = plugin.name;

    if (this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already registered`);
    }

    // Create a mock manifest
    const manifest: PluginManifest = {
      metadata: {
        name: plugin.name,
        version: plugin.version,
        description: `Mock plugin ${plugin.name}`,
        author: 'Test',
        license: 'MIT',
        keywords: ['test'],
        category: 'testing',
        supportedLanguages: ['javascript'],
        supportedFileTypes: ['.js'],
        dependencies: plugin.dependencies || [],
        engines: { node: '>=14.0.0' },
        compatibility: { platforms: ['*'], versions: ['*'] },
        features: {
          incremental: plugin.supportsIncremental(),
          caching: plugin.supportsCache(),
          parallel: false,
          streaming: false
        }
      },
      main: 'index.js'
    };

    // Validate plugin
    const validation = this.validatePlugin(plugin);

    // Create registry entry
    const entry: PluginRegistryEntry = {
      manifest,
      installation: {
        source,
        location: 'mock-location',
        installedAt: new Date(),
        version: plugin.version,
        dependencies: plugin.dependencies || []
      },
      instance: plugin,
      enabled: true,
      usageCount: 0,
      validation
    };

    this.plugins.set(pluginName, entry);
    this.logger.info(`Plugin registered: ${pluginName} v${plugin.version} from ${source}`);
  }

  /**
   * Register multiple plugins from directory
   */
  async registerPluginsFromDirectory(
    directory: string,
    source: PluginSource = PluginSource.LOCAL
  ): Promise<void> {
    const { readdir, stat } = await import('fs/promises');
    const { join } = await import('path');

    try {
      const entries = await readdir(directory);

      for (const entry of entries) {
        const entryPath = join(directory, entry);
        const entryStat = await stat(entryPath);

        if (entryStat.isDirectory()) {
          // Look for plugin manifest
          const manifestPath = join(entryPath, 'plugin.json');
          try {
            const manifestContent = await import('fs/promises').then(fs => fs.readFile(manifestPath, 'utf8'));
            const manifest: PluginManifest = JSON.parse(manifestContent);
            await this.registerPlugin(manifest, source, entryPath);
          } catch {
            // No valid manifest found, skip
            continue;
          }
        } else if (entry.endsWith('.plugin.js')) {
          // Direct plugin file
          try {
            const manifest = await this.extractManifestFromFile(entryPath);
            await this.registerPlugin(manifest, source, entryPath);
          } catch {
            continue;
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to register plugins from directory ${directory}:`, error);
    }
  }

  /**
   * Register built-in plugins
   */
  async registerBuiltinPlugins(): Promise<void> {
    const builtinPlugins = [
      'eslint-adapter',
      'prettier-adapter',
      'typescript-adapter',
      'bun-test-adapter'
    ];

    for (const pluginName of builtinPlugins) {
      try {
        const manifest = await this.createBuiltinManifest(pluginName);
        const location = `./plugins/builtin/${pluginName}.js`;
        await this.registerPlugin(manifest, PluginSource.BUILTIN, location);
      } catch (error) {
        this.logger.warn(`Failed to register builtin plugin ${pluginName}:`, error);
      }
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(name: string): Promise<boolean> {
    const entry = this.plugins.get(name);
    if (!entry) {
      return false;
    }

    try {
      // Cleanup plugin instance
      if (entry.instance && entry.instance.cleanup) {
        await entry.instance.cleanup();
      }

      this.plugins.delete(name);
      this.logger.info(`Plugin unregistered: ${name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unregister plugin ${name}:`, error);
      return false;
    }
  }

  /**
   * Get plugin instance
   */
  getPlugin(name: string): AnalysisPlugin | undefined {
    const entry = this.plugins.get(name);
    return entry?.instance;
  }

  /**
   * Get plugin manifest
   */
  getManifest(name: string): PluginManifest | undefined {
    const entry = this.plugins.get(name);
    return entry?.manifest;
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values()).filter(entry => entry.enabled);
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: string): PluginRegistryEntry[] {
    return Array.from(this.plugins.values()).filter(entry =>
      entry.manifest.metadata.category === category
    );
  }

  /**
   * Get plugins that support a language
   */
  getPluginsByLanguage(language: string): PluginRegistryEntry[] {
    return Array.from(this.plugins.values()).filter(entry =>
      entry.manifest.metadata.supportedLanguages.includes(language)
    );
  }

  /**
   * Get plugins that support a file type
   */
  getPluginsByFileType(fileType: string): PluginRegistryEntry[] {
    return Array.from(this.plugins.values()).filter(entry =>
      entry.manifest.metadata.supportedFileTypes.includes(fileType)
    );
  }

  /**
   * Search plugins
   */
  searchPlugins(filters: PluginSearchFilters): PluginRegistryEntry[] {
    return Array.from(this.plugins.values()).filter(entry => {
      const metadata = entry.manifest.metadata;

      // Category filter
      if (filters.category && metadata.category !== filters.category) {
        return false;
      }

      // Language filter
      if (filters.language && !metadata.supportedLanguages.includes(filters.language)) {
        return false;
      }

      // File type filter
      if (filters.fileType && !metadata.supportedFileTypes.includes(filters.fileType)) {
        return false;
      }

      // Feature filter
      if (filters.feature) {
        const hasFeature = metadata.features[filters.feature as keyof typeof metadata.features];
        if (!hasFeature) return false;
      }

      // Source filter
      if (filters.source && entry.installation.source !== filters.source) {
        return false;
      }

      // Query filter
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchText = [
          metadata.name,
          metadata.description,
          ...metadata.keywords,
          metadata.category
        ].join(' ').toLowerCase();

        if (!searchText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Enable/disable a plugin
   */
  setPluginEnabled(name: string, enabled: boolean): boolean {
    const entry = this.plugins.get(name);
    if (!entry) {
      return false;
    }

    entry.enabled = enabled;
    this.logger.info(`Plugin ${name} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Check if a plugin is disabled
   */
  isPluginDisabled(name: string): boolean {
    const entry = this.plugins.get(name);
    if (!entry) {
      return true; // Non-existent plugins are considered disabled
    }
    return !entry.enabled;
  }

  /**
   * Update plugin usage statistics
   */
  recordPluginUsage(name: string): void {
    const entry = this.plugins.get(name);
    if (entry) {
      entry.usageCount++;
      entry.lastUsed = new Date();
    }
  }

  /**
   * Install plugin from npm
   */
  async installPluginFromNpm(packageName: string): Promise<void> {
    this.logger.info(`Installing plugin from npm: ${packageName}`);

    // This would involve npm programmatic API or shell commands
    // For now, we'll simulate the installation
    try {
      // In a real implementation, you would:
      // 1. Run npm install
      // 2. Load plugin manifest
      // 3. Register the plugin

      const manifest = await this.createNpmManifest(packageName);
      const location = `node_modules/${packageName}`;
      await this.registerPlugin(manifest, PluginSource.NPM, location);

      this.logger.info(`Plugin installed successfully: ${packageName}`);
    } catch (error) {
      this.logger.error(`Failed to install plugin ${packageName}:`, error);
      throw error;
    }
  }

  /**
   * Install plugin from git repository
   */
  async installPluginFromGit(repositoryUrl: string): Promise<void> {
    this.logger.info(`Installing plugin from git: ${repositoryUrl}`);

    // This would involve git operations
    // For now, we'll simulate the installation
    try {
      // In a real implementation, you would:
      // 1. Clone the repository
      // 2. Load plugin manifest
      // 3. Register the plugin

      const manifest = await this.createGitManifest(repositoryUrl);
      const location = `./plugins/git/${Date.now()}`;
      await this.registerPlugin(manifest, PluginSource.GIT, location);

      this.logger.info(`Plugin installed successfully from git: ${repositoryUrl}`);
    } catch (error) {
      this.logger.error(`Failed to install plugin from git ${repositoryUrl}:`, error);
      throw error;
    }
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalPlugins: number;
    enabledPlugins: number;
    builtinPlugins: number;
    npmPlugins: number;
    localPlugins: number;
    gitPlugins: number;
    categories: Record<string, number>;
    totalUsage: number;
    mostUsedPlugins: Array<{ name: string; usageCount: number }>;
  } {
    const plugins = Array.from(this.plugins.values());

    const stats = {
      totalPlugins: plugins.length,
      enabledPlugins: plugins.filter(p => p.enabled).length,
      builtinPlugins: plugins.filter(p => p.installation.source === PluginSource.BUILTIN).length,
      npmPlugins: plugins.filter(p => p.installation.source === PluginSource.NPM).length,
      localPlugins: plugins.filter(p => p.installation.source === PluginSource.LOCAL).length,
      gitPlugins: plugins.filter(p => p.installation.source === PluginSource.GIT).length,
      categories: {} as Record<string, number>,
      totalUsage: plugins.reduce((sum, p) => sum + p.usageCount, 0),
      mostUsedPlugins: plugins
        .map(p => ({ name: p.manifest.metadata.name, usageCount: p.usageCount }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10)
    };

    // Count by category
    for (const plugin of plugins) {
      const category = plugin.manifest.metadata.category;
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    }

    return stats;
  }

  /**
   * Validate plugin configuration
   */
  validatePluginConfig(pluginName: string, config: ToolConfiguration): ValidationResult {
    const entry = this.plugins.get(pluginName);
    if (!entry || !entry.instance) {
      return {
        valid: false,
        errors: [`Plugin ${pluginName} not found or not loaded`],
        warnings: []
      };
    }

    return entry.instance.validateConfig(config);
  }

  /**
   * Get plugin configuration schema
   */
  getPluginConfigSchema(pluginName: string): unknown {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      return null;
    }

    // Return schema from manifest if available
    return entry.manifest.config;
  }

  // Private methods

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    const required = ['name', 'version', 'description', 'author', 'license', 'category'];
    for (const field of required) {
      if (!(field in manifest.metadata)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+/.test(manifest.metadata.version)) {
      throw new Error('Invalid version format (expected x.y.z)');
    }

    // Validate category
    const validCategories = ['linting', 'formatting', 'testing', 'security', 'performance', 'coverage', 'build', 'other'];
    if (!validCategories.includes(manifest.metadata.category)) {
      throw new Error(`Invalid category: ${manifest.metadata.category}`);
    }
  }

  /**
   * Load plugin instance
   */
  private async loadPluginInstance(manifest: PluginManifest, location: string): Promise<AnalysisPlugin> {
    try {
      const modulePath = manifest.main.startsWith('./')
        ? `${location}/${manifest.main.slice(2)}`
        : `${location}/${manifest.main}`;

      const module = await import(modulePath);
      const PluginClass = module.default || module.AnalysisPlugin;

      if (!PluginClass) {
        throw new Error(`No default export found in ${modulePath}`);
      }

      return new PluginClass();
    } catch (error) {
      throw new Error(`Failed to load plugin instance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate plugin instance
   */
  private validatePlugin(plugin: AnalysisPlugin): ValidationResult {
    const requiredMethods = ['initialize', 'execute', 'getDefaultConfig', 'validateConfig', 'supportsIncremental', 'supportsCache', 'getMetrics'];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const method of requiredMethods) {
      if (typeof (plugin as any)[method] !== 'function') {
        errors.push(`Missing required method: ${method}`);
      }
    }

    if (typeof plugin.name !== 'string' || !plugin.name) {
      errors.push('Plugin must have a valid name');
    }

    if (typeof plugin.version !== 'string' || !plugin.version) {
      errors.push('Plugin must have a valid version');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Extract manifest from plugin file
   */
  private async extractManifestFromFile(filePath: string): Promise<PluginManifest> {
    // This is a simplified implementation
    // In reality, you'd parse metadata from the plugin file
    const filename = filePath.split('/').pop()?.replace(/\.(js|ts)$/, '') || '';

    return {
      metadata: {
        name: filename,
        version: '1.0.0',
        description: `Plugin extracted from ${filename}`,
        author: 'Unknown',
        license: 'MIT',
        keywords: [],
        category: 'other',
        supportedLanguages: [],
        supportedFileTypes: [],
        dependencies: [],
        engines: { node: '>=14.0.0' },
        compatibility: { platforms: ['*'], versions: ['*'] },
        features: { incremental: false, caching: false, parallel: false, streaming: false }
      },
      main: filePath
    };
  }

  /**
   * Create builtin plugin manifest
   */
  private async createBuiltinManifest(pluginName: string): Promise<PluginManifest> {
    const manifests: Record<string, Partial<PluginManifest>> = {
      'eslint-adapter': {
        metadata: {
          name: 'eslint-adapter',
          version: '1.0.0',
          description: 'ESLint code quality adapter',
          author: 'Dev Quality CLI',
          license: 'MIT',
          keywords: ['eslint', 'linting', 'javascript', 'typescript'],
          category: 'linting',
          supportedLanguages: ['javascript', 'typescript'],
          supportedFileTypes: ['.js', '.jsx', '.ts', '.tsx'],
          dependencies: ['eslint'],
          engines: { node: '>=14.0.0' },
          compatibility: { platforms: ['*'], versions: ['*'] },
          features: { incremental: true, caching: true, parallel: false, streaming: false }
        }
      },
      'prettier-adapter': {
        metadata: {
          name: 'prettier-adapter',
          version: '1.0.0',
          description: 'Prettier code formatting adapter',
          author: 'Dev Quality CLI',
          license: 'MIT',
          keywords: ['prettier', 'formatting', 'code-style'],
          category: 'formatting',
          supportedLanguages: ['javascript', 'typescript', 'json', 'css', 'html'],
          supportedFileTypes: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.html'],
          dependencies: ['prettier'],
          engines: { node: '>=14.0.0' },
          compatibility: { platforms: ['*'], versions: ['*'] },
          features: { incremental: true, caching: true, parallel: false, streaming: false }
        }
      },
      'typescript-adapter': {
        metadata: {
          name: 'typescript-adapter',
          version: '1.0.0',
          description: 'TypeScript compiler adapter',
          author: 'Dev Quality CLI',
          license: 'MIT',
          keywords: ['typescript', 'compiler', 'type-checking'],
          category: 'linting',
          supportedLanguages: ['typescript'],
          supportedFileTypes: ['.ts', '.tsx'],
          dependencies: ['typescript'],
          engines: { node: '>=14.0.0' },
          compatibility: { platforms: ['*'], versions: ['*'] },
          features: { incremental: true, caching: true, parallel: false, streaming: false }
        }
      },
      'bun-test-adapter': {
        metadata: {
          name: 'bun-test-adapter',
          version: '1.0.0',
          description: 'Bun test runner adapter',
          author: 'Dev Quality CLI',
          license: 'MIT',
          keywords: ['bun', 'test', 'testing', 'coverage'],
          category: 'testing',
          supportedLanguages: ['javascript', 'typescript'],
          supportedFileTypes: ['.test.js', '.test.ts', '.spec.js', '.spec.ts'],
          dependencies: ['bun'],
          engines: { node: '>=14.0.0' },
          compatibility: { platforms: ['*'], versions: ['*'] },
          features: { incremental: true, caching: true, parallel: true, streaming: false }
        }
      }
    };

    const baseManifest = manifests[pluginName];
    if (!baseManifest) {
      throw new Error(`Unknown builtin plugin: ${pluginName}`);
    }

    return {
      metadata: baseManifest.metadata as PluginMetadata,
      main: `${pluginName}.js`
    };
  }

  /**
   * Create npm plugin manifest (simulated)
   */
  private async createNpmManifest(packageName: string): Promise<PluginManifest> {
    // This would involve npm API calls to get package info
    return {
      metadata: {
        name: packageName,
        version: '1.0.0',
        description: `NPM plugin: ${packageName}`,
        author: 'NPM Package',
        license: 'MIT',
        keywords: ['npm', 'plugin'],
        category: 'other',
        supportedLanguages: [],
        supportedFileTypes: [],
        dependencies: [packageName],
        engines: { node: '>=14.0.0' },
        compatibility: { platforms: ['*'], versions: ['*'] },
        features: { incremental: false, caching: false, parallel: false, streaming: false }
      },
      main: 'index.js'
    };
  }

  /**
   * Create git plugin manifest (simulated)
   */
  private async createGitManifest(repositoryUrl: string): Promise<PluginManifest> {
    const repoName = repositoryUrl.split('/').pop()?.replace('.git', '') || 'unknown';

    return {
      metadata: {
        name: repoName,
        version: '1.0.0',
        description: `Git plugin: ${repoName}`,
        author: 'Git Repository',
        license: 'MIT',
        keywords: ['git', 'plugin'],
        category: 'other',
        supportedLanguages: [],
        supportedFileTypes: [],
        dependencies: [],
        engines: { node: '>=14.0.0' },
        compatibility: { platforms: ['*'], versions: ['*'] },
        features: { incremental: false, caching: false, parallel: false, streaming: false }
      },
      main: 'index.js'
    };
  }
}