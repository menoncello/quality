/**
 * Performance monitoring utilities for dashboard operations
 */

interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  operationCount: number;
  lastUpdate: number;
}

interface PerformanceAlert {
  type: 'render' | 'memory' | 'update' | 'operation';
  message: string;
  threshold: number;
  actual: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[];
  private listeners: Set<(alert: PerformanceAlert) => void>;
  private thresholds: {
    maxRenderTime: number;
    maxUpdateTime: number;
    maxMemoryUsage: number;
    maxOperationRate: number;
  };

  constructor() {
    this.metrics = {
      renderTime: 0,
      updateTime: 0,
      memoryUsage: 0,
      operationCount: 0,
      lastUpdate: Date.now()
    };
    this.alerts = [];
    this.listeners = new Set();
    this.thresholds = {
      maxRenderTime: 100,    // 100ms
      maxUpdateTime: 50,    // 50ms
      maxMemoryUsage: 512,  // 512MB
      maxOperationRate: 10   // 10 ops/sec
    };
  }

  /**
   * Start measuring a render operation
   */
  startRenderMeasurement(): () => void {
    const startTime = globalThis.performance.now();

    return () => {
      const endTime = globalThis.performance.now();
      const renderTime = endTime - startTime;

      this.metrics.renderTime = renderTime;
      this.metrics.lastUpdate = Date.now();
      this.metrics.operationCount++;

      if (renderTime > this.thresholds.maxRenderTime) {
        this.createAlert('render',
          `Render time exceeded threshold: ${renderTime.toFixed(2)}ms > ${this.thresholds.maxRenderTime}ms`,
          this.thresholds.maxRenderTime,
          renderTime
        );
      }
    };
  }

  /**
   * Start measuring an update operation
   */
  startUpdateMeasurement(): () => void {
    const startTime = globalThis.performance.now();

    return () => {
      const endTime = globalThis.performance.now();
      const updateTime = endTime - startTime;

      this.metrics.updateTime = updateTime;
      this.metrics.lastUpdate = Date.now();
      this.metrics.operationCount++;

      if (updateTime > this.thresholds.maxUpdateTime) {
        this.createAlert('update',
          `Update time exceeded threshold: ${updateTime.toFixed(2)}ms > ${this.thresholds.maxUpdateTime}ms`,
          this.thresholds.maxUpdateTime,
          updateTime
        );
      }
    };
  }

  /**
   * Check memory usage and alert if necessary
   */
  checkMemoryUsage(): void {
    if (typeof globalThis.performance !== 'undefined' && (globalThis.performance as unknown as { memory?: { usedJSHeapSize: number } }).memory) {
      const memoryInfo = (globalThis.performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      const memoryUsageMB = memoryInfo.usedJSHeapSize / (1024 * 1024);

      this.metrics.memoryUsage = memoryUsageMB;

      if (memoryUsageMB > this.thresholds.maxMemoryUsage) {
        this.createAlert('memory',
          `Memory usage exceeded threshold: ${memoryUsageMB.toFixed(2)}MB > ${this.thresholds.maxMemoryUsage}MB`,
          this.thresholds.maxMemoryUsage,
          memoryUsageMB
        );
      }
    }
  }

  /**
   * Check operation rate and alert if too high
   */
  checkOperationRate(): void {
    const _now = Date.now();
    const timeWindow = 1000; // 1 second
    const recentOperations = this.getOperationCountInTimeWindow(timeWindow);

    if (recentOperations > this.thresholds.maxOperationRate) {
      this.createAlert('operation',
        `Operation rate exceeded threshold: ${recentOperations} > ${this.thresholds.maxOperationRate}/sec`,
        this.thresholds.maxOperationRate,
        recentOperations
      );
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent alerts
   */
  getAlerts(timeWindow?: number): PerformanceAlert[] {
    if (!timeWindow) {
      return [...this.alerts];
    }

    const cutoff = Date.now() - timeWindow;
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  /**
   * Subscribe to performance alerts
   */
  onAlert(listener: (alert: PerformanceAlert) => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      renderTime: 0,
      updateTime: 0,
      memoryUsage: 0,
      operationCount: 0,
      lastUpdate: Date.now()
    };
    this.alerts = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const now = Date.now();
    const recentAlerts = this.getAlerts(60000); // Last minute

    return `
Performance Report (Generated: ${new Date(now).toISOString()})
================================================================

Current Metrics:
- Render Time: ${this.metrics.renderTime.toFixed(2)}ms
- Update Time: ${this.metrics.updateTime.toFixed(2)}ms
- Memory Usage: ${this.metrics.memoryUsage.toFixed(2)}MB
- Total Operations: ${this.metrics.operationCount}
- Last Update: ${new Date(this.metrics.lastUpdate).toISOString()}

Thresholds:
- Max Render Time: ${this.thresholds.maxRenderTime}ms
- Max Update Time: ${this.thresholds.maxUpdateTime}ms
- Max Memory Usage: ${this.thresholds.maxMemoryUsage}MB
- Max Operation Rate: ${this.thresholds.maxOperationRate}/sec

Recent Alerts (Last Minute): ${recentAlerts.length}
${recentAlerts.map(alert =>
  `- [${alert.type.toUpperCase()}] ${alert.message} (${alert.actual.toFixed(2)} vs ${alert.threshold})`
).join('\n')}

Status: ${recentAlerts.length === 0 ? 'HEALTHY' : 'WARNING'}
    `.trim();
  }

  private createAlert(type: PerformanceAlert['type'], message: string, threshold: number, actual: number): void {
    const alert: PerformanceAlert = {
      type,
      message,
      threshold,
      actual,
      timestamp: Date.now()
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts to prevent memory leak
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(alert);
      } catch (_error) {
        // console.error('Error in performance alert listener:', _error);
      }
    });
  }

  private getOperationCountInTimeWindow(timeWindow: number): number {
    // This is a simplified implementation
    // In a real scenario, you'd track operation timestamps
    const timeSinceLastUpdate = Date.now() - this.metrics.lastUpdate;

    if (timeSinceLastUpdate > timeWindow) {
      return 0;
    }

    // Estimate rate based on recent activity
    return Math.min(this.metrics.operationCount, this.thresholds.maxOperationRate);
  }
}

/**
 * Performance monitoring hook for components
 */
export function usePerformanceMonitor(componentName: string) {
  const monitor = new PerformanceMonitor();

  const measureRender = () => {
    const stopMeasurement = monitor.startRenderMeasurement();

    return () => {
      stopMeasurement();
      monitor.checkMemoryUsage();
      monitor.checkOperationRate();
    };
  };

  const measureUpdate = (_operationName: string) => {
    const stopMeasurement = monitor.startUpdateMeasurement();

    return () => {
      stopMeasurement();
      monitor.checkOperationRate();
    };
  };

  return {
    monitor,
    measureRender,
    measureUpdate,
    componentName
  };
}

/**
 * Search debouncing utility
 */
export class SearchDebouncer {
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private lastSearchTime: number = 0;
  private searchCount: number = 0;

