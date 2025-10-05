import type {
  AnalysisPlugin,
  PluginConfig,
  AnalysisContext,
  ToolResult,
  ValidationResult,
  PluginMetrics,
  ToolConfiguration,
  Issue,
  ToolMetrics,
  CoverageData
} from './analysis-plugin.js';

/**
 * Abstract base class for tool adapters
 */
export abstract class BaseToolAdapter implements AnalysisPlugin {
  abstract name: string;
  abstract version: string;

  protected config: PluginConfig | null = null;
  protected metrics: PluginMetrics = {
    executionCount: 0,
    totalExecutionTime: 0,
    averageExecutionTime: 0,
    successCount: 0,
    errorCount: 0
  };

  /**
   * Get default configuration for this tool
   */
  abstract getDefaultConfig(): ToolConfiguration;

  /**
   * Validate tool-specific configuration
   */
  abstract validateConfig(config: ToolConfiguration): ValidationResult;

  /**
   * Execute the tool-specific analysis
   */
  protected abstract executeTool(context: AnalysisContext): Promise<ToolResult>;

  /**
   * Check if tool is available in the environment
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Get tool-specific help information
   */
  abstract getHelp(): string;

  // Plugin interface implementation

  /**
   * Initialize the plugin
   */
  async initialize(config: PluginConfig): Promise<void> {
    this.config = config;

    // Check if tool is available
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(`Tool ${this.name} is not available in the current environment`);
    }

