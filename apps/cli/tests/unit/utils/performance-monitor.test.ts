import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  PerformanceMonitor,
  usePerformanceMonitor,
  SearchDebouncer,
  createDebouncedSearch,
  globalPerformanceMonitor,
  setupGlobalPerformanceMonitoring,
} from '../../../src/utils/performance-monitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.reset();
  });

  describe('render measurement', () => {
    it('should measure render time accurately', () => {
      const stopMeasurement = monitor.startRenderMeasurement();

      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Busy wait for 10ms
      }

      stopMeasurement();

      const metrics = monitor.getMetrics();
      expect(metrics.renderTime).toBeGreaterThan(9);
      expect(metrics.renderTime).toBeLessThan(20);
      expect(metrics.operationCount).toBe(1);
    });

    it('should alert when render time exceeds threshold', () => {
      const alerts: any[] = [];
      monitor.onAlert(alert => alerts.push(alert));

      // Override threshold to make it easier to trigger
      monitor.updateThresholds({ maxRenderTime: 1 });

      const stopMeasurement = monitor.startRenderMeasurement();

      // Wait longer than threshold
      const start = performance.now();
      while (performance.now() - start < 5) {
        // Busy wait for 5ms
      }

      stopMeasurement();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('render');
      expect(alerts[0].message).toContain('Render time exceeded threshold');
    });
  });

  describe('update measurement', () => {
    it('should measure update time accurately', () => {
      const stopMeasurement = monitor.startUpdateMeasurement();

      // Simulate update work
      const start = performance.now();
      while (performance.now() - start < 5) {
        // Busy wait for 5ms
      }

      stopMeasurement();

      const metrics = monitor.getMetrics();
      expect(metrics.updateTime).toBeGreaterThan(4);
      expect(metrics.updateTime).toBeLessThan(15);
      expect(metrics.operationCount).toBe(1);
    });

    it('should alert when update time exceeds threshold', () => {
      const alerts: any[] = [];
      monitor.onAlert(alert => alerts.push(alert));

      // Override threshold to make it easier to trigger
      monitor.updateThresholds({ maxUpdateTime: 1 });

      const stopMeasurement = monitor.startUpdateMeasurement();

      // Wait longer than threshold
      const start = performance.now();
      while (performance.now() - start < 3) {
        // Busy wait for 3ms
      }

      stopMeasurement();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('update');
      expect(alerts[0].message).toContain('Update time exceeded threshold');
    });
  });

  describe('memory monitoring', () => {
    it('should check memory usage when available', () => {
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 100 * 1024 * 1024, // 100MB
        totalJSHeapSize: 200 * 1024 * 1024,
        jsHeapSizeLimit: 2048 * 1024 * 1024,
      };

      (performance as any).memory = mockMemory;

      monitor.checkMemoryUsage();

      const metrics = monitor.getMetrics();
      expect(metrics.memoryUsage).toBe(100);
    });

    it('should alert when memory usage exceeds threshold', () => {
      const alerts: any[] = [];
      monitor.onAlert(alert => alerts.push(alert));

      // Mock high memory usage
      const mockMemory = {
        usedJSHeapSize: 600 * 1024 * 1024, // 600MB
        totalJSHeapSize: 700 * 1024 * 1024,
        jsHeapSizeLimit: 2048 * 1024 * 1024,
      };

      (performance as any).memory = mockMemory;

      monitor.checkMemoryUsage();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('memory');
      expect(alerts[0].message).toContain('Memory usage exceeded threshold');
    });

    it('should handle missing performance.memory gracefully', () => {
      // Ensure performance.memory doesn't exist
      delete (performance as any).memory;

      expect(() => monitor.checkMemoryUsage()).not.toThrow();

      const metrics = monitor.getMetrics();
      expect(metrics.memoryUsage).toBe(0);
    });
  });

  describe('alert management', () => {
    it('should subscribe and unsubscribe from alerts', () => {
      const alerts1: any[] = [];
      const alerts2: any[] = [];

      const unsubscribe1 = monitor.onAlert(alert => alerts1.push(alert));
      const unsubscribe2 = monitor.onAlert(alert => alerts2.push(alert));

      // Trigger an alert by setting a very low threshold
      monitor.updateThresholds({ maxRenderTime: 0.1 }); // Very low threshold
      const stopMeasurement = monitor.startRenderMeasurement();

      // Simulate some processing time to exceed the threshold
      const start = performance.now();
      while (performance.now() - start < 1) {
        // Busy wait to ensure we exceed the threshold
      }
      stopMeasurement();

      expect(alerts1).toHaveLength(1);
      expect(alerts2).toHaveLength(1);

      // Unsubscribe one listener
      unsubscribe1();

      // Trigger another alert
      const stopMeasurement2 = monitor.startRenderMeasurement();
      const start2 = performance.now();
      while (performance.now() - start2 < 1) {
        // Busy wait to ensure we exceed the threshold
      }
      stopMeasurement2();

      expect(alerts1).toHaveLength(1); // Should not have increased
      expect(alerts2).toHaveLength(2); // Should have increased
    });

    it('should limit alert history size', () => {
      monitor.updateThresholds({ maxRenderTime: 1 });

      // Generate more alerts than the limit
      for (let i = 0; i < 150; i++) {
        const stopMeasurement = monitor.startRenderMeasurement();
        stopMeasurement(); // Immediate trigger
      }

      const allAlerts = monitor.getAlerts();
      expect(allAlerts.length).toBeLessThanOrEqual(100);
    });

    it('should filter alerts by time window', () => {
      const now = Date.now();

      // Create an old alert
      const oldAlert = {
        type: 'render' as const,
        message: 'Old alert',
        threshold: 100,
        actual: 150,
        timestamp: now - 120000, // 2 minutes ago
      };

      // Manually add old alert (since we can't easily create time-based alerts in tests)
      monitor['alerts'].push(oldAlert);

      // Get recent alerts (last minute)
      const recentAlerts = monitor.getAlerts(60000);
      const allAlerts = monitor.getAlerts();

      expect(recentAlerts).not.toContain(oldAlert);
      expect(allAlerts).toContain(oldAlert);
    });
  });

  describe('report generation', () => {
    it('should generate performance report', () => {
      monitor['metrics'] = {
        renderTime: 45.5,
        updateTime: 23.2,
        memoryUsage: 128.7,
        operationCount: 42,
        lastUpdate: Date.now(),
      };

      const report = monitor.generateReport();

      expect(report).toContain('Performance Report');
      expect(report).toContain('Render Time: 45.50ms');
      expect(report).toContain('Update Time: 23.20ms');
      expect(report).toContain('Memory Usage: 128.70MB');
      expect(report).toContain('Total Operations: 42');
    });

    it('should include alerts in report', () => {
      monitor['alerts'] = [
        {
          type: 'render',
          message: 'Render too slow',
          threshold: 100,
          actual: 150,
          timestamp: Date.now(),
        },
      ];

      const report = monitor.generateReport();

      expect(report).toContain('Recent Alerts (Last Minute): 1');
      expect(report).toContain('[RENDER] Render too slow');
      expect(report).toContain('WARNING');
    });

    it('should show healthy status when no alerts', () => {
      const report = monitor.generateReport();

      expect(report).toContain('Recent Alerts (Last Minute): 0');
      expect(report).toContain('Status: HEALTHY');
    });
  });
});

