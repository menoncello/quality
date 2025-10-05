import type {
  AnalysisContext as BaseAnalysisContext,
  ProjectConfiguration,
  Logger,
  CacheInterface,
  PluginConfig
} from '../plugins/analysis-plugin.js';

// Re-export ProjectConfiguration for use in other modules
export type { ProjectConfiguration } from '../plugins/analysis-plugin.js';

/**
 * Enhanced analysis context with additional management capabilities
 */
export interface EnhancedAnalysisContext extends BaseAnalysisContext {
  sessionId: string;
  analysisId: string;
  startTime: Date;
  metadata: Record<string, unknown>;
  environment: Record<string, string>;
  plugins: Record<string, PluginConfig>;
  cache?: AnalysisCache;
}

/**
 * Context factory configuration
 */
export interface ContextFactoryConfig {
  defaultTimeout: number;
  enableCache: boolean;
  cacheTtl: number;
  maxCacheSize: number;
  environmentVariables: string[];
  metadataDefaults: Record<string, unknown>;
}

/**
 * Context validation result
 */
export interface ContextValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Analysis cache interface with enhanced capabilities
 */
export interface AnalysisCache extends CacheInterface {
  getProjectConfig(projectPath: string): Promise<ProjectConfiguration | null>;
  setProjectConfig(projectPath: string, config: ProjectConfiguration): Promise<void>;
  getPluginResult(pluginName: string, contextHash: string): Promise<unknown>;
  setPluginResult(pluginName: string, contextHash: string, result: unknown): Promise<void>;
  invalidateProject(projectPath: string): Promise<void>;
  getStats(): CacheStats;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

/**
 * Factory for creating and managing analysis contexts
 */
export class AnalysisContextFactory {
  private config: ContextFactoryConfig;
  private logger: Logger;
  private cache?: AnalysisCache;
  private sessionCounter = 0;

