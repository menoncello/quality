import { EventEmitter } from 'events';
import type { Logger } from '../plugins/analysis-plugin.js';
import type { ErrorHandler } from './error-handler.js';

/**
 * Degradation level
 */
export enum DegradationLevel {
  NONE = 'none',        // Full functionality
  MINIMAL = 'minimal',  // Skip non-critical features
  MODERATE = 'moderate', // Reduce scope and complexity
  SEVERE = 'severe',    // Basic functionality only
  CRITICAL = 'critical'  // Emergency mode
}

/**
 * Degradation strategy
 */
export interface DegradationStrategy {
  level: DegradationLevel;
  triggers: {
    errorRate: number;         // Errors per minute
    consecutiveErrors: number;  // Consecutive errors
    memoryUsage: number;       // Memory usage percentage
    cpuUsage: number;          // CPU usage percentage
    responseTime: number;      // Response time in ms
  };
  actions: {
    disablePlugins: string[];    // Plugins to disable
    reduceConcurrency: number;   // Reduce concurrency by this factor
    increaseTimeouts: number;     // Increase timeouts by this factor
    enableCaching: boolean;       // Enable aggressive caching
    skipExpensiveOperations: boolean; // Skip expensive operations
    enableFallbacks: boolean;     // Enable fallback mechanisms
  };
  recovery: {
    cooldownPeriod: number;      // Minutes to wait before recovery
    successThreshold: number;    // Success rate threshold for recovery
    monitoringPeriod: number;    // Minutes to monitor for recovery
  };
}

/**
 * System health metrics
 */
export interface HealthMetrics {
  errorRate: number;           // Errors per minute
  successRate: number;         // Success rate percentage
  averageResponseTime: number; // Average response time in ms
  memoryUsage: number;         // Memory usage percentage
  cpuUsage: number;           // CPU usage percentage
  activePlugins: number;      // Number of active plugins
  queueDepth: number;         // Current queue depth
  timestamp: Date;
}

/**
 * Graceful degradation manager
 */
export class GracefulDegradationManager extends EventEmitter {
  private currentLevel: DegradationLevel = DegradationLevel.NONE;
  private strategies: Map<DegradationLevel, DegradationStrategy> = new Map();
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private healthHistory: HealthMetrics[] = [];
  private lastLevelChange: Date | null = null;
  private recoveryTimer: NodeJS.Timeout | null = null;
  private disabledPlugins = new Set<string>();
  private originalConfig: Record<string, unknown> = {};

  constructor(logger: Logger, errorHandler: ErrorHandler) {
    super();
    this.logger = logger;
    this.errorHandler = errorHandler;
    this.initializeDefaultStrategies();
  }

  /**
   * Update health metrics and check for degradation triggers
   */
  updateHealthMetrics(metrics: Partial<HealthMetrics>): void {
    const fullMetrics: HealthMetrics = {
      errorRate: 0,
      successRate: 100,
      averageResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activePlugins: 0,
      queueDepth: 0,
      timestamp: new Date(),
      ...metrics
    };

    this.healthHistory.push(fullMetrics);

    // Keep only last 60 minutes of history
    const cutoffTime = new Date(Date.now() - 3600000);
    this.healthHistory = this.healthHistory.filter(m => m.timestamp >= cutoffTime);

    // Check if degradation should be triggered
    this.checkDegradationTriggers(fullMetrics);

    // Emit health update event
    this.emit('health:updated', fullMetrics);
  }