  constructor(private debounceTime: number = 300) {}

  /**
   * Debounce a search function
   */
  debounce<T extends unknown[]>(
    searchFunction: (...args: T) => Promise<unknown>,
    onDebounceStart?: () => void,
    onDebounceEnd?: () => void
  ): (...args: T) => Promise<unknown> {
    return (...args: T): Promise<unknown> => {
      return new Promise<unknown>((resolve, reject) => {
        // Clear existing timeout
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        // Notify debounce start
        onDebounceStart?.();

        // Set new timeout
        this.timeout = setTimeout(async () => {
          try {
            this.lastSearchTime = Date.now();
            this.searchCount++;

            const result = await searchFunction(...args);
            onDebounceEnd?.();
            resolve(result);
          } catch (error) {
            onDebounceEnd?.();
            reject(error);
          } finally {
            this.timeout = null;
          }
        }, this.debounceTime);
      });
    };
  }

  /**
   * Cancel pending search
   */
  cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  /**
   * Get search statistics
   */
  getStats() {
    return {
      lastSearchTime: this.lastSearchTime,
      searchCount: this.searchCount,
      debounceTime: this.debounceTime,
      isPending: this.timeout !== null
    };
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.cancel();
    this.lastSearchTime = 0;
    this.searchCount = 0;
  }
}

/**
 * Create a debounced search function
 */
export function createDebouncedSearch<T extends unknown[]>(
  searchFunction: (...args: T) => Promise<unknown>,
  debounceTime: number = 300,
  onDebounceStart?: () => void,
  onDebounceEnd?: () => void
) {
  const debouncer = new SearchDebouncer(debounceTime);

  return {
    search: debouncer.debounce(searchFunction, onDebounceStart, onDebounceEnd),
    cancel: () => debouncer.cancel(),
    getStats: () => debouncer.getStats(),
    reset: () => debouncer.reset()
  };
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * Setup global performance monitoring
 */
export function setupGlobalPerformanceMonitoring() {
  // Monitor memory usage periodically
  setInterval(() => {
    globalPerformanceMonitor.checkMemoryUsage();
  }, 5000); // Every 5 seconds

  // Monitor operation rate periodically
  setInterval(() => {
    globalPerformanceMonitor.checkOperationRate();
  }, 1000); // Every second

  // Log alerts to console in development
  if (process.env.NODE_ENV === 'development') {
    globalPerformanceMonitor.onAlert((alert) => {
      // eslint-disable-next-line no-console
      console.warn(`[Performance Alert] ${alert.message}`);
    });
  }
}