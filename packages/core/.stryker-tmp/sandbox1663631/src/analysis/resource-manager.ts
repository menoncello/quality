import { EventEmitter } from 'events';
import type { Logger } from '../plugins/analysis-plugin.js';

/**
 * Resource allocation configuration
 */
export interface ResourceConfig {
  memory: {
    limit: number;          // MB
    warningThreshold: number; // MB
    criticalThreshold: number; // MB
    enableMonitoring: boolean;
  };
  cpu: {
    maxUsage: number;      // Percentage
    warningThreshold: number; // Percentage
    enableThrottling: boolean;
    throttlingThreshold: number; // Percentage
  };
  io: {
    maxConcurrentOperations: number;
    timeoutMs: number;
    enableQueueing: boolean;
    maxQueueSize: number;
  };
  network: {
    maxConcurrentRequests: number;
    timeoutMs: number;
    enableRateLimiting: boolean;
    requestsPerSecond: number;
  };
}

/**
 * Resource usage statistics
 */
export interface ResourceStats {
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
  timestamp: Date;
}

/**
 * Resource allocation request
 */
export interface ResourceRequest {
  id: string;
  type: 'memory' | 'cpu' | 'io' | 'network';
  amount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  callback: (granted: boolean) => void;
  createdAt: Date;
}

/**
 * Resource manager for system resource monitoring and allocation
 */
export class ResourceManager extends EventEmitter {
  private config: ResourceConfig;
  private logger: Logger;
  private stats: ResourceStats;
  private monitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private resourceQueue: ResourceRequest[] = [];
  private allocatedResources = new Map<string, { type: string; amount: number }>();
  private lastCpuUsage: NodeJS.CpuUsage = { user: 0, system: 0 };
  private throttled: boolean = false;

  constructor(config: ResourceConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.stats = this.initializeStats();
  }

