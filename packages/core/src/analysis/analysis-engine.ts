import { EventEmitter } from 'events';
import type {
  AnalysisPlugin,
  AnalysisContext,
  ToolResult,
  AnalysisResult,
  ResultSummary,
  AIPrompt,
  Logger,
  ProjectConfiguration
} from '../plugins/analysis-plugin.js';
import { PluginManager } from '../plugins/plugin-manager.js';
import { PluginSandbox } from '../plugins/plugin-sandbox.js';
import { PluginDependencyResolver } from '../plugins/plugin-dependency-resolver.js';
import type { SandboxConfig } from '../plugins/plugin-sandbox.js';

/**
 * Analysis engine configuration
 */
export interface AnalysisEngineConfig {
  maxConcurrency: number;
  defaultTimeout: number;
  enableCache: boolean;
  sandboxConfig: SandboxConfig;
  progressReportingInterval: number;
  enableIncrementalAnalysis: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
}

/**
 * Analysis engine events
 */
export interface AnalysisEngineEvents {
  'analysis:start': (projectId: string) => void;
  'analysis:progress': (projectId: string, progress: AnalysisProgress) => void;
  'analysis:plugin-start': (projectId: string, pluginName: string) => void;
  'analysis:plugin-complete': (projectId: string, pluginName: string, result: ToolResult) => void;
  'analysis:plugin-error': (projectId: string, pluginName: string, error: Error) => void;
  'analysis:complete': (projectId: string, result: AnalysisResult) => void;
  'analysis:error': (projectId: string, error: Error) => void;
}

/**
 * Analysis progress information
 */
export interface AnalysisProgress {
  totalPlugins: number;
  completedPlugins: number;
  currentPlugin?: string;
  percentage: number;
  estimatedTimeRemaining?: number;
  startTime: Date;
}

/**
 * Main analysis engine for orchestrating quality tools
 */
export class AnalysisEngine extends EventEmitter {
  private config: AnalysisEngineConfig;
  private pluginManager: PluginManager;
  private sandbox: PluginSandbox;
  private dependencyResolver: PluginDependencyResolver;
  private activeAnalyses = new Map<string, { startTime: Date; abortController: AbortController }>();
  private logger: Logger;

  constructor(config: AnalysisEngineConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.pluginManager = new PluginManager(logger);
    this.sandbox = new PluginSandbox(config.sandboxConfig, logger);
    this.dependencyResolver = new PluginDependencyResolver(logger);
  }

  /**
   * Initialize the analysis engine
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Analysis Engine');

    try {
      // The plugin manager will be initialized externally with plugins
      this.logger.info('Analysis Engine initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Analysis Engine:', error);
      throw error;
    }
  }

  /**
   * Execute complete analysis with all registered plugins
   */
  async executeAnalysis(
    projectId: string,
    context: AnalysisContext,
    options: {
      plugins?: string[];
      incremental?: boolean;
      timeout?: number;
      enableCache?: boolean;
    } = {}
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const abortController = new AbortController();

    // Update context with abort signal
    context.signal = abortController.signal;

    // Track active analysis
    this.activeAnalyses.set(projectId, {
      startTime: new Date(),
      abortController
    });

    try {
      this.emit('analysis:start', projectId);
      this.logger.info(`Starting analysis for project: ${projectId}`);

      // Get plugins to execute
      const plugins = this.getPluginsForAnalysis(options.plugins);

      if (plugins.length === 0) {
        throw new Error('No plugins available for analysis');
      }

      // Create analysis progress tracker
      const progress: AnalysisProgress = {
        totalPlugins: plugins.length,
        completedPlugins: 0,
        percentage: 0,
        startTime: new Date()
      };

      // Execute plugins concurrently with dependency resolution
      const results = await this.executePluginsWithDependencies(
        plugins,
        context,
        progress,
        projectId,
        options.incremental || false
      );

      // Aggregate results
      const aggregatedResult = await this.aggregateResults(results, projectId);

      // Create final analysis result
      const analysisResult: AnalysisResult = {
        id: this.generateAnalysisId(),
        projectId,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        overallScore: this.calculateOverallScore(results),
        toolResults: results,
        summary: this.createResultSummary(results),
        aiPrompts: this.generateAIPrompts(results)
      };

      this.emit('analysis:complete', projectId, analysisResult);
      this.logger.info(`Analysis completed for project: ${projectId} in ${analysisResult.duration}ms`);

      return analysisResult;

    } catch (error) {
      const analysisError = error instanceof Error ? error : new Error('Unknown analysis error');
      this.emit('analysis:error', projectId, analysisError);
      this.logger.error(`Analysis failed for project: ${projectId}`, analysisError);
      throw analysisError;
    } finally {
      // Clean up active analysis
      this.activeAnalyses.delete(projectId);
    }
  }