describe('SearchDebouncer', () => {
  let debouncer: SearchDebouncer;

  beforeEach(() => {
    debouncer = new SearchDebouncer(100); // 100ms debounce time
  });

  afterEach(() => {
    debouncer.reset();
  });

  it('should debounce function calls', async () => {
    const mockFunction = {
      calls: [] as Array<Array<any>>,
      mockResolvedValue: function(value: any) {
        this.return = Promise.resolve(value);
        return this;
      },
      mockImplementation: function(fn: Function) {
        this.impl = fn;
        return this;
      }
    };
    mockFunction.mockResolvedValue('result');
    mockFunction.mockImplementation((...args: any[]) => {
      mockFunction.calls.push(args);
      return mockFunction.return;
    });

    const debouncedFn = debouncer.debounce((...args: any[]) => mockFunction.impl(...args));

    // Call multiple times rapidly
    debouncedFn('query1');
    debouncedFn('query2');
    debouncedFn('query3');

    // Should not have been called yet
    expect(mockFunction.calls.length).toBe(0);

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should have been called once with last argument
    expect(mockFunction.calls.length).toBe(1);
    expect(mockFunction.calls[0]).toEqual(['query3']);
  });

  it('should call debounce start/end callbacks', async () => {
    const onStartCalls: Array<any> = [];
    const onEndCalls: Array<any> = [];
    const onStart = (...args: any[]) => onStartCalls.push(args);
    const onEnd = (...args: any[]) => onEndCalls.push(args);
    const mockFunction = () => Promise.resolve('result');

    const debouncedFn = debouncer.debounce(mockFunction, onStart, onEnd);

    debouncedFn('test');

    expect(onStartCalls.length).toBe(1);
    expect(onEndCalls.length).toBe(0);

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(onEndCalls.length).toBe(1);
  });

  it('should cancel pending search', async () => {
    let callCount = 0;
    const mockFunction = () => {
      callCount++;
      return Promise.resolve('result');
    };
    const debouncedFn = debouncer.debounce(mockFunction);

    debouncedFn('test');

    // Cancel before debounce completes
    debouncer.cancel();

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(callCount).toBe(0);
  });

  it('should track search statistics', async () => {
    let callCount = 0;
    const mockFunction = () => {
      callCount++;
      return Promise.resolve('result');
    };
    const debouncedFn = debouncer.debounce(mockFunction);

    const initialStats = debouncer.getStats();
    expect(initialStats.searchCount).toBe(0);

    debouncedFn('test1');
    await new Promise(resolve => setTimeout(resolve, 150));

    const afterFirstSearch = debouncer.getStats();
    expect(afterFirstSearch.searchCount).toBe(1);
    expect(afterFirstSearch.lastSearchTime).toBeGreaterThan(0);

    debouncedFn('test2');
    const duringDebounce = debouncer.getStats();
    expect(duringDebounce.isPending).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 150));

    const afterSecondSearch = debouncer.getStats();
    expect(afterSecondSearch.searchCount).toBe(2);
    expect(afterSecondSearch.isPending).toBe(false);
  });

  it('should handle function errors', async () => {
    const onStartCalls: Array<any> = [];
    const onEndCalls: Array<any> = [];
    const onStart = (...args: any[]) => onStartCalls.push(args);
    const onEnd = (...args: any[]) => onEndCalls.push(args);
    const mockFunction = () => Promise.reject(new Error('Search failed'));

    const debouncedFn = debouncer.debounce(mockFunction, onStart, onEnd);

    await expect(debouncedFn('test')).rejects.toThrow('Search failed');
    expect(onStartCalls.length).toBe(1);
    expect(onEndCalls.length).toBe(1);
  });
});

