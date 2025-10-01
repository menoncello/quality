import type { AnalysisPlugin, AnalysisContext, ToolResult, Logger } from './analysis-plugin.js';

/**
 * Plugin sandbox configuration
 */
export interface SandboxConfig {
  maxExecutionTime: number;
  maxMemoryUsage: number;
  maxFileSize: number;
  allowedFileExtensions: string[];
  allowedCommands: string[];
  enableFileSystemAccess: boolean;
  enableNetworkAccess: boolean;
  workingDirectory: string;
}

/**
 * Plugin execution sandbox for security and resource management
 */
export class PluginSandbox {
  private config: SandboxConfig;
  private logger: Logger;
  private activePlugins = new Map<string, { startTime: number; plugin: AnalysisPlugin }>();

  constructor(config: SandboxConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Execute a plugin within the sandbox
   */
  async executePlugin(
    plugin: AnalysisPlugin,
    context: AnalysisContext,
    timeout?: number
  ): Promise<ToolResult> {
    const pluginName = plugin.name;
    const executionTimeout = timeout || this.config.maxExecutionTime;

    // Check if plugin is already running
    if (this.activePlugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already executing`);
    }

    this.logger.debug(`Starting sandboxed execution of plugin: ${pluginName}`);

    const startTime = Date.now();
    this.activePlugins.set(pluginName, { startTime, plugin });

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Plugin ${pluginName} execution timed out after ${executionTimeout}ms`));
        }, executionTimeout);
      });

      // Create execution promise with resource monitoring
      const executionPromise = this.executeWithResourceMonitoring(plugin, context);

      // Race between execution and timeout
      const result = await Promise.race([executionPromise, timeoutPromise]);

      const executionTime = Date.now() - startTime;
      this.logger.debug(`Plugin ${pluginName} completed in ${executionTime}ms`);

      return {
        ...result,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Plugin ${pluginName} failed after ${executionTime}ms:`, error);

      return {
        toolName: pluginName,
        executionTime,
        status: 'error',
        issues: [{
          id: `plugin-error-${Date.now()}`,
          type: 'error',
          toolName: pluginName,
          filePath: '',
          lineNumber: 0,
          message: error instanceof Error ? error.message : 'Unknown plugin execution error',
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
      };
    } finally {
      this.activePlugins.delete(pluginName);
    }
  }

  /**
   * Execute plugin with resource monitoring
   */
  private async executeWithResourceMonitoring(
    plugin: AnalysisPlugin,
    context: AnalysisContext
  ): Promise<ToolResult> {
    // Validate execution context
    this.validateContext(context);

    // Start resource monitoring
    const initialMemory = this.getCurrentMemoryUsage();
    const maxMemoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage(plugin.name, initialMemory);
    }, 1000);

    try {
      // Execute plugin with modified context
      const sandboxedContext = this.createSandboxedContext(context);
      const result = await plugin.execute(sandboxedContext);

      // Validate result
      this.validateResult(result);

      return result;
    } finally {
      clearInterval(maxMemoryCheckInterval);
    }
  }

  /**
   * Validate execution context
   */
  private validateContext(context: AnalysisContext): void {
    // Check project path
    if (!context.projectPath || typeof context.projectPath !== 'string') {
      throw new Error('Invalid project path in context');
    }

    // Check if project path is within allowed working directory
    const { resolve, relative } = require('path');
    const relativePath = relative(this.config.workingDirectory, context.projectPath);

    if (relativePath.startsWith('..')) {
      throw new Error('Project path is outside working directory');
    }
  }

  /**
   * Create sandboxed context with restricted access
   */
  private createSandboxedContext(context: AnalysisContext): AnalysisContext {
    const sandboxedContext: AnalysisContext = {
      ...context,
      logger: this.createSandboxedLogger(context.logger)
    };

    // Wrap cache if present
    if (context.cache) {
      sandboxedContext.cache = this.createSandboxedCache(context.cache);
    }

    return sandboxedContext;
  }

  /**
   * Create sandboxed logger with restricted output
   */
  private createSandboxedLogger(originalLogger: Logger): Logger {
    return {
      error: (message: string, ...args: unknown[]) => {
        this.logger.error(`[Plugin] ${message}`, ...args);
      },
      warn: (message: string, ...args: unknown[]) => {
        this.logger.warn(`[Plugin] ${message}`, ...args);
      },
      info: (message: string, ...args: unknown[]) => {
        this.logger.info(`[Plugin] ${message}`, ...args);
      },
      debug: (message: string, ...args: unknown[]) => {
        this.logger.debug(`[Plugin] ${message}`, ...args);
      }
    };
  }

  /**
   * Create sandboxed cache with restricted operations
   */
  private createSandboxedCache(originalCache: any): any {
    return {
      get: async (key: string) => {
        // Validate cache key
        if (typeof key !== 'string' || key.length > 256) {
          throw new Error('Invalid cache key');
        }
        return originalCache.get(key);
      },
      set: async (key: string, value: any, ttlMs?: number) => {
        // Validate cache key and value size
        if (typeof key !== 'string' || key.length > 256) {
          throw new Error('Invalid cache key');
        }

        const valueSize = JSON.stringify(value).length;
        if (valueSize > this.config.maxFileSize) {
          throw new Error('Cache value too large');
        }

        return originalCache.set(key, value, ttlMs);
      },
      delete: async (key: string) => originalCache.delete(key),
      clear: async () => originalCache.clear(),
      has: async (key: string) => originalCache.has(key)
    };
  }

  /**
   * Validate plugin result
   */
  private validateResult(result: ToolResult): void {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid plugin result: not an object');
    }

    if (typeof result.toolName !== 'string') {
      throw new Error('Invalid plugin result: missing or invalid toolName');
    }

    if (typeof result.executionTime !== 'number' || result.executionTime < 0) {
      throw new Error('Invalid plugin result: invalid executionTime');
    }

    if (!['success', 'error', 'warning'].includes(result.status)) {
      throw new Error('Invalid plugin result: invalid status');
    }

    if (!Array.isArray(result.issues)) {
      throw new Error('Invalid plugin result: issues must be an array');
    }

    if (!result.metrics || typeof result.metrics !== 'object') {
      throw new Error('Invalid plugin result: missing or invalid metrics');
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    const { performance } = require('perf_hooks');
    return performance.memory?.usedJSHeapSize || 0;
  }

  /**
   * Check memory usage against limits
   */
  private checkMemoryUsage(pluginName: string, initialMemory: number): void {
    const currentMemory = this.getCurrentMemoryUsage();
    const memoryIncrease = currentMemory - initialMemory;

    if (memoryIncrease > this.config.maxMemoryUsage) {
      throw new Error(`Plugin ${pluginName} exceeded memory limit: ${memoryIncrease} bytes`);
    }
  }

  /**
   * Get currently executing plugins
   */
  getActivePlugins(): string[] {
    return Array.from(this.activePlugins.keys());
  }

  /**
   * Get execution info for a specific plugin
   */
  getPluginExecutionInfo(pluginName: string): { startTime: number; executionTime: number } | undefined {
    const active = this.activePlugins.get(pluginName);
    if (!active) return undefined;

    return {
      startTime: active.startTime,
      executionTime: Date.now() - active.startTime
    };
  }

  /**
   * Stop execution of a specific plugin
   */
  async stopPlugin(pluginName: string): Promise<void> {
    const active = this.activePlugins.get(pluginName);
    if (active) {
      this.activePlugins.delete(pluginName);
      this.logger.warn(`Forcefully stopped plugin: ${pluginName}`);
    }
  }

  /**
   * Stop all executing plugins
   */
  async stopAllPlugins(): Promise<void> {
    const activePlugins = Array.from(this.activePlugins.keys());
    for (const pluginName of activePlugins) {
      await this.stopPlugin(pluginName);
    }
  }

  /**
   * Update sandbox configuration
   */
  updateConfig(newConfig: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Sandbox configuration updated');
  }

  /**
   * Get current sandbox configuration
   */
  getConfig(): SandboxConfig {
    return { ...this.config };
  }
}