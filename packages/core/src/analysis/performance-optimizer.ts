import type { Logger } from '../plugins/analysis-plugin.js';

/**
 * Task timer interface
 */
interface TaskTimer {
  startTime: number;
  endTime: number;
  executionTime: number;
  memoryUsage: number;
  memoryPeak: number;
}

/**
 * Performance optimization configuration
 */
export interface PerformanceOptimizerConfig {
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    strategy: 'lru' | 'lfu' | 'fifo';
  };
  parallelization: {
    maxConcurrency: number;
    enableWorkStealing: boolean;
    loadBalancing: 'round-robin' | 'least-busy' | 'random';
  };
  resourceManagement: {
    memoryLimit: number;
    cpuThreshold: number;
    enableThrottling: boolean;
    throttlingThreshold: number;
  };
  incremental: {
    enabled: boolean;
    changeDetection: 'file-hash' | 'timestamp' | 'size';
    batchSize: number;
    enableSelectiveAnalysis: boolean;
  };
  monitoring: {
    enableProfiling: boolean;
    sampleRate: number;
    trackMemoryUsage: boolean;
    trackExecutionTime: boolean;
  };
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: {
    peak: number;
    average: number;
    final: number;
  };
  cpuUsage: {
    peak: number;
    average: number;
  };
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  throughput: {
    tasksPerSecond: number;
    filesPerSecond: number;
  };
  diskIO: {
    readBytes: number;
    writeBytes: number;
  };
  timestamp: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    workers: number;
  };
}

/**
 * Optimization recommendations
 */
export interface OptimizationRecommendation {
  type: 'configuration' | 'resource' | 'caching' | 'parallelization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string;
}

/**
 * Performance optimizer for analysis engine
 */
export class PerformanceOptimizer {
  private config: PerformanceOptimizerConfig;
  private logger: Logger;
  private metrics: PerformanceMetrics;
  private startTime: number = 0;
  private memorySnapshots: number[] = [];
  private cpuSnapshots: number[] = [];
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();
  private taskTimers: Map<string, TaskTimer> = new Map();
  private taskMetrics: PerformanceMetrics[] = [];
  private memoryUsageHistory: Array<{
    timestamp: number;
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  }> = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private monitor = {
    isMonitoring: false,
    startTime: 0,
    taskCount: 0,
    averagePerformance: 0
  };
  private appliedOptimizations: string[] = [];
  private concurrencyTracking = {
    current: 0,
    peak: 0,
    total: 0
  };
  private defaultConfig: PerformanceOptimizerConfig = {
    caching: {
      enabled: true,
      ttl: 300000,
      maxSize: 1000,
      strategy: 'lru'
    },
    parallelization: {
      maxConcurrency: 10,
      enableWorkStealing: true,
      loadBalancing: 'least-busy'
    },
    resourceManagement: {
      memoryLimit: 1024 * 1024 * 1024, // 1GB
      cpuThreshold: 80,
      enableThrottling: true,
      throttlingThreshold: 90
    },
    incremental: {
      enabled: true,
      changeDetection: 'file-hash',
      batchSize: 100,
      enableSelectiveAnalysis: true
    },
    monitoring: {
      enableProfiling: true,
      sampleRate: 0.1,
      trackMemoryUsage: true,
      trackExecutionTime: true
    }
  };

  constructor(config: PerformanceOptimizerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.startTime = Date.now();
    this.metrics = {
      executionTime: 0,
      memoryUsage: {
        peak: 0,
        average: 0,
        final: 0
      },
      cpuUsage: {
        peak: 0,
        average: 0
      },
      cacheStats: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      throughput: {
        tasksPerSecond: 0,
        filesPerSecond: 0
      },
      diskIO: {
        readBytes: 0,
        writeBytes: 0
      },
      timestamp: Date.now(),
      resourceUtilization: {
        cpu: 0,
        memory: 0,
        workers: 0
      }
    };
  }

  /**
   * Start a task timer
   */
  startTaskTimer(taskId: string): void {
    const timer: TaskTimer = {
      startTime: Date.now(),
      endTime: 0,
      executionTime: 0,
      memoryUsage: 0,
      memoryPeak: 0
    };
    this.taskTimers.set(taskId, timer);
    this.concurrencyTracking.current++;
    this.concurrencyTracking.total++;
    this.concurrencyTracking.peak = Math.max(this.concurrencyTracking.peak, this.concurrencyTracking.current);
  }