    this.onInitialize();
  }

  /**
   * Execute the plugin
   */
  async execute(context: AnalysisContext): Promise<ToolResult> {
    if (!this.config) {
      throw new Error(`Plugin ${this.name} is not initialized`);
    }

    const startTime = Date.now();

    try {
      context.logger.debug(`Executing tool: ${this.name}`);

      // Validate context
      this.validateContext(context);

      // Execute tool-specific logic
      const result = await this.executeTool(context);

      // Update metrics
      this.updateMetrics(Date.now() - startTime, true);

      context.logger.debug(`Tool ${this.name} completed successfully`);
      return result;

    } catch (error) {
      this.updateMetrics(Date.now() - startTime, false);
      context.logger.error(`Tool ${this.name} failed:`, error);

      // Return error result
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Cleanup plugin resources
   */
  async cleanup(): Promise<void> {
    this.onCleanup();
    this.config = null;
  }

  /**
   * Get plugin metrics
   */
  getMetrics(): PluginMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if tool supports incremental analysis
   */
  supportsIncremental(): boolean {
    return false; // Default implementation
  }

  /**
   * Check if tool supports caching
   */
  supportsCache(): boolean {
    return true; // Default implementation
  }

  // Helper methods

  /**
   * Create a standard tool result
   */
  protected createToolResult(
    issues: Issue[],
    metrics: Partial<ToolMetrics> = {},
    coverage?: CoverageData
  ): ToolResult {
    const totalMetrics: ToolMetrics = {
      issuesCount: issues.length,
      errorsCount: issues.filter(i => i.type === 'error').length,
      warningsCount: issues.filter(i => i.type === 'warning').length,
      infoCount: issues.filter(i => i.type === 'info').length,
      fixableCount: issues.filter(i => i.fixable).length,
      score: this.calculateScore(issues),
      coverage,
      ...metrics
    };

    return {
      toolName: this.name,
      executionTime: 0, // Will be set by the caller
      status: totalMetrics.errorsCount > 0 ? 'error' :
              totalMetrics.warningsCount > 0 ? 'warning' : 'success',
      issues,
      metrics: totalMetrics
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(errorMessage: string): ToolResult {
    return {
      toolName: this.name,
      executionTime: 0,
      status: 'error',
      issues: [{
        id: `error-${Date.now()}`,
        type: 'error',
        toolName: this.name,
        filePath: '',
        lineNumber: 0,
        message: errorMessage,
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
  }

  /**
   * Create an issue object
   */
  protected createIssue(
    type: 'error' | 'warning' | 'info',
    filePath: string,
    lineNumber: number,
    message: string,
    ruleId?: string,
    fixable: boolean = false,
    suggestion?: string
  ): Issue {
    const issue: Issue = {
      id: `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      toolName: this.name,
      filePath,
      lineNumber,
      message,
      fixable,
      score: this.getIssueScore(type)
    };

    if (ruleId) {
      issue.ruleId = ruleId;
    }

    if (suggestion) {
      issue.suggestion = suggestion;
    }

    return issue;
  }

  /**
   * Calculate overall score from issues
   */
  protected calculateScore(issues: Issue[]): number {
    if (issues.length === 0) return 100;

    const totalScore = issues.reduce((sum, issue) => sum + issue.score, 0);
    const maxScore = issues.length * 100;

    return Math.max(0, Math.round(100 - (totalScore / maxScore) * 100));
  }

  /**
   * Get score for a specific issue type
   */
  protected getIssueScore(type: 'error' | 'warning' | 'info'): number {
    switch (type) {
      case 'error': return 100;
      case 'warning': return 50;
      case 'info': return 10;
      default: return 10;
    }
  }

  /**
   * Check if a file should be processed
   */
  protected shouldProcessFile(filePath: string, includePatterns?: string[], excludePatterns?: string[]): boolean {
    const { basename } = require('path');

    // Check include patterns
    if (includePatterns && includePatterns.length > 0) {
      const included = includePatterns.some(pattern =>
        this.matchPattern(filePath, pattern)  || this.matchPattern(basename(filePath), pattern)
      );
      if (!included) return false;
    }

    // Check exclude patterns
    if (excludePatterns && excludePatterns.length > 0) {
      const excluded = excludePatterns.some(pattern =>
        this.matchPattern(filePath, pattern)  || this.matchPattern(basename(filePath), pattern)
      );
      if (excluded) return false;
    }

    return true;
  }

  /**
   * Pattern matching helper (simple glob-like matching)
   */
  private matchPattern(str: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\./g, '\\.');

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(str);
  }

  /**
   * Execute a command safely
   */
  protected async executeCommand(
    command: string,
    args: string[],
    options: { cwd?: string; timeout?: number } = {}
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
      const timeout = options.timeout   ?? 30000;
      const child = spawn(command, args, {
        cwd: options.cwd ?? process.cwd(),
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      const timeoutHandle = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Command timeout after ${timeout}ms`));
      }, timeout);

      child.on('close', (code: number | null) => {
        clearTimeout(timeoutHandle);
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0
        });
      });

      child.on('error', (error: Error) => {
        clearTimeout(timeoutHandle);
        reject(error);
      });
    });
  }

  /**
   * Parse command output to issues (template method)
   */
  protected abstract parseOutput(stdout: string, stderr: string, context: AnalysisContext): Issue[];

  /**
   * Validate execution context
   */
  protected validateContext(context: AnalysisContext): void {
    if (!context.projectPath) {
      throw new Error('Project path is required');
    }

    if (!context.logger) {
      throw new Error('Logger is required');
    }
  }

  /**
   * Update plugin metrics
   */
  private updateMetrics(executionTime: number, success: boolean): void {
    this.metrics.executionCount++;
    this.metrics.totalExecutionTime += executionTime;
    this.metrics.averageExecutionTime = this.metrics.totalExecutionTime / this.metrics.executionCount;
    this.metrics.lastExecutionTime = new Date();

    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }
  }

  // Optional lifecycle hooks

  /**
   * Called after plugin initialization
   */
  protected onInitialize(): void {
    // Override in subclasses if needed
  }

  /**
   * Called before plugin cleanup
   */
  protected onCleanup(): void {
    // Override in subclasses if needed
  }

  /**
   * Get configuration value with default
   */
  protected getConfigValue<T>(key: string, defaultValue: T): T {
    if (!this.config) return defaultValue;
    return (this.config as any)[key]  ?? defaultValue;
  }

  /**
   * Get tool-specific configuration
   */
  protected getToolConfig(): Record<string, unknown> {
    return this.getConfigValue('config', {});
  }

  /**
   * Check if feature is enabled in config
   */
  protected isFeatureEnabled(feature: string, defaultValue: boolean = false): boolean {
    const toolConfig = this.getToolConfig();
    return (toolConfig[feature] as boolean)  || defaultValue;
  }
}