describe('createDebouncedSearch', () => {
  it('should create debounced search with helpers', async () => {
    let callArgs: Array<any> = [];
    const mockFunction = (...args: any[]) => {
      callArgs.push(args);
      return Promise.resolve('result');
    };
    const debouncedSearch = createDebouncedSearch(mockFunction, 50);

    expect(typeof debouncedSearch.search).toBe('function');
    expect(typeof debouncedSearch.cancel).toBe('function');
    expect(typeof debouncedSearch.getStats).toBe('function');
    expect(typeof debouncedSearch.reset).toBe('function');

    debouncedSearch.search('test');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(callArgs.length).toBe(1);
    expect(callArgs[0]).toEqual(['test']);
  });

  it('should provide access to debouncer methods', () => {
    const mockFunction = () => {};
    const debouncedSearch = createDebouncedSearch(mockFunction);

    const stats = debouncedSearch.getStats();
    expect(stats).toHaveProperty('searchCount');
    expect(stats).toHaveProperty('debounceTime');
    expect(stats).toHaveProperty('isPending');

    debouncedSearch.reset();
    const resetStats = debouncedSearch.getStats();
    expect(resetStats.searchCount).toBe(0);
  });
});

describe('usePerformanceMonitor', () => {
  it('should create performance monitor with component name', () => {
    const { monitor, componentName, measureRender, measureUpdate } =
      usePerformanceMonitor('TestComponent');

    expect(monitor).toBeInstanceOf(PerformanceMonitor);
    expect(componentName).toBe('TestComponent');
    expect(typeof measureRender).toBe('function');
    expect(typeof measureUpdate).toBe('function');
  });

  it('should measure render operations', () => {
    const { measureRender, monitor } = usePerformanceMonitor('TestComponent');

    const stopMeasurement = measureRender();

    // Simulate render work
    const start = performance.now();
    while (performance.now() - start < 2) {
      // Busy wait
    }

    stopMeasurement();

    const metrics = monitor.getMetrics();
    expect(metrics.renderTime).toBeGreaterThan(1);
    expect(metrics.operationCount).toBe(1);
  });

  it('should measure update operations', () => {
    const { measureUpdate, monitor } = usePerformanceMonitor('TestComponent');

    const stopMeasurement = measureUpdate('test-operation');

    // Simulate update work
    const start = performance.now();
    while (performance.now() - start < 2) {
      // Busy wait
    }

    stopMeasurement();

    const metrics = monitor.getMetrics();
    expect(metrics.updateTime).toBeGreaterThan(1);
    expect(metrics.operationCount).toBe(1);
  });
});