  /**
   * End a task timer and record metrics
   */
  endTaskTimer(taskId: string): PerformanceMetrics | null {
    const timer = this.taskTimers.get(taskId);
    if (!timer) {
      return null;
    }

    timer.endTime = Date.now();
    timer.executionTime = timer.endTime - timer.startTime;
    timer.memoryUsage = process.memoryUsage().heapUsed;
    timer.memoryPeak = Math.max(timer.memoryUsage, timer.memoryPeak);

    this.taskTimers.delete(taskId);
    this.concurrencyTracking.current = Math.max(0, this.concurrencyTracking.current - 1);

    const metrics: PerformanceMetrics = {
      executionTime: timer.executionTime,
      memoryUsage: {
        peak: timer.memoryPeak,
        average: timer.memoryUsage,
        final: timer.memoryUsage
      },
      cpuUsage: {
        peak: 0,
        average: 0
      },
      cacheStats: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      throughput: {
        tasksPerSecond: 0,
        filesPerSecond: 0
      },
      diskIO: {
        readBytes: 0,
        writeBytes: 0
      },
      timestamp: Date.now(),
      resourceUtilization: {
        cpu: 0,
        memory: timer.memoryUsage,
        workers: 1
      }
    };

    this.taskMetrics.push(metrics);
    return metrics;
  }

  /**
   * Get current concurrency
   */
  getCurrentConcurrency(): number {
    return this.concurrencyTracking.current;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    return {
      executionTime: Date.now() - this.startTime,
      memoryUsage: {
        peak: memoryUsage.heapUsed,
        average: memoryUsage.heapUsed,
        final: memoryUsage.heapUsed
      },
      cpuUsage: {
        peak: 0,
        average: 0
      },
      diskIO: {
        readBytes: 0,
        writeBytes: 0
      },
      timestamp: Date.now(),
      cacheStats: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      throughput: {
        tasksPerSecond: this.taskMetrics.length > 0 ? this.taskMetrics.length / ((Date.now() - this.startTime) / 1000) : 0,
        filesPerSecond: 0
      },
      resourceUtilization: {
        cpu: 0,
        memory: memoryUsage.heapUsed,
        workers: this.concurrencyTracking.current
      }
    };
  }

  /**
   * Analyze performance patterns
   */
  analyzePerformancePatterns(): Array<{pattern: string, severity: string, recommendation: string}> {
    const patterns = [];

    if (this.taskMetrics.length > 0) {
      const avgExecutionTime = this.taskMetrics.reduce((sum, m) => sum + m.executionTime, 0) / this.taskMetrics.length;
      if (avgExecutionTime > 1000) {
        patterns.push({
          pattern: 'slow-execution',
          severity: 'high',
          recommendation: 'Consider optimizing slow tasks or increasing parallelization'
        });
      }
    }

    return patterns;
  }