  /**
   * Execute analysis with specific plugins
   */
  async executePluginAnalysis(
    projectId: string,
    pluginNames: string[],
    context: AnalysisContext
  ): Promise<AnalysisResult> {
    return this.executeAnalysis(projectId, context, { plugins: pluginNames });
  }

  /**
   * Cancel an active analysis
   */
  async cancelAnalysis(projectId: string): Promise<void> {
    const activeAnalysis = this.activeAnalyses.get(projectId);
    if (!activeAnalysis) {
      throw new Error(`No active analysis found for project: ${projectId}`);
    }

    activeAnalysis.abortController.abort();
    await this.sandbox.stopAllPlugins();
    this.activeAnalyses.delete(projectId);

    this.logger.info(`Analysis cancelled for project: ${projectId}`);
  }

  /**
   * Get active analyses
   */
  getActiveAnalyses(): string[] {
    return Array.from(this.activeAnalyses.keys());
  }

  /**
   * Get analysis status
   */
  getAnalysisStatus(projectId: string): {
    active: boolean;
    startTime?: Date;
    duration?: number;
  } {
    const activeAnalysis = this.activeAnalyses.get(projectId);

    if (!activeAnalysis) {
      return { active: false };
    }

    return {
      active: true,
      startTime: activeAnalysis.startTime,
      duration: Date.now() - activeAnalysis.startTime.getTime()
    };
  }

  /**
   * Register plugins with the engine
   */
  async registerPlugins(plugins: AnalysisPlugin[]): Promise<void> {
    for (const plugin of plugins) {
      await this.registerPlugin(plugin);
    }
  }

