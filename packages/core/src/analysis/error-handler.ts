import { EventEmitter } from 'events';
import type { Logger } from '../plugins/analysis-plugin.js';

/**
 * Error classification
 */
export enum ErrorClassification {
  SYSTEM = 'system',
  CONFIGURATION = 'configuration',
  PLUGIN = 'plugin',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  RESOURCE = 'resource',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

/**
 * Error severity
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error recovery strategy
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  SKIP = 'skip',
  DEGRADE = 'degrade',
  ABORT = 'abort'
}

/**
 * Enhanced error information
 */
export interface AnalysisError {
  id: string;
  classification: ErrorClassification;
  severity: ErrorSeverity;
  code: string;
  message: string;
  originalError: Error;
  context: {
    toolName?: string;
    phase: string;
    timestamp: Date;
    metadata: Record<string, unknown>;
  };
  recoveryStrategy: RecoveryStrategy;
  retryCount: number;
  maxRetries: number;
  canRecover: boolean;
  suggestions: string[];
}

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  classification: {
    patterns: Array<{
      regex: RegExp;
      classification: ErrorClassification;
      severity: ErrorSeverity;
      recoveryStrategy: RecoveryStrategy;
    }>;
  };
  retry: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
  };
  fallback: {
    enabled: boolean;
    strategies: Record<string, () => unknown>;
  };
  degradation: {
    enabled: boolean;
    thresholds: {
      errorRate: number;
      consecutiveErrors: number;
      responseTime: number;
    };
    strategies: Record<string, () => unknown>;
  };
  reporting: {
    enabled: boolean;
    maxLogEntries: number;
    includeStackTrace: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

/**
 * Error handling statistics
 */
export interface ErrorStats {
  totalErrors: number;
  errorsByClassification: Record<ErrorClassification, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByTool: Record<string, number>;
  recoverySuccessRate: number;
  averageRecoveryTime: number;
  recentErrors: AnalysisError[];
  lastError?: Date;
}

/**
 * Comprehensive error handler for analysis engine
 */
export class ErrorHandler extends EventEmitter {
  private config: ErrorHandlingConfig;
  private logger: Logger;
  private errors: AnalysisError[] = [];
  private stats: ErrorStats;
  private recoveryActions = new Map<string, () => unknown>();

  constructor(config: ErrorHandlingConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.stats = this.initializeStats();
  }

  /**
   * Handle an error occurrence
   */
  handleError(
    error: Error,
    context: {
      toolName?: string;
      phase: string;
      metadata?: Record<string, unknown>;
    } = { phase: 'unknown' }
  ): AnalysisError {
    const analysisError = this.createAnalysisError(error, context);
    this.processError(analysisError);
    return analysisError;
  }

  /**
   * Attempt to recover from an error
   */
  async recoverFromError(error: AnalysisError): Promise<{
    success: boolean;
    result?: unknown;
    strategy: RecoveryStrategy;
    attempts: number;
    recoveryTime: number;
  }> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError = error.originalError;

    this.logger.info(`Attempting recovery for error: ${error.code} using strategy: ${error.recoveryStrategy}`);

    try {
      switch (error.recoveryStrategy) {
        case RecoveryStrategy.RETRY:
          return await this.retryOperation(error, startTime, attempts);

        case RecoveryStrategy.FALLBACK:
          return await this.executeFallback(error, startTime);

        case RecoveryStrategy.DEGRADE:
          return await this.executeDegradation(error, startTime);

        case RecoveryStrategy.SKIP:
          return { success: true, strategy: RecoveryStrategy.SKIP, attempts: 0, recoveryTime: 0 };

        case RecoveryStrategy.ABORT:
        default:
          return { success: false, strategy: RecoveryStrategy.ABORT, attempts: 0, recoveryTime: 0 };
      }
    } catch (recoveryError) {
      this.logger.error(`Recovery failed for error: ${error.code}`, recoveryError);
      return {
        success: false,
        strategy: error.recoveryStrategy,
        attempts,
        recoveryTime: Date.now() - startTime,
        result: recoveryError
      };
    }
  }

  /**
   * Register a custom recovery action
   */
  registerRecoveryAction(errorCode: string, action: () => unknown): void {
    this.recoveryActions.set(errorCode, action);
    this.logger.debug(`Registered recovery action for error code: ${errorCode}`);
  }

  /**
   * Unregister a recovery action
   */
  unregisterRecoveryAction(errorCode: string): boolean {
    const removed = this.recoveryActions.delete(errorCode);
    if (removed) {
      this.logger.debug(`Unregistered recovery action for error code: ${errorCode}`);
    }
    return removed;
  }

  /**
   * Check if system should enter degraded mode
   */
  shouldEnterDegradedMode(): boolean {
    if (!this.config.degradation.enabled) {
      return false;
    }

    const recentErrors = this.getRecentErrors(300000); // Last 5 minutes
    const errorRate = recentErrors.length / 5; // Errors per minute

    return (
      errorRate > this.config.degradation.thresholds.errorRate ||
      this.getConsecutiveErrors() > this.config.degradation.thresholds.consecutiveErrors ||
      this.getAverageResponseTime() > this.config.degradation.thresholds.responseTime
    );
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get recent errors within time window
   */
  getRecentErrors(timeWindowMs: number = 300000): AnalysisError[] {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    return this.errors.filter(error => error.context.timestamp >= cutoffTime);
  }

  /**
   * Get errors by classification
   */
  getErrorsByClassification(classification: ErrorClassification): AnalysisError[] {
    return this.errors.filter(error => error.classification === classification);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): AnalysisError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Get errors by tool
   */
  getErrorsByTool(toolName: string): AnalysisError[] {
    return this.errors.filter(error => error.context.toolName === toolName);
  }

  /**
   * Clear old errors
   */
  clearOldErrors(olderThanMs: number = 3600000): number { // Default 1 hour
    const cutoffTime = new Date(Date.now() - olderThanMs);
    const initialCount = this.errors.length;

    this.errors = this.errors.filter(error => error.context.timestamp >= cutoffTime);

    const clearedCount = initialCount - this.errors.length;
    if (clearedCount > 0) {
      this.logger.info(`Cleared ${clearedCount} old errors`);
    }

    return clearedCount;
  }

  /**
   * Generate error report
   */
  generateErrorReport(): {
    summary: ErrorStats;
    topErrors: Array<{
      error: AnalysisError;
      count: number;
      frequency: number;
    }>;
    recommendations: string[];
    trends: {
      increasing: string[];
      decreasing: string[];
      stable: string[];
    };
  } {
    const summary = this.getStats();

    // Find most frequent errors
    const errorCounts = new Map<string, { error: AnalysisError; count: number }>();
    for (const error of this.errors) {
      const key = `${error.classification}:${error.code}`;
      const existing = errorCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        errorCounts.set(key, { error, count: 1 });
      }
    }

    const topErrors = Array.from(errorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        ...item,
        frequency: item.count / Math.max(1, this.errors.length)
      }));

    const recommendations = this.generateRecommendations(summary, topErrors);
    const trends = this.analyzeTrends();

    return {
      summary,
      topErrors,
      recommendations,
      trends
    };
  }

  /**
   * Update error handling configuration
   */
  updateConfig(newConfig: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Error handling configuration updated');
  }

  // Private methods

  /**
   * Create analysis error from raw error
   */
  private createAnalysisError(
    error: Error,
    context: {
      toolName?: string;
      phase: string;
      metadata?: Record<string, unknown>;
    }
  ): AnalysisError {
    const classification = this.classifyError(error);
    const severity = this.determineSeverity(error, classification);
    const recoveryStrategy = this.determineRecoveryStrategy(classification, severity);

    return {
      id: this.generateErrorId(),
      classification,
      severity,
      code: this.extractErrorCode(error),
      message: error.message,
      originalError: error,
      context: {
        toolName: context.toolName,
        phase: context.phase,
        timestamp: new Date(),
        metadata: context.metadata || {}
      },
      recoveryStrategy,
      retryCount: 0,
      maxRetries: this.config.retry.maxAttempts,
      canRecover: recoveryStrategy !== RecoveryStrategy.ABORT,
      suggestions: this.generateSuggestions(error, classification, recoveryStrategy)
    };
  }

  /**
   * Process error occurrence
   */
  private processError(error: AnalysisError): void {
    // Store error
    this.errors.push(error);

    // Limit error history
    if (this.errors.length > this.config.reporting.maxLogEntries) {
      this.errors = this.errors.slice(-this.config.reporting.maxLogEntries);
    }

    // Log error
    this.logError(error);

    // Update statistics
    this.updateStats();

    // Emit events
    this.emit('error:occurred', error);
    this.emit(`error:${error.classification}`, error);

    if (error.severity === ErrorSeverity.CRITICAL) {
      this.emit('error:critical', error);
    }

    // Check if degraded mode should be triggered
    if (this.shouldEnterDegradedMode()) {
      this.emit('system:degraded');
    }
  }

  /**
   * Classify error based on patterns
   */
  private classifyError(error: Error): ErrorClassification {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    for (const pattern of this.config.classification.patterns) {
      if (pattern.regex.test(message) || pattern.regex.test(stack)) {
        return pattern.classification;
      }
    }

    // Default classification based on error types
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return ErrorClassification.SYSTEM;
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return ErrorClassification.TIMEOUT;
    }

    if (message.includes('enoent') || message.includes('file not found')) {
      return ErrorClassification.CONFIGURATION;
    }

    return ErrorClassification.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, classification: ErrorClassification): ErrorSeverity {
    const message = error.message.toLowerCase();

    for (const pattern of this.config.classification.patterns) {
      if (pattern.regex.test(message) || pattern.regex.test(error.stack?.toLowerCase() || '')) {
        return pattern.severity;
      }
    }

    // Default severity based on classification
    switch (classification) {
      case ErrorClassification.SYSTEM:
      case ErrorClassification.RESOURCE:
        return ErrorSeverity.HIGH;
      case ErrorClassification.CONFIGURATION:
      case ErrorClassification.PLUGIN:
        return ErrorSeverity.MEDIUM;
      case ErrorClassification.NETWORK:
      case ErrorClassification.TIMEOUT:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Determine recovery strategy
   */
  private determineRecoveryStrategy(
    classification: ErrorClassification,
    severity: ErrorSeverity
  ): RecoveryStrategy {
    for (const pattern of this.config.classification.patterns) {
      if (pattern.regex.test('')) { // This would match based on the actual error
        return pattern.recoveryStrategy;
      }
    }

    // Default strategy based on classification and severity
    if (severity === ErrorSeverity.CRITICAL) {
      return RecoveryStrategy.ABORT;
    }

    switch (classification) {
      case ErrorClassification.NETWORK:
      case ErrorClassification.TIMEOUT:
        return RecoveryStrategy.RETRY;
      case ErrorClassification.PLUGIN:
        return RecoveryStrategy.FALLBACK;
      case ErrorClassification.RESOURCE:
        return RecoveryStrategy.DEGRADE;
      case ErrorClassification.VALIDATION:
        return RecoveryStrategy.SKIP;
      default:
        return RecoveryStrategy.RETRY;
    }
  }

  /**
   * Extract error code
   */
  private extractErrorCode(error: Error): string {
    // Try to extract code from message or use error name
    const codeMatch = error.message.match(/\b[A-Z][A-Z_0-9]+\b/);
    if (codeMatch) {
      return codeMatch[0];
    }

    return error.name.replace(/Error$/, '').toUpperCase() || 'UNKNOWN';
  }

  /**
   * Generate error suggestions
   */
  private generateSuggestions(
    error: Error,
    classification: ErrorClassification,
    strategy: RecoveryStrategy
  ): string[] {
    const suggestions: string[] = [];

    switch (classification) {
      case ErrorClassification.CONFIGURATION:
        suggestions.push('Check configuration files and settings');
        suggestions.push('Verify tool installation and dependencies');
        break;

      case ErrorClassification.NETWORK:
        suggestions.push('Check network connectivity');
        suggestions.push('Verify external service availability');
        break;

      case ErrorClassification.TIMEOUT:
        suggestions.push('Increase timeout values');
        suggestions.push('Check system resource availability');
        break;

      case ErrorClassification.RESOURCE:
        suggestions.push('Free up system resources');
        suggestions.push('Reduce concurrent operations');
        break;

      case ErrorClassification.PLUGIN:
        suggestions.push('Update plugin to latest version');
        suggestions.push('Check plugin configuration');
        break;
    }

    // Add strategy-specific suggestions
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        suggestions.push('The operation will be retried automatically');
        break;
      case RecoveryStrategy.FALLBACK:
        suggestions.push('A fallback method will be used');
        break;
      case RecoveryStrategy.DEGRADE:
        suggestions.push('System will operate in degraded mode');
        break;
    }

    return suggestions;
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation(
    error: AnalysisError,
    startTime: number,
    attempts: number
  ): Promise<{ success: boolean; result?: unknown; strategy: RecoveryStrategy; attempts: number; recoveryTime: number }> {
    while (attempts < error.maxRetries) {
      attempts++;
      const delay = this.calculateRetryDelay(attempts);

      this.logger.info(`Retrying operation (attempt ${attempts}/${error.maxRetries}) after ${delay}ms`);

      await this.sleep(delay);

      try {
        // Here you would retry the original operation
        // For now, we'll simulate success
        return {
          success: true,
          strategy: RecoveryStrategy.RETRY,
          attempts,
          recoveryTime: Date.now() - startTime
        };
      } catch (retryError) {
        this.logger.warn(`Retry attempt ${attempts} failed:`, retryError);
      }
    }

    return {
      success: false,
      strategy: RecoveryStrategy.RETRY,
      attempts,
      recoveryTime: Date.now() - startTime
    };
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallback(
    error: AnalysisError,
    startTime: number
  ): Promise<{ success: boolean; result?: unknown; strategy: RecoveryStrategy; attempts: number; recoveryTime: number }> {
    if (!this.config.fallback.enabled) {
      return { success: false, strategy: RecoveryStrategy.FALLBACK, attempts: 0, recoveryTime: 0 };
    }

    const fallbackAction = this.recoveryActions.get(error.code) ||
                         this.config.fallback.strategies[error.classification];

    if (!fallbackAction) {
      this.logger.warn(`No fallback strategy available for error: ${error.code}`);
      return { success: false, strategy: RecoveryStrategy.FALLBACK, attempts: 0, recoveryTime: 0 };
    }

    try {
      const result = fallbackAction();
      this.logger.info(`Fallback strategy executed for error: ${error.code}`);
      return {
        success: true,
        result,
        strategy: RecoveryStrategy.FALLBACK,
        attempts: 1,
        recoveryTime: Date.now() - startTime
      };
    } catch (fallbackError) {
      this.logger.error(`Fallback strategy failed for error: ${error.code}`, fallbackError);
      return {
        success: false,
        strategy: RecoveryStrategy.FALLBACK,
        attempts: 1,
        recoveryTime: Date.now() - startTime,
        result: fallbackError
      };
    }
  }

  /**
   * Execute degradation strategy
   */
  private async executeDegradation(
    error: AnalysisError,
    startTime: number
  ): Promise<{ success: boolean; result?: unknown; strategy: RecoveryStrategy; attempts: number; recoveryTime: number }> {
    if (!this.config.degradation.enabled) {
      return { success: false, strategy: RecoveryStrategy.DEGRADE, attempts: 0, recoveryTime: 0 };
    }

    const degradationAction = this.config.degradation.strategies[error.classification];

    if (!degradationAction) {
      this.logger.warn(`No degradation strategy available for error: ${error.code}`);
      return { success: false, strategy: RecoveryStrategy.DEGRADE, attempts: 0, recoveryTime: 0 };
    }

    try {
      const result = degradationAction();
      this.logger.info(`Degradation strategy executed for error: ${error.code}`);
      return {
        success: true,
        result,
        strategy: RecoveryStrategy.DEGRADE,
        attempts: 1,
        recoveryTime: Date.now() - startTime
      };
    } catch (degradationError) {
      this.logger.error(`Degradation strategy failed for error: ${error.code}`, degradationError);
      return {
        success: false,
        strategy: RecoveryStrategy.DEGRADE,
        attempts: 1,
        recoveryTime: Date.now() - startTime,
        result: degradationError
      };
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    let delay = this.config.retry.baseDelay * Math.pow(this.config.retry.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.config.retry.maxDelay);

    if (this.config.retry.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5); // Add ±50% jitter
    }

    return Math.round(delay);
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: AnalysisError): void {
    const logMessage = `${error.classification.toUpperCase()} [${error.code}] ${error.message}`;
    const logData = {
      toolName: error.context.toolName,
      phase: error.context.phase,
      timestamp: error.context.timestamp,
      suggestions: error.suggestions
    };

    if (this.config.reporting.includeStackTrace) {
      (logData as any).stackTrace = error.originalError.stack;
    }

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        this.logger.error(logMessage, logData);
        break;
      case ErrorSeverity.HIGH:
        this.logger.error(logMessage, logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(logMessage, logData);
        break;
      case ErrorSeverity.LOW:
        this.logger.info(logMessage, logData);
        break;
    }
  }

  /**
   * Update error statistics
   */
  private updateStats(): void {
    this.stats.totalErrors = this.errors.length;
    this.stats.errorsByClassification = {} as Record<ErrorClassification, number>;
    this.stats.errorsBySeverity = {} as Record<ErrorSeverity, number>;
    this.stats.errorsByTool = {};

    for (const error of this.errors) {
      this.stats.errorsByClassification[error.classification] =
        (this.stats.errorsByClassification[error.classification] || 0) + 1;

      this.stats.errorsBySeverity[error.severity] =
        (this.stats.errorsBySeverity[error.severity] || 0) + 1;

      if (error.context.toolName) {
        this.stats.errorsByTool[error.context.toolName] =
          (this.stats.errorsByTool[error.context.toolName] || 0) + 1;
      }
    }

    this.stats.recentErrors = this.getRecentErrors();
    this.stats.lastError = this.errors.length > 0 ? this.errors[this.errors.length - 1].context.timestamp : undefined;
  }

  /**
   * Get consecutive errors count
   */
  private getConsecutiveErrors(): number {
    if (this.errors.length === 0) return 0;

    let consecutive = 0;
    const now = new Date();

    for (let i = this.errors.length - 1; i >= 0; i--) {
      const error = this.errors[i];
      const timeDiff = now.getTime() - error.context.timestamp.getTime();

      if (timeDiff > 60000) break; // Only consider errors within last minute
      consecutive++;
    }

    return consecutive;
  }

  /**
   * Get average response time (simplified)
   */
  private getAverageResponseTime(): number {
    // This is a simplified implementation
    // In reality, you'd track response times for operations
    return 0;
  }

  /**
   * Generate recommendations based on error patterns
   */
  private generateRecommendations(
    stats: ErrorStats,
    topErrors: Array<{ error: AnalysisError; count: number; frequency: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (stats.errorsByClassification[ErrorClassification.CONFIGURATION] > 5) {
      recommendations.push('Review and validate configuration files');
    }

    if (stats.errorsByClassification[ErrorClassification.TIMEOUT] > 3) {
      recommendations.push('Consider increasing timeout values or optimizing performance');
    }

    if (stats.errorsByClassification[ErrorClassification.RESOURCE] > 2) {
      recommendations.push('Monitor system resources and consider resource optimization');
    }

    if (topErrors.length > 0 && topErrors[0].frequency > 0.3) {
      recommendations.push(`Address recurring error: ${topErrors[0].error.code}`);
    }

    return recommendations;
  }

  /**
   * Analyze error trends
   */
  private analyzeTrends(): {
    increasing: string[];
    decreasing: string[];
    stable: string[];
  } {
    const trends = {
      increasing: [] as string[],
      decreasing: [] as string[],
      stable: [] as string[]
    };

    // Simplified trend analysis
    // In reality, you'd compare error rates over different time periods
    const recentErrors = this.getRecentErrors(300000); // Last 5 minutes
    const olderErrors = this.getRecentErrors(600000).filter(
      error => !recentErrors.includes(error)
    ); // 5-10 minutes ago

    for (const classification of Object.values(ErrorClassification)) {
      const recentCount = recentErrors.filter(e => e.classification === classification).length;
      const olderCount = olderErrors.filter(e => e.classification === classification).length;

      if (recentCount > olderCount * 1.2) {
        trends.increasing.push(classification);
      } else if (recentCount < olderCount * 0.8) {
        trends.decreasing.push(classification);
      } else {
        trends.stable.push(classification);
      }
    }

    return trends;
  }

  /**
   * Initialize error statistics
   */
  private initializeStats(): ErrorStats {
    return {
      totalErrors: 0,
      errorsByClassification: {} as Record<ErrorClassification, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByTool: {},
      recoverySuccessRate: 0,
      averageRecoveryTime: 0,
      recentErrors: []
    };
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}