  constructor(config: ContextFactoryConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Initialize the context factory
   */
  async initialize(cache?: AnalysisCache): Promise<void> {
    if (cache) {
      this.cache = cache;
    } else if (this.config.enableCache) {
      this.cache = await this.createDefaultCache();
    }

    this.logger.info('Analysis context factory initialized');
  }

  /**
   * Create a new analysis context
   */
  createContext(
    projectPath: string,
    projectConfig: ProjectConfiguration,
    options: {
      changedFiles?: string[];
      metadata?: Record<string, unknown>;
      plugins?: Record<string, PluginConfig>;
      timeout?: number;
      analysisId?: string;
    } = {}
  ): EnhancedAnalysisContext {
    const sessionId = this.generateSessionId();
    const analysisId = options.analysisId ?? this.generateAnalysisId();

    const context: EnhancedAnalysisContext = {
      sessionId,
      analysisId,
      projectPath,
      ...(options.changedFiles && { changedFiles: options.changedFiles }),
      startTime: new Date(),
      metadata: { ...this.config.metadataDefaults, ...options.metadata },
      environment: this.getEnvironmentVariables(),
      plugins: options.plugins ?? {},
      config: projectConfig,
      logger: this.createContextLogger(sessionId, analysisId),
      ...(this.cache && { cache: this.cache })
    };

    this.logger.debug(`Created analysis context: ${analysisId} for project: ${projectPath}`);
    return context;
  }

  /**
   * Create context for incremental analysis
   */
  createIncrementalContext(
    baseContext: EnhancedAnalysisContext,
    changedFiles: string[]
  ): EnhancedAnalysisContext {
    const incrementalContext: EnhancedAnalysisContext = {
      ...baseContext,
      analysisId: this.generateAnalysisId(),
      changedFiles,
      startTime: new Date(),
      metadata: {
        ...baseContext.metadata,
        incremental: true,
        baseAnalysisId: baseContext.analysisId,
        changedFilesCount: changedFiles.length
      }
    };

    this.logger.debug(`Created incremental context: ${incrementalContext.analysisId} with ${changedFiles.length} changed files`);
    return incrementalContext;
  }

  /**
   * Validate analysis context
   */
  validateContext(context: EnhancedAnalysisContext): ContextValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate project path
    if (!context.projectPath || typeof context.projectPath !== 'string') {
      errors.push('Project path is required and must be a string');
    }

    // Validate configuration
    if (!context.config || typeof context.config !== 'object') {
      errors.push('Project configuration is required');
    }

    // Validate changed files if present
    if (context.changedFiles) {
      if (!Array.isArray(context.changedFiles)) {
        errors.push('Changed files must be an array');
      } else {
        for (const file of context.changedFiles) {
          if (typeof file !== 'string') {
            errors.push(`Invalid file path in changed files: ${file}`);
          }
        }
      }
    }

    // Validate metadata
    if (context.metadata && typeof context.metadata !== 'object') {
      warnings.push('Metadata should be an object');
    }

    // Validate plugins configuration
    if (context.plugins && typeof context.plugins !== 'object') {
      warnings.push('Plugins configuration should be an object');
    }

    // Validate environment
    if (context.environment && typeof context.environment !== 'object') {
      warnings.push('Environment should be an object');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Clone context with modifications
   */
  cloneContext(
    context: EnhancedAnalysisContext,
    modifications: Partial<EnhancedAnalysisContext> = {}
  ): EnhancedAnalysisContext {
    const cloned: EnhancedAnalysisContext = {
      ...context,
      ...modifications,
      analysisId: modifications.analysisId ?? this.generateAnalysisId(),
      startTime: new Date(),
      metadata: { ...context.metadata, ...modifications.metadata },
      environment: { ...context.environment, ...modifications.environment },
      plugins: { ...context.plugins, ...modifications.plugins }
    };

    return cloned;
  }

  /**
   * Create context with timeout
   */
  createContextWithTimeout(
    baseContext: EnhancedAnalysisContext,
    timeoutMs: number
  ): EnhancedAnalysisContext {
    const abortController = new AbortController();

    // Set timeout to abort after specified duration
    setTimeout(() => {
      abortController.abort();
    }, timeoutMs);

    return this.cloneContext(baseContext, {
      signal: abortController.signal,
      metadata: {
        ...baseContext.metadata,
        timeout: timeoutMs,
        timeoutSetAt: new Date().toISOString()
      }
    });
  }

  /**
   * Create context for specific plugins
   */
  createContextForPlugins(
    baseContext: EnhancedAnalysisContext,
    pluginNames: string[]
  ): EnhancedAnalysisContext {
    const filteredPlugins: Record<string, PluginConfig> = {};

    for (const pluginName of pluginNames) {
      if (baseContext.plugins[pluginName]) {
        filteredPlugins[pluginName] = baseContext.plugins[pluginName];
      }
    }

    return this.cloneContext(baseContext, {
      plugins: filteredPlugins,
      metadata: {
        ...baseContext.metadata,
        filteredPlugins: pluginNames,
        totalPlugins: pluginNames.length
      }
    });
  }

  /**
   * Get context statistics
   */
  getStatistics(): {
    sessionsCreated: number;
    cacheEnabled: boolean;
    cacheStats?: CacheStats;
  } {
    const stats: {
      sessionsCreated: number;
      cacheEnabled: boolean;
      cacheStats?: CacheStats;
    } = {
      sessionsCreated: this.sessionCounter,
      cacheEnabled: !!this.cache
    };

    if (this.cache) {
      stats.cacheStats = this.cache.getStats();
    }

    return stats;
  }

  /**
   * Cleanup factory resources
   */
  async cleanup(): Promise<void> {
    if (this.cache) {
      // Cache cleanup would go here
      this.logger.debug('Cache cleanup completed');
    }

    this.logger.info('Analysis context factory cleaned up');
  }

  // Private methods

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    this.sessionCounter++;
    return `session-${this.sessionCounter}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique analysis ID
   */
  private generateAnalysisId(): string {
    return `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get environment variables
   */
  private getEnvironmentVariables(): Record<string, string> {
    const env: Record<string, string> = {};

    for (const varName of this.config.environmentVariables) {
      const value = process.env[varName];
      if (value !== undefined) {
        env[varName] = value;
      }
    }

    return env;
  }

  /**
   * Create context-specific logger
   */
  private createContextLogger(sessionId: string, analysisId: string): Logger {
    return {
      error: (message: string, ...args: unknown[]) => {
        this.logger.error(`[${sessionId}:${analysisId}] ${message}`, ...args);
      },
      warn: (message: string, ...args: unknown[]) => {
        this.logger.warn(`[${sessionId}:${analysisId}] ${message}`, ...args);
      },
      info: (message: string, ...args: unknown[]) => {
        this.logger.info(`[${sessionId}:${analysisId}] ${message}`, ...args);
      },
      debug: (message: string, ...args: unknown[]) => {
        this.logger.debug(`[${sessionId}:${analysisId}] ${message}`, ...args);
      }
    };
  }

  /**
   * Create default cache implementation
   */
  private async createDefaultCache(): Promise<AnalysisCache> {
    const { MemoryCache } = await import('./memory-cache.js');
    return new MemoryCache(this.config);
  }
}

/**
 * Context manager for tracking and managing multiple contexts
 */
export class AnalysisContextManager {
  private contexts = new Map<string, EnhancedAnalysisContext>();
  private contextsBySession = new Map<string, EnhancedAnalysisContext[]>();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Register a context
   */
  registerContext(context: EnhancedAnalysisContext): void {
    this.contexts.set(context.analysisId, context);

    const sessionContexts = this.contextsBySession.get(context.sessionId)  ?? [];
    sessionContexts.push(context);
    this.contextsBySession.set(context.sessionId, sessionContexts);

    this.logger.debug(`Registered context: ${context.analysisId} in session: ${context.sessionId}`);
  }

  /**
   * Unregister a context
   */
  unregisterContext(analysisId: string): void {
    const context = this.contexts.get(analysisId);
    if (!context) return;

    this.contexts.delete(analysisId);

    const sessionContexts = this.contextsBySession.get(context.sessionId) ?? [];
    const index = sessionContexts.findIndex(c => c.analysisId === analysisId);
    if (index !== -1) {
      sessionContexts.splice(index, 1);
    }

    if (sessionContexts.length === 0) {
      this.contextsBySession.delete(context.sessionId);
    }

    this.logger.debug(`Unregistered context: ${analysisId}`);
  }

  /**
   * Get context by ID
   */
  getContext(analysisId: string): EnhancedAnalysisContext | undefined {
    return this.contexts.get(analysisId);
  }

  /**
   * Get all contexts for a session
   */
  getSessionContexts(sessionId: string): EnhancedAnalysisContext[] {
    return this.contextsBySession.get(sessionId)  ?? [];
  }

  /**
   * Get all active contexts
   */
  getAllContexts(): EnhancedAnalysisContext[] {
    return Array.from(this.contexts.values());
  }

  /**
   * Clean up old contexts (older than specified duration)
   */
  cleanupOldContexts(maxAge: number = 3600000): number { // 1 hour default
    const cutoffTime = Date.now() - maxAge;
    let cleanedCount = 0;

    for (const [analysisId, context] of this.contexts) {
      if (context.startTime.getTime() < cutoffTime) {
        this.unregisterContext(analysisId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} old contexts`);
    }

    return cleanedCount;
  }

  /**
   * Get manager statistics
   */
  getStatistics(): {
    totalContexts: number;
    totalSessions: number;
    averageContextsPerSession: number;
    oldestContext?: Date;
    newestContext?: Date;
  } {
    const contexts = Array.from(this.contexts.values());
    const sessions = Array.from(this.contextsBySession.keys());

    const stats: {
      totalContexts: number;
      totalSessions: number;
      averageContextsPerSession: number;
      oldestContext?: Date;
      newestContext?: Date;
    } = {
      totalContexts: contexts.length,
      totalSessions: sessions.length,
      averageContextsPerSession: sessions.length > 0 ? contexts.length / sessions.length : 0
    };

    if (contexts.length > 0) {
      const oldest = contexts.reduce((oldest, context) =>
        context.startTime < oldest.startTime ? context : oldest
      );
      const newest = contexts.reduce((newest, context) =>
        context.startTime > newest.startTime ? context : newest
      );
      stats.oldestContext = oldest.startTime;
      stats.newestContext = newest.startTime;
    }

    return stats;
  }

  /**
   * Clear all contexts
   */
  clear(): void {
    this.contexts.clear();
    this.contextsBySession.clear();
    this.logger.info('All contexts cleared');
  }
}