  /**
   * Register a single plugin
   */
  async registerPlugin(plugin: AnalysisPlugin): Promise<void> {
    try {
      // Add to dependency resolver
      this.dependencyResolver.addPlugin(plugin);

      // Register with plugin manager
      await this.pluginManager.registerPlugin(plugin);

      this.logger.info(`Plugin registered: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      this.logger.error(`Failed to register plugin: ${plugin.name}`, error);
      throw error;
    }
  }

  /**
   * Get registered plugins
   */
  getPlugins(): AnalysisPlugin[] {
    return this.pluginManager.getAllPlugins();
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): AnalysisPlugin | undefined {
    return this.pluginManager.getPlugin(name);
  }

  /**
   * Get engine metrics
   */
  getMetrics(): {
    registeredPlugins: number;
    activeAnalyses: number;
    pluginMetrics: Record<string, any>;
    dependencyStats: any;
  } {
    return {
      registeredPlugins: this.pluginManager.getPluginCount(),
      activeAnalyses: this.activeAnalyses.size,
      pluginMetrics: this.pluginManager.getAllPluginMetrics(),
      dependencyStats: this.dependencyResolver.getStatistics()
    };
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<AnalysisEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.sandboxConfig) {
      this.sandbox.updateConfig(newConfig.sandboxConfig);
    }

    this.logger.info('Analysis Engine configuration updated');
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up Analysis Engine');

    // Cancel all active analyses
    const activeAnalyses = Array.from(this.activeAnalyses.keys());
    for (const projectId of activeAnalyses) {
      try {
        await this.cancelAnalysis(projectId);
      } catch (error) {
        this.logger.warn(`Failed to cancel analysis for ${projectId}:`, error);
      }
    }

    // Cleanup plugins
    await this.pluginManager.cleanup();
    await this.sandbox.stopAllPlugins();

    this.removeAllListeners();
    this.logger.info('Analysis Engine cleaned up');
  }

  // Private methods

  /**
   * Get plugins for analysis based on options
   */
  private getPluginsForAnalysis(pluginNames?: string[]): AnalysisPlugin[] {
    if (pluginNames && pluginNames.length > 0) {
      const plugins = pluginNames
        .map(name => this.pluginManager.getPlugin(name))
        .filter(plugin => plugin !== undefined) as AnalysisPlugin[];

      if (plugins.length !== pluginNames.length) {
        const missing = pluginNames.filter(name => !this.pluginManager.hasPlugin(name));
        throw new Error(`Plugins not found: ${missing.join(', ')}`);
      }

      return plugins;
    }

    return this.pluginManager.getAllPlugins();
  }

  /**
   * Execute plugins with dependency resolution
   */
  private async executePluginsWithDependencies(
    plugins: AnalysisPlugin[],
    context: AnalysisContext,
    progress: AnalysisProgress,
    projectId: string,
    incremental: boolean
  ): Promise<ToolResult[]> {
    // Validate dependencies
    const validation = this.dependencyResolver.validateDependencies();
    if (!validation.valid) {
      throw new Error(`Dependency validation failed: ${validation.errors.join(', ')}`);
    }

    // Get execution order
    const executionOrder = this.dependencyResolver.resolveExecutionOrder();
    const parallelGroups = this.dependencyResolver.getParallelGroups();

    const results: ToolResult[] = [];

    for (const group of parallelGroups) {
      const groupPlugins = group
        .map(name => plugins.find(p => p.name === name))
        .filter(plugin => plugin !== undefined) as AnalysisPlugin[];

      if (groupPlugins.length === 0) continue;

      // Execute plugins in this group concurrently
      const groupPromises = groupPlugins.map(plugin =>
        this.executeSinglePlugin(plugin, context, progress, projectId, incremental)
      );

      try {
        const groupResults = await Promise.allSettled(groupPromises);

        for (const result of groupResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            // Handle failed plugin execution
            this.logger.error('Plugin execution failed:', result.reason);
            // Create error result
            const errorResult = this.createErrorResult(result.reason);
            results.push(errorResult);
          }
        }
      } catch (error) {
        this.logger.error('Plugin group execution failed:', error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Execute a single plugin
   */
  private async executeSinglePlugin(
    plugin: AnalysisPlugin,
    context: AnalysisContext,
    progress: AnalysisProgress,
    projectId: string,
    incremental: boolean
  ): Promise<ToolResult> {
    const pluginName = plugin.name;

    try {
      this.emit('analysis:plugin-start', projectId, pluginName);
      progress.currentPlugin = pluginName;

      // Update progress
      progress.completedPlugins++;
      progress.percentage = Math.round((progress.completedPlugins / progress.totalPlugins) * 100);
      this.emit('analysis:progress', projectId, progress);

      // Check if incremental analysis should be used
      if (incremental && plugin.supportsIncremental() && context.changedFiles) {
        const relevantFiles = context.changedFiles.filter(file =>
          this.isPluginRelevantForFile(plugin, file)
        );

        if (relevantFiles.length === 0) {
          // Skip plugin if no relevant files changed
          const emptyResult = await plugin.execute(context);
          this.emit('analysis:plugin-complete', projectId, pluginName, emptyResult);
          return emptyResult;
        }
      }

      // Execute plugin in sandbox
      const result = await this.sandbox.executePlugin(plugin, context, this.config.defaultTimeout);

      this.emit('analysis:plugin-complete', projectId, pluginName, result);
      this.logger.debug(`Plugin ${pluginName} completed successfully`);

      return result;

    } catch (error) {
      const pluginError = error instanceof Error ? error : new Error('Unknown plugin error');
      this.emit('analysis:plugin-error', projectId, pluginName, pluginError);
      this.logger.error(`Plugin ${pluginName} failed:`, pluginError);

      // Return error result instead of throwing
      return this.createErrorResult(pluginError, pluginName);
    }
  }

  /**
   * Check if plugin is relevant for a file
   */
  private isPluginRelevantForFile(plugin: AnalysisPlugin, filePath: string): boolean {
    // This is a simplified check - in reality, you'd have more sophisticated relevance detection
    const extension = filePath.split('.').pop()?.toLowerCase();

    switch (plugin.name) {
      case 'eslint':
        return ['js', 'jsx', 'ts', 'tsx'].includes(extension || '');
      case 'prettier':
        return ['js', 'jsx', 'ts', 'tsx', 'json', 'md', 'css', 'scss', 'html'].includes(extension || '');
      case 'typescript':
        return ['ts', 'tsx'].includes(extension || '');
      case 'bun-test':
        return filePath.includes('.test.') || filePath.includes('.spec.');
      default:
        return true;
    }
  }

  /**
   * Create error result for failed plugin
   */
  private createErrorResult(error: Error, pluginName: string = 'unknown'): ToolResult {
    return {
      toolName: pluginName,
      executionTime: 0,
      status: 'error',
      issues: [{
        id: `plugin-error-${Date.now()}`,
        type: 'error',
        toolName: pluginName,
        filePath: '',
        lineNumber: 0,
        message: error.message,
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
   * Aggregate results from multiple plugins
   */
  private async aggregateResults(results: ToolResult[], projectId: string): Promise<any> {
    // This would be implemented by the ResultAggregator
    // For now, return basic aggregation
    return {
      totalIssues: results.reduce((sum, result) => sum + result.issues.length, 0),
      totalErrors: results.reduce((sum, result) => sum + result.metrics.errorsCount, 0),
      totalWarnings: results.reduce((sum, result) => sum + result.metrics.warningsCount, 0),
      executionOrder: results.map(result => result.toolName)
    };
  }

  /**
   * Calculate overall score from plugin results
   */
  private calculateOverallScore(results: ToolResult[]): number {
    if (results.length === 0) return 100;

    const totalScore = results.reduce((sum, result) => sum + result.metrics.score, 0);
    return Math.round(totalScore / results.length);
  }

  /**
   * Create result summary
   */
  private createResultSummary(results: ToolResult[]): ResultSummary {
    const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
    const totalErrors = results.reduce((sum, result) => sum + result.metrics.errorsCount, 0);
    const totalWarnings = results.reduce((sum, result) => sum + result.metrics.warningsCount, 0);
    const totalFixable = results.reduce((sum, result) => sum + result.metrics.fixableCount, 0);

    return {
      totalIssues,
      totalErrors,
      totalWarnings,
      totalFixable,
      overallScore: this.calculateOverallScore(results),
      toolCount: results.length,
      executionTime: results.reduce((sum, result) => sum + result.executionTime, 0)
    };
  }

  /**
   * Generate AI prompts based on results
   */
  private generateAIPrompts(results: ToolResult[]): AIPrompt[] {
    const prompts: AIPrompt[] = [];

    // Generate prompts for high-priority issues
    const criticalIssues = results
      .flatMap(result => result.issues)
      .filter(issue => issue.type === 'error' && issue.score >= 80)
      .slice(0, 5); // Limit to top 5

    if (criticalIssues.length > 0) {
      prompts.push({
        id: `critical-issues-${Date.now()}`,
        type: 'fix-suggestions',
        title: 'Critical Issues Fix Suggestions',
        description: `Provide fix suggestions for ${criticalIssues.length} critical issues`,
        issues: criticalIssues,
        priority: 'high'
      });
    }

    return prompts;
  }

  /**
   * Generate unique analysis ID
   */
  private generateAnalysisId(): string {
    return `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}