  /**
   * Force degradation to specific level
   */
  forceDegradation(level: DegradationLevel, reason?: string): void {
    if (level === this.currentLevel) {
      return;
    }

    const previousLevel = this.currentLevel;
    this.currentLevel = level;
    this.lastLevelChange = new Date();

    this.logger.info(`Forced degradation from ${previousLevel} to ${level}`, { reason });

    this.applyDegradationLevel(level);
    this.emit('degradation:forced', { from: previousLevel, to: level, reason });

    // Cancel any existing recovery timer
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  /**
   * Attempt recovery to normal operation
   */
  async attemptRecovery(): Promise<boolean> {
    if (this.currentLevel === DegradationLevel.NONE) {
      return true;
    }

    const strategy = this.strategies.get(this.currentLevel);
    if (!strategy) {
      return false;
    }

    // Check if enough time has passed since last level change
    if (this.lastLevelChange) {
      const timeSinceChange = Date.now() - this.lastLevelChange.getTime();
      const cooldownMs = strategy.recovery.cooldownPeriod * 60000;

      if (timeSinceChange < cooldownMs) {
        this.logger.debug(`Recovery cooldown active (${cooldownMs - timeSinceChange}ms remaining)`);
        return false;
      }
    }

    // Check if health metrics meet recovery criteria
    const recentMetrics = this.getRecentMetrics(strategy.recovery.monitoringPeriod * 60000);
    if (!recentMetrics.length) {
      return false;
    }

    const averageSuccessRate = recentMetrics.reduce((sum, m) => sum + m.successRate, 0) / recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length;

    if (averageSuccessRate >= strategy.recovery.successThreshold &&
        averageResponseTime < this.getResponseTimeThreshold(this.currentLevel)) {
      this.logger.info(`Recovery criteria met for ${this.currentLevel} level`);
      const nextLevel = this.getNextLowerLevel(this.currentLevel);
      return nextLevel ? this.recoverToLevel(nextLevel) : false;
    }

    this.logger.debug(`Recovery criteria not met: successRate=${averageSuccessRate}%, responseTime=${averageResponseTime}ms`);
    return false;
  }

  /**
   * Get current degradation level
   */
  getCurrentLevel(): DegradationLevel {
    return this.currentLevel;
  }

  /**
   * Get health metrics history
   */
  getHealthHistory(timeWindowMs: number = 3600000): HealthMetrics[] {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    return this.healthHistory.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Get disabled plugins
   */
  getDisabledPlugins(): string[] {
    return Array.from(this.disabledPlugins);
  }

  /**
   * Check if plugin is disabled
   */
  isPluginDisabled(pluginName: string): boolean {
    return this.disabledPlugins.has(pluginName);
  }

  /**
   * Add custom degradation strategy
   */
  addStrategy(level: DegradationLevel, strategy: DegradationStrategy): void {
    this.strategies.set(level, strategy);
    this.logger.debug(`Added degradation strategy for level: ${level}`);
  }

  /**
   * Remove degradation strategy
   */
  removeStrategy(level: DegradationLevel): boolean {
    const removed = this.strategies.delete(level);
    if (removed) {
      this.logger.debug(`Removed degradation strategy for level: ${level}`);
    }
    return removed;
  }

  /**
   * Get degradation statistics
   */
  getStatistics(): {
    currentLevel: DegradationLevel;
    timeInCurrentLevel: number | null;
    totalLevelChanges: number;
    disabledPluginsCount: number;
    healthScore: number;
    recommendations: string[];
  } {
    const timeInCurrentLevel = this.lastLevelChange
      ? Date.now() - this.lastLevelChange.getTime()
      : null;

    const healthScore = this.calculateHealthScore();
    const recommendations = this.generateRecommendations();

    return {
      currentLevel: this.currentLevel,
      timeInCurrentLevel,
      totalLevelChanges: this.healthHistory.filter(m => m.timestamp >= (this.lastLevelChange ?? new Date(0))).length,
      disabledPluginsCount: this.disabledPlugins.size,
      healthScore,
      recommendations
    };
  }

  // Private methods

  /**
   * Initialize default degradation strategies
   */
  private initializeDefaultStrategies(): void {
    this.strategies.set(DegradationLevel.MINIMAL, {
      level: DegradationLevel.MINIMAL,
      triggers: {
        errorRate: 5,           // 5 errors per minute
        consecutiveErrors: 3,
        memoryUsage: 85,
        cpuUsage: 80,
        responseTime: 10000    // 10 seconds
      },
      actions: {
        disablePlugins: [],
        reduceConcurrency: 0.8,
        increaseTimeouts: 1.2,
        enableCaching: true,
        skipExpensiveOperations: false,
        enableFallbacks: true
      },
      recovery: {
        cooldownPeriod: 5,      // 5 minutes
        successThreshold: 95,   // 95% success rate
        monitoringPeriod: 10    // 10 minutes
      }
    });

    this.strategies.set(DegradationLevel.MODERATE, {
      level: DegradationLevel.MODERATE,
      triggers: {
        errorRate: 10,          // 10 errors per minute
        consecutiveErrors: 5,
        memoryUsage: 90,
        cpuUsage: 85,
        responseTime: 20000    // 20 seconds
      },
      actions: {
        disablePlugins: ['coverage', 'complexity'],
        reduceConcurrency: 0.6,
        increaseTimeouts: 1.5,
        enableCaching: true,
        skipExpensiveOperations: true,
        enableFallbacks: true
      },
      recovery: {
        cooldownPeriod: 10,     // 10 minutes
        successThreshold: 90,   // 90% success rate
        monitoringPeriod: 15    // 15 minutes
      }
    });

    this.strategies.set(DegradationLevel.SEVERE, {
      level: DegradationLevel.SEVERE,
      triggers: {
        errorRate: 20,          // 20 errors per minute
        consecutiveErrors: 10,
        memoryUsage: 95,
        cpuUsage: 90,
        responseTime: 30000    // 30 seconds
      },
      actions: {
        disablePlugins: ['coverage', 'complexity', 'style', 'security'],
        reduceConcurrency: 0.4,
        increaseTimeouts: 2.0,
        enableCaching: true,
        skipExpensiveOperations: true,
        enableFallbacks: true
      },
      recovery: {
        cooldownPeriod: 15,     // 15 minutes
        successThreshold: 85,   // 85% success rate
        monitoringPeriod: 20    // 20 minutes
      }
    });

    this.strategies.set(DegradationLevel.CRITICAL, {
      level: DegradationLevel.CRITICAL,
      triggers: {
        errorRate: 50,          // 50 errors per minute
        consecutiveErrors: 20,
        memoryUsage: 98,
        cpuUsage: 95,
        responseTime: 60000    // 60 seconds
      },
      actions: {
        disablePlugins: ['coverage', 'complexity', 'style', 'security', 'performance'],
        reduceConcurrency: 0.2,
        increaseTimeouts: 3.0,
        enableCaching: true,
        skipExpensiveOperations: true,
        enableFallbacks: true
      },
      recovery: {
        cooldownPeriod: 30,     // 30 minutes
        successThreshold: 80,   // 80% success rate
        monitoringPeriod: 30    // 30 minutes
      }
    });
  }

  /**
   * Check if degradation should be triggered
   */
  private checkDegradationTriggers(metrics: HealthMetrics): void {
    const currentStrategy = this.strategies.get(this.currentLevel);
    const nextLevel = this.getNextLevel(this.currentLevel);

    if (!currentStrategy || !nextLevel) {
      return;
    }

    const nextStrategy = this.strategies.get(nextLevel);
    if (!nextStrategy) {
      return;
    }

    const triggers = nextStrategy.triggers;

    // Check all trigger conditions
    const shouldDegrade = (
      metrics.errorRate > triggers.errorRate ||
      metrics.memoryUsage > triggers.memoryUsage ||
      metrics.cpuUsage > triggers.cpuUsage ||
      metrics.averageResponseTime > triggers.responseTime ||
      this.getConsecutiveErrors() > triggers.consecutiveErrors
    );

    if (shouldDegrade) {
      this.logger.warn(`Degradation triggers met for level ${nextLevel}`, {
        errorRate: metrics.errorRate,
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage,
        responseTime: metrics.averageResponseTime,
        consecutiveErrors: this.getConsecutiveErrors()
      });

      this.degradeToLevel(nextLevel);
    }
  }

  /**
   * Degrade to specific level
   */
  private degradeToLevel(level: DegradationLevel): void {
    if (level === this.currentLevel) {
      return;
    }

    const previousLevel = this.currentLevel;
    this.currentLevel = level;
    this.lastLevelChange = new Date();

    this.logger.warn(`Degrading from ${previousLevel} to ${level}`);
    this.applyDegradationLevel(level);
    this.emit('degradation:triggered', { from: previousLevel, to: level });

    // Cancel any existing recovery timer
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  /**
   * Apply degradation level actions
   */
  private applyDegradationLevel(level: DegradationLevel): void {
    const strategy = this.strategies.get(level);
    if (!strategy) {
      return;
    }

    const { actions } = strategy;

    // Disable specified plugins
    for (const pluginName of actions.disablePlugins) {
      this.disabledPlugins.add(pluginName);
      this.logger.debug(`Disabled plugin: ${pluginName}`);
    }

    // Emit events for configuration changes
    if (actions.reduceConcurrency < 1) {
      this.emit('config:concurrency:reduced', { factor: actions.reduceConcurrency });
    }

    if (actions.increaseTimeouts > 1) {
      this.emit('config:timeouts:increased', { factor: actions.increaseTimeouts });
    }

    if (actions.enableCaching) {
      this.emit('config:caching:enabled');
    }

    if (actions.skipExpensiveOperations) {
      this.emit('config:expensive-operations:skipped');
    }

    if (actions.enableFallbacks) {
      this.emit('config:fallbacks:enabled');
    }

    this.emit('degradation:applied', { level, actions });
  }

  /**
   * Recover to lower degradation level
   */
  private async recoverToLevel(level: DegradationLevel): Promise<boolean> {
    if (level === this.currentLevel) {
      return true;
    }

    this.logger.info(`Attempting recovery from ${this.currentLevel} to ${level}`);

    const previousLevel = this.currentLevel;
    this.currentLevel = level;
    this.lastLevelChange = new Date();

    // Re-enable plugins that were disabled at higher levels
    const higherLevelStrategies = Array.from(this.strategies.entries())
      .filter(([l]) => this.compareLevels(l, level) > 0);

    for (const [_levelName, strategy] of higherLevelStrategies) {
      for (const pluginName of strategy.actions.disablePlugins) {
        this.disabledPlugins.delete(pluginName);
        this.logger.debug(`Re-enabled plugin: ${pluginName}`);
      }
    }

    // Apply new level configuration
    this.applyDegradationLevel(level);

    this.emit('degradation:recovered', { from: previousLevel, to: level });

    // Start recovery monitoring timer
    const strategy = this.strategies.get(level);
    if (strategy) {
      this.recoveryTimer = setTimeout(() => {
        this.attemptRecovery();
      }, strategy.recovery.cooldownPeriod * 60000);
    }

    return true;
  }

  /**
   * Get next higher degradation level
   */
  private getNextLevel(currentLevel: DegradationLevel): DegradationLevel | null {
    const levels = [
      DegradationLevel.NONE,
      DegradationLevel.MINIMAL,
      DegradationLevel.MODERATE,
      DegradationLevel.SEVERE,
      DegradationLevel.CRITICAL
    ];

    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }

  /**
   * Get next lower degradation level
   */
  private getNextLowerLevel(currentLevel: DegradationLevel): DegradationLevel | null {
    const levels = [
      DegradationLevel.NONE,
      DegradationLevel.MINIMAL,
      DegradationLevel.MODERATE,
      DegradationLevel.SEVERE,
      DegradationLevel.CRITICAL
    ];

    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex > 0 ? levels[currentIndex - 1] : null;
  }

  /**
   * Compare degradation levels
   */
  private compareLevels(level1: DegradationLevel, level2: DegradationLevel): number {
    const levels = [
      DegradationLevel.NONE,
      DegradationLevel.MINIMAL,
      DegradationLevel.MODERATE,
      DegradationLevel.SEVERE,
      DegradationLevel.CRITICAL
    ];

    return levels.indexOf(level1) - levels.indexOf(level2);
  }

  /**
   * Get recent health metrics
   */
  private getRecentMetrics(timeWindowMs: number): HealthMetrics[] {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    return this.healthHistory.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Get response time threshold for level
   */
  private getResponseTimeThreshold(level: DegradationLevel): number {
    const strategy = this.strategies.get(level);
    return strategy ? strategy.triggers.responseTime : 30000;
  }

  /**
   * Get consecutive errors count
   */
  private getConsecutiveErrors(): number {
    const recentErrors = this.errorHandler.getRecentErrors(300000); // Last 5 minutes
    let consecutive = 0;
    const now = new Date();

    // Sort errors by timestamp
    const sortedErrors = recentErrors.sort((a, b) =>
      b.context.timestamp.getTime() - a.context.timestamp.getTime()
    );

    for (const error of sortedErrors) {
      const timeDiff = now.getTime() - error.context.timestamp.getTime();
      if (timeDiff > 60000) break; // Only consider errors within last minute

      // Check if this error is consecutive with the next one
      if (consecutive === 0) {
        consecutive = 1;
      } else {
        // This is simplified - in reality, you'd check for actual consecutiveness
        consecutive++;
      }
    }

    return consecutive;
  }

  /**
   * Calculate health score
   */
  private calculateHealthScore(): number {
    if (this.healthHistory.length === 0) {
      return 100;
    }

    const latestMetrics = this.healthHistory[this.healthHistory.length - 1];

    let score = 100;

    // Deduct points for high error rate
    score -= Math.min(40, latestMetrics.errorRate * 2);

    // Deduct points for low success rate
    score -= Math.max(0, (100 - latestMetrics.successRate) * 0.5);

    // Deduct points for high memory usage
    score -= Math.max(0, (latestMetrics.memoryUsage - 70) * 0.5);

    // Deduct points for high CPU usage
    score -= Math.max(0, (latestMetrics.cpuUsage - 70) * 0.5);

    // Deduct points for slow response time
    score -= Math.max(0, (latestMetrics.averageResponseTime - 5000) / 200);

    // Deduct points for degradation level
    const levelPenalties = {
      [DegradationLevel.NONE]: 0,
      [DegradationLevel.MINIMAL]: 5,
      [DegradationLevel.MODERATE]: 15,
      [DegradationLevel.SEVERE]: 30,
      [DegradationLevel.CRITICAL]: 50
    };
    score -= levelPenalties[this.currentLevel];

    return Math.max(0, Math.round(score));
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.currentLevel !== DegradationLevel.NONE) {
      recommendations.push(`System is running in ${this.currentLevel} degradation mode`);
      recommendations.push('Monitor system resources and error rates');
    }

    if (this.disabledPlugins.size > 0) {
      recommendations.push(`${this.disabledPlugins.size} plugins are currently disabled`);
    }

    const latestMetrics = this.healthHistory[this.healthHistory.length - 1];
    if (latestMetrics) {
      if (latestMetrics.memoryUsage > 80) {
        recommendations.push('Memory usage is high - consider freeing up resources');
      }

      if (latestMetrics.cpuUsage > 80) {
        recommendations.push('CPU usage is high - consider reducing concurrent operations');
      }

      if (latestMetrics.errorRate > 5) {
        recommendations.push('Error rate is elevated - review recent errors and logs');
      }
    }

    return recommendations;
  }
}