  /**
   * Detect bottlenecks
   */
  detectBottlenecks(): Array<{type: string, impact: string, description: string}> {
    const bottlenecks = [];
    const systemMetrics = this.getSystemMetrics() as any;

    if (systemMetrics.memoryUsage && systemMetrics.memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      bottlenecks.push({
        type: 'memory',
        impact: 'high',
        description: 'High memory usage detected'
      });
    }

    return bottlenecks;
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(): number {
    const systemMetrics = this.getSystemMetrics();
    let score = 100;

    // Deduct points for high memory usage
    if (systemMetrics.memoryUsage.final > 100 * 1024 * 1024) {
      score -= 20;
    }

    // Deduct points for slow execution
    if (systemMetrics.executionTime > 5000) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  /**
   * Get performance score breakdown
   */
  getPerformanceScoreBreakdown(): {total: number, memory: number, speed: number, efficiency: number} {
    const total = this.calculatePerformanceScore();
    return {
      total,
      memory: Math.max(0, 100 - (this.getSystemMetrics().memoryUsage.final / (1024 * 1024 * 100))),
      speed: Math.max(0, 100 - (this.getSystemMetrics().executionTime / 100)),
      efficiency: total
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const systemMetrics = this.getSystemMetrics();

    if (systemMetrics.memoryUsage.final > 100 * 1024 * 1024) {
      recommendations.push({
        type: 'resource' as const,
        priority: 'high' as const,
        title: 'High Memory Usage',
        description: 'Memory usage is above recommended threshold',
        impact: 'Reduced performance and potential out-of-memory errors',
        effort: 'medium' as const,
        implementation: 'Implement memory pooling and reduce object creation'
      });
    }

    return recommendations;
  }

  /**
   * Record memory usage for a specific task
   */
  recordMemoryUsage(taskId?: string, memoryUsage?: number): number {
    const memoryRecord = process.memoryUsage();
    const timestamp = Date.now();

    this.memoryUsageHistory.push({
      timestamp,
      rss: memoryRecord.rss,
      heapUsed: memoryUsage ?? memoryRecord.heapUsed,
      heapTotal: memoryRecord.heapTotal,
      external: memoryRecord.external,
      arrayBuffers: memoryRecord.arrayBuffers
    });

    // Keep only last 100 entries
    if (this.memoryUsageHistory.length > 100) {
      this.memoryUsageHistory = this.memoryUsageHistory.slice(-100);
    }

    return memoryUsage ?? memoryRecord.heapUsed;
  }

  /**
   * Enable/disable auto optimization
   */
  enableAutoOptimization(enabled: boolean): void {
    if (this.config.monitoring) {
      this.config.monitoring.enableProfiling = enabled;
    }
    if (enabled) {
      this.appliedOptimizations.push('auto-optimization-enabled');
    }
  }

  /**
   * Get applied optimizations
   */
  getAppliedOptimizations(): string[] {
    return [...this.appliedOptimizations];
  }

  /**
   * Calculate optimization effectiveness
   */
  calculateOptimizationEffectiveness(): {beforeOptimization: number, afterOptimization: number, improvement: number} {
    if (this.taskMetrics.length < 2) {
      return { beforeOptimization: 0, afterOptimization: 0, improvement: 0 };
    }

    const before = this.taskMetrics[0].executionTime;
    const after = this.taskMetrics[this.taskMetrics.length - 1].executionTime;
    const improvement = before > 0 ? ((before - after) / before) * 100 : 0;

    return { beforeOptimization: before, afterOptimization: after, improvement };
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring(): {isMonitoring: boolean, startTime: number, taskCount: number, averagePerformance: number} {
    this.monitor.isMonitoring = true;
    this.monitor.startTime = Date.now();
    this.monitor.taskCount = 0;
    this.monitor.averagePerformance = 0;

    this.monitoringInterval = setInterval(() => {
      this.monitor.taskCount = this.taskMetrics.length;
      this.monitor.averagePerformance = this.taskMetrics.length > 0
        ? this.taskMetrics.reduce((sum, m) => sum + m.executionTime, 0) / this.taskMetrics.length
        : 0;
    }, 5000);

    return this.monitor;
  }

  /**
   * Get monitoring data
   */
  getMonitoringData(): {isMonitoring: boolean, startTime: number, taskCount: number, averagePerformance: number} {
    return this.monitor;
  }

  /**
   * Stop performance monitoring
   */
  stopPerformanceMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.monitor.isMonitoring = false;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {summary: PerformanceMetrics, recommendations: OptimizationRecommendation[], scoreBreakdown: {total: number, memory: number, speed: number, efficiency: number}} {
    const systemMetrics = this.getSystemMetrics();
    const recommendations = this.getOptimizationRecommendations();
    const scoreBreakdown = this.getPerformanceScoreBreakdown();

    return {
      summary: systemMetrics,
      recommendations,
      scoreBreakdown
    };
  }

  /**
   * Export metrics
   */
  exportMetrics(): {timestamp: number, metrics: PerformanceMetrics[], config: PerformanceOptimizerConfig, metadata: unknown, version: string} {
    return {
      timestamp: Date.now(),
      metrics: [...this.taskMetrics],
      config: { ...this.config },
      version: '1.0.0',
      metadata: {
        generatedAt: new Date().toISOString(),
        totalTasks: this.taskMetrics.length,
        optimizationsApplied: this.appliedOptimizations.length
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceOptimizerConfig>): void {
    // Check for invalid configuration patterns
    if (newConfig.resourceManagement) {
      const thresholds = newConfig.resourceManagement;
      if ((thresholds as any).slowTaskThreshold <= 0 || (thresholds as any).memoryThreshold <= 0  || (thresholds.cpuThreshold && thresholds.cpuThreshold > 100)  || (thresholds as any).diskIOLatencyThreshold <= 0) {
        throw new Error('Invalid configuration: negative or out-of-range values');
      }
    }

    const mergedConfig = { ...this.defaultConfig, ...newConfig } as PerformanceOptimizerConfig;
    if (!this.validateConfig(mergedConfig)) {
      throw new Error('Invalid configuration');
    }
    Object.assign(this.defaultConfig, newConfig);
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.config = this.defaultConfig;
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): PerformanceOptimizerConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Get all recorded metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.taskMetrics];
  }

  /**
   * Cleanup old metrics
   */
  cleanupOldMetrics(cutoffTime: number): void {
    this.taskMetrics = this.taskMetrics.filter(metric =>
      metric.executionTime > cutoffTime
    );
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.taskMetrics.length = 0;
    this.memoryUsageHistory.length = 0;
    this.appliedOptimizations.length = 0;
    this.concurrencyTracking = {
      current: 0,
      peak: 0,
      total: 0
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopPerformanceMonitoring();
    // Don't clear active task timers, as they may be in use
    // Clear completed tasks from cache but preserve active ones
    this.cache.clear();
    // Don't reset metrics completely, just clear old data
    if (this.taskMetrics.length > 100) {
      this.taskMetrics = this.taskMetrics.slice(-100);
    }
    if (this.memoryUsageHistory.length > 100) {
      this.memoryUsageHistory = this.memoryUsageHistory.slice(-100);
    }
  }

  
  /**
   * Validate configuration
   */
  validateConfig(config: PerformanceOptimizerConfig): boolean {
    try {
      return (
        config.parallelization.maxConcurrency > 0 &&
        config.resourceManagement.memoryLimit > 0 &&
        config.resourceManagement.cpuThreshold > 0 &&
        config.resourceManagement.cpuThreshold <= 100 &&
        config.monitoring.sampleRate >= 0 &&
        config.monitoring.sampleRate <= 1
      );
    } catch {
      return false;
    }
  }
}