describe('globalPerformanceMonitor', () => {
  it('should be a singleton instance', () => {
    expect(globalPerformanceMonitor).toBeInstanceOf(PerformanceMonitor);
  });

  it('should maintain state across uses', () => {
    const initialMetrics = globalPerformanceMonitor.getMetrics();
    const stopMeasurement = globalPerformanceMonitor.startRenderMeasurement();
    stopMeasurement();

    const newMetrics = globalPerformanceMonitor.getMetrics();
    expect(newMetrics.operationCount).toBe(initialMetrics.operationCount + 1);
  });
});

describe('setupGlobalPerformanceMonitoring', () => {
  let originalSetInterval: typeof setInterval;
  let originalConsoleWarn: typeof console.warn;
  let setIntervalCalls: Array<any>;
  let consoleCalls: Array<string>;

  beforeEach(() => {
    originalSetInterval = global.setInterval;
    originalConsoleWarn = console.warn;
    setIntervalCalls = [];
    consoleCalls = [];

    global.setInterval = ((callback: Function, delay: number) => {
      setIntervalCalls.push([callback, delay]);
      return 123; // Mock timer ID
    }) as typeof setInterval;

    console.warn = (message: string) => {
      consoleCalls.push(message);
    };
  });

  afterEach(() => {
    global.setInterval = originalSetInterval;
    console.warn = originalConsoleWarn;
  });

  it('should set up periodic monitoring', () => {
    setupGlobalPerformanceMonitoring();

    expect(setIntervalCalls.length).toBe(2);
    expect(setIntervalCalls[0][1]).toBe(5000); // Memory check
    expect(setIntervalCalls[1][1]).toBe(1000); // Operation rate check
    expect(typeof setIntervalCalls[0][0]).toBe('function');
    expect(typeof setIntervalCalls[1][0]).toBe('function');
  });

  it('should log alerts in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    setupGlobalPerformanceMonitoring();

    // Trigger an alert manually
    globalPerformanceMonitor.updateThresholds({ maxRenderTime: 1 });

    // Simulate a render measurement that takes longer than threshold
    const stopMeasurement = globalPerformanceMonitor.startRenderMeasurement();

    // Use busy wait to simulate time passing (like other tests in this file)
    const start = performance.now();
    while (performance.now() - start < 2) {
      // Busy wait for 2ms (longer than 1ms threshold)
    }

    stopMeasurement();

    expect(consoleCalls.length).toBeGreaterThan(0);
    expect(consoleCalls.some(call => call.includes('[Performance Alert]'))).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });
});