  /**
   * Start resource monitoring
   */
  startMonitoring(intervalMs: number = 1000): void {
    if (this.monitoring) {
      this.logger.warn('Resource monitoring is already active');
      return;
    }

    this.monitoring = true;
    this.updateStats(); // Initial update

    this.monitoringInterval = setInterval(() => {
      this.updateStats();
      this.checkThresholds();
      this.processResourceQueue();
    }, intervalMs);

    this.logger.info('Resource monitoring started');
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring(): void {
    if (!this.monitoring) {
      return;
    }

    this.monitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.logger.info('Resource monitoring stopped');
  }

  /**
   * Request resource allocation
   */
  requestResource(request: Omit<ResourceRequest, 'id' | 'createdAt'>): string {
    const requestId = this.generateRequestId();
    const fullRequest: ResourceRequest = {
      ...request,
      id: requestId,
      createdAt: new Date()
    };

    // Check if resource can be allocated immediately
    if (this.canAllocateResource(request.type, request.amount)) {
      this.allocateResource(requestId, request.type, request.amount);
      request.callback(true);
    } else {
      // Queue the request
      this.resourceQueue.push(fullRequest);
      this.logger.debug(`Resource request queued: ${requestId} (${request.type}: ${request.amount})`);
    }

    return requestId;
  }

  /**
   * Release allocated resource
   */
  releaseResource(requestId: string): boolean {
    const allocation = this.allocatedResources.get(requestId);
    if (!allocation) {
      this.logger.warn(`Attempted to release non-existent resource allocation: ${requestId}`);
      return false;
    }

    this.allocatedResources.delete(requestId);
    this.logger.debug(`Resource released: ${requestId} (${allocation.type}: ${allocation.amount})`);

    // Process queue to see if we can allocate pending requests
    this.processResourceQueue();

    return true;
  }

  /**
   * Get current resource statistics
   */
  getStats(): ResourceStats {
    return { ...this.stats };
  }

  /**
   * Check if system is under resource pressure
   */
  isUnderPressure(): boolean {
    return (
      this.stats.memory.percentage > 80 ||
      this.stats.cpu.usage > 80 ||
      this.throttled
    );
  }

  /**
   * Get resource utilization report
   */
  getUtilizationReport(): {
    memory: { used: number; available: number; percentage: number; status: 'normal' | 'warning' | 'critical' };
    cpu: { usage: number; status: 'normal' | 'warning' | 'critical' };
    allocations: { total: number; byType: Record<string, number> };
    queue: { length: number; oldestRequest?: Date };
    recommendations: string[];
  } {
    const memoryStatus = this.getResourceStatus(
      this.stats.memory.percentage,
      this.config.memory.warningThreshold,
      this.config.memory.criticalThreshold
    );

    const cpuStatus = this.getResourceStatus(
      this.stats.cpu.usage,
      this.config.cpu.warningThreshold,
      this.config.cpu.warningThreshold
    );

    const allocationsByType = new Map<string, number>();
    for (const allocation of this.allocatedResources.values()) {
      allocationsByType.set(allocation.type, (allocationsByType.get(allocation.type)  ?? 0) + allocation.amount);
    }

    const oldestRequest = this.resourceQueue.length > 0
      ? this.resourceQueue[0].createdAt
      : undefined;

    const recommendations = this.generateRecommendations(memoryStatus, cpuStatus);

    return {
      memory: {
        used: this.stats.memory.used,
        available: this.stats.memory.free,
        percentage: this.stats.memory.percentage,
        status: memoryStatus
      },
      cpu: {
        usage: this.stats.cpu.usage,
        status: cpuStatus
      },
      allocations: {
        total: this.allocatedResources.size,
        byType: Object.fromEntries(allocationsByType)
      },
      queue: {
        length: this.resourceQueue.length,
        oldestRequest
      },
      recommendations
    };
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection(): boolean {
    if (global.gc) {
      global.gc();
      this.logger.info('Manual garbage collection triggered');
      return true;
    } else {
      this.logger.warn('Garbage collection not available');
      return false;
    }
  }

  /**
   * Enable/disable throttling
   */
  setThrottling(enabled: boolean): void {
    this.throttled = enabled;
    this.logger.info(`Throttling ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update resource configuration
   */
  updateConfig(newConfig: Partial<ResourceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Resource configuration updated');
  }

  // Private methods

  /**
   * Initialize resource statistics
   */
  private initializeStats(): ResourceStats {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();

    return {
      memory: {
        used: Math.round(memUsage.heapUsed / (1024 * 1024)),
        free: Math.round(freeMemory / (1024 * 1024)),
        total: Math.round(totalMemory / (1024 * 1024)),
        percentage: 0
      },
      cpu: {
        usage: 0,
        cores: require('os').cpus().length,
        loadAverage: require('os').loadavg()
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: memUsage,
        cpuUsage: process.cpuUsage()
      },
      timestamp: new Date()
    };
  }

  /**
   * Update resource statistics
   */
  private updateStats(): void {
    const now = Date.now();
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);

    // Update memory stats
    const usedMB = Math.round(memUsage.heapUsed / (1024 * 1024));
    const freeMB = Math.round(freeMemory / (1024 * 1024));
    const totalMB = Math.round(totalMemory / (1024 * 1024));

    this.stats.memory = {
      used: usedMB,
      free: freeMB,
      total: totalMB,
      percentage: (usedMB / totalMB) * 100
    };

    // Update CPU stats
    const timeDelta = now - this.stats.timestamp.getTime();
    const cpuPercent = ((currentCpuUsage.user + currentCpuUsage.system) / timeDelta) * 100;

    this.stats.cpu = {
      usage: Math.min(100, Math.max(0, cpuPercent * this.stats.cpu.cores / 100)),
      cores: this.stats.cpu.cores,
      loadAverage: require('os').loadavg()
    };

    // Update process stats
    this.stats.process = {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: memUsage,
      cpuUsage: currentCpuUsage
    };

    this.stats.timestamp = new Date();
    this.lastCpuUsage = currentCpuUsage;
  }

  /**
   * Check resource thresholds and emit events
   */
  private checkThresholds(): void {
    // Memory thresholds
    if (this.stats.memory.percentage > this.config.memory.criticalThreshold) {
      this.emit('memory:critical', this.stats.memory);
      this.logger.error(`Critical memory usage: ${this.stats.memory.percentage.toFixed(1)}%`);
    } else if (this.stats.memory.percentage > this.config.memory.warningThreshold) {
      this.emit('memory:warning', this.stats.memory);
      this.logger.warn(`High memory usage: ${this.stats.memory.percentage.toFixed(1)}%`);
    }

    // CPU thresholds
    if (this.stats.cpu.usage > this.config.cpu.maxUsage) {
      this.emit('cpu:critical', this.stats.cpu);
      this.logger.error(`Critical CPU usage: ${this.stats.cpu.usage.toFixed(1)}%`);

      if (this.config.cpu.enableThrottling && !this.throttled) {
        this.setThrottling(true);
      }
    } else if (this.stats.cpu.usage > this.config.cpu.warningThreshold) {
      this.emit('cpu:warning', this.stats.cpu);
      this.logger.warn(`High CPU usage: ${this.stats.cpu.usage.toFixed(1)}%`);
    } else if (this.throttled && this.stats.cpu.usage < this.config.cpu.throttlingThreshold) {
      this.setThrottling(false);
    }
  }

  /**
   * Process resource allocation queue
   */
  private processResourceQueue(): void {
    if (this.resourceQueue.length === 0) {
      return;
    }

    // Sort queue by priority and creation time
    this.resourceQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Process requests that can be allocated
    const remainingQueue: ResourceRequest[] = [];

    for (const request of this.resourceQueue) {
      if (this.canAllocateResource(request.type, request.amount)) {
        this.allocateResource(request.id, request.type, request.amount);
        request.callback(true);
      } else {
        // Check timeout
        if (Date.now() - request.createdAt.getTime() > request.timeout) {
          request.callback(false);
          this.logger.debug(`Resource request timed out: ${request.id}`);
        } else {
          remainingQueue.push(request);
        }
      }
    }

    this.resourceQueue = remainingQueue;
  }

  /**
   * Check if resource can be allocated
   */
  private canAllocateResource(type: string, amount: number): boolean {
    switch (type) {
      case 'memory': {
        const projectedMemoryUsage = this.stats.memory.used + amount;
        return projectedMemoryUsage < this.config.memory.limit;
      }

      case 'cpu':
        return !this.throttled && this.stats.cpu.usage < this.config.cpu.maxUsage;

      case 'io':
        return this.allocatedResources.size < this.config.io.maxConcurrentOperations;

      case 'network': {
        const networkAllocations = Array.from(this.allocatedResources.values())
          .filter(allocation => allocation.type === 'network').length;
        return networkAllocations < this.config.network.maxConcurrentRequests;
      }

      default:
        return false;
    }
  }

  /**
   * Allocate resource
   */
  private allocateResource(requestId: string, type: string, amount: number): void {
    this.allocatedResources.set(requestId, { type, amount });
    this.logger.debug(`Resource allocated: ${requestId} (${type}: ${amount})`);
    this.emit('resource:allocated', { requestId, type, amount });
  }

  /**
   * Get resource status
   */
  private getResourceStatus(usage: number, warningThreshold: number, criticalThreshold: number): 'normal' | 'warning' | 'critical' {
    if (usage >= criticalThreshold) return 'critical';
    if (usage >= warningThreshold) return 'warning';
    return 'normal';
  }

  /**
   * Generate resource recommendations
   */
  private generateRecommendations(memoryStatus: string, cpuStatus: string): string[] {
    const recommendations: string[] = [];

    if (memoryStatus === 'critical') {
      recommendations.push('Reduce memory usage or increase memory limit');
      recommendations.push('Enable memory throttling or reduce concurrent operations');
    } else if (memoryStatus === 'warning') {
      recommendations.push('Monitor memory usage closely');
    }

    if (cpuStatus === 'critical') {
      recommendations.push('Reduce concurrent task execution');
      recommendations.push('Optimize tool configuration for better performance');
    } else if (cpuStatus === 'warning') {
      recommendations.push('Consider enabling CPU throttling');
    }

    if (this.resourceQueue.length > 5) {
      recommendations.push('Resource queue is backing up - consider increasing limits');
    }

    if (this.throttled) {
      recommendations.push('System is currently throttled for stability');
    }

    return recommendations;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}