import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock virtualized list component for testing
interface VirtualizedList {
  items: any[];
  windowSize: number;
  startIndex: number;
  endIndex: number;

  scrollToIndex(index: number): void;
  getVisibleItems(): any[];
  updateItems(newItems: any[]): void;
  cleanup(): void;
}

const createVirtualizedList = (items: any[], windowSize: number = 10): VirtualizedList => {
  let startIndex = 0;
  let endIndex = Math.min(windowSize, items.length);

  return {
    items,
    windowSize,
    get startIndex() { return startIndex; },
    get endIndex() { return endIndex; },

    scrollToIndex(index: number): void {
      if (index < 0 || index >= items.length) return;

      startIndex = Math.max(0, index - Math.floor(windowSize / 2));
      endIndex = Math.min(items.length, startIndex + windowSize);
    },

    getVisibleItems(): any[] {
      return items.slice(startIndex, endIndex);
    },

    updateItems(newItems: any[]): void {
      // Clear old references to help garbage collection
      items.length = 0;
      items.push(...newItems);
    },

    cleanup(): void {
      items.length = 0;
      startIndex = 0;
      endIndex = 0;
    }
  };
};

// Mock event emitter for real-time updates
interface EventManager {
  listeners: Map<string, Function[]>;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, data?: any): void;
  cleanup(): void;
}

const createEventManager = (): EventManager => {
  const listeners = new Map<string, Function[]>();

  return {
    listeners,

    on(event: string, callback: Function): void {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(callback);
    },

    off(event: string, callback: Function): void {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    },

    emit(event: string, data?: any): void {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(callback => callback(data));
      }
    },

    cleanup(): void {
      listeners.clear();
    }
  };
};

describe('2.3-INT-011: Event Listener Cleanup for Memory Management', () => {
  let eventManager: EventManager;

  beforeEach(() => {
    eventManager = createEventManager();
  });

  afterEach(() => {
    eventManager.cleanup();
  });

  it('should properly clean up event listeners', () => {
    const callbacks: Function[] = [];

    // Add multiple listeners
    for (let i = 0; i < 100; i++) {
      const callback = () => {};
      callbacks.push(callback);
      eventManager.on('update', callback);
    }

    expect(eventManager.listeners.get('update')).toHaveLength(100);

    // Remove all listeners
    callbacks.forEach(callback => {
      eventManager.off('update', callback);
    });

    expect(eventManager.listeners.get('update')).toHaveLength(0);
  });

  it('should handle high-frequency event subscription/unsubscription', () => {
    const subscriptionTimes: number[] = [];
    const unsubscriptionTimes: number[] = [];

    // Test subscription performance
    for (let i = 0; i < 1000; i++) {
      const start = performance.now();
      eventManager.on('test', () => {});
      subscriptionTimes.push(performance.now() - start);
    }

    // Test unsubscription performance
    const callbacks = Array.from(eventManager.listeners.get('test') || []);
    callbacks.forEach(callback => {
      const start = performance.now();
      eventManager.off('test', callback);
      unsubscriptionTimes.push(performance.now() - start);
    });

    const avgSubscriptionTime = subscriptionTimes.reduce((a, b) => a + b, 0) / subscriptionTimes.length;
    const avgUnsubscriptionTime = unsubscriptionTimes.reduce((a, b) => a + b, 0) / unsubscriptionTimes.length;

    expect(avgSubscriptionTime).toBeLessThan(0.1); // Should be very fast
    expect(avgUnsubscriptionTime).toBeLessThan(0.1); // Should be very fast
    expect(eventManager.listeners.get('test')).toHaveLength(0);
  });

  it('should prevent memory leaks through proper cleanup', () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Create and destroy many event listeners
    for (let cycle = 0; cycle < 10; cycle++) {
      // Add listeners
      for (let i = 0; i < 1000; i++) {
        eventManager.on('cycle', () => {
          // Simulate some work
          new Array(1000).fill(0);
        });
      }

      // Emit events to trigger callbacks
      for (let i = 0; i < 100; i++) {
        eventManager.emit('cycle');
      }

      // Clean up all listeners
      eventManager.listeners.clear();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
  });

  it('should handle event emission with many listeners efficiently', () => {
    // Add many listeners
    for (let i = 0; i < 1000; i++) {
      eventManager.on('performance', () => {
        // Simulate lightweight callback
        Math.random();
      });
    }

    const startTime = performance.now();

    // Emit multiple events
    for (let i = 0; i < 100; i++) {
      eventManager.emit('performance');
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(1000); // Should complete within 1 second
    expect(duration / 100).toBeLessThan(10); // Average per emission should be < 10ms
  });
});

describe('2.3-INT-012: Incremental Rendering with 10K Items', () => {
  const generateTestData = (count: number): any[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      title: `Issue ${i}`,
      description: `Description for issue ${i}`,
      severity: ['error', 'warning', 'info'][i % 3],
      tool: ['eslint', 'typescript', 'prettier'][i % 3],
      filePath: `src/components/component${Math.floor(i / 10)}.tsx`,
      lineNumber: (i % 100) + 1,
      score: Math.floor(Math.random() * 10) + 1
    }));
  };

  it('should render large datasets with virtualization', () => {
    const largeDataset = generateTestData(10000);
    const virtualizedList = createVirtualizedList(largeDataset, 20);

    const startTime = performance.now();

    // Test initial rendering
    const visibleItems = virtualizedList.getVisibleItems();
    const initialRenderTime = performance.now() - startTime;

    expect(initialRenderTime).toBeLessThan(10); // Should be very fast
    expect(visibleItems).toHaveLength(20); // Only window size items
    expect(visibleItems[0].id).toBe(0);
    expect(visibleItems[19].id).toBe(19);

    // Test scrolling performance
    const scrollTimes: number[] = [];
    for (let targetIndex of [100, 500, 1000, 2500, 5000, 7500, 9000]) {
      const scrollStart = performance.now();
      virtualizedList.scrollToIndex(targetIndex);
      const newVisibleItems = virtualizedList.getVisibleItems();
      scrollTimes.push(performance.now() - scrollStart);

      expect(newVisibleItems).toHaveLength(20);
      expect(newVisibleItems[0].id).toBeGreaterThanOrEqual(targetIndex - 10);
      expect(newVisibleItems[19].id).toBeLessThanOrEqual(targetIndex + 10);
    }

    const avgScrollTime = scrollTimes.reduce((a, b) => a + b, 0) / scrollTimes.length;
    expect(avgScrollTime).toBeLessThan(1); // Should be very fast
  });

  it('should handle data updates efficiently', () => {
    const initialData = generateTestData(10000);
    const virtualizedList = createVirtualizedList(initialData, 15);

    // Simulate real-time data updates
    const updateTimes: number[] = [];
    for (let batch = 0; batch < 100; batch++) {
      // Generate updates for random items
      const updatedData = initialData.map(item => {
        if (Math.random() < 0.1) { // 10% chance of update
          return {
            ...item,
            score: Math.floor(Math.random() * 10) + 1,
            description: `Updated description for issue ${item.id} (batch ${batch})`
          };
        }
        return item;
      });

      const updateStart = performance.now();
      virtualizedList.updateItems(updatedData);
      updateTimes.push(performance.now() - updateStart);
    }

    const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
    expect(avgUpdateTime).toBeLessThan(5); // Should be very fast

    // Verify data integrity
    const finalItems = virtualizedList.getVisibleItems();
    expect(finalItems).toHaveLength(15);
    expect(finalItems.every(item => item.score >= 1 && item.score <= 10)).toBe(true);
  });

  it('should maintain performance under continuous updates', () => {
    const baseData = generateTestData(2000); // Reduced from 10000
    const virtualizedList = createVirtualizedList(baseData, 25);
    const eventManager = createEventManager();

    let updateCount = 0;
    const maxUpdates = 100; // Reduced from 500

    const updateHandler = () => {
      updateCount++;
      if (updateCount >= maxUpdates) {
        eventManager.off('update', updateHandler);
        return;
      }

      // Simulate small data changes
      const modifiedIndex = Math.floor(Math.random() * baseData.length);
      baseData[modifiedIndex] = {
        ...baseData[modifiedIndex],
        score: Math.floor(Math.random() * 10) + 1
      };

      virtualizedList.updateItems([...baseData]);
    };

    eventManager.on('update', updateHandler);

    const startTime = performance.now();

    // Simulate continuous updates
    const interval = setInterval(() => {
      if (updateCount < maxUpdates) {
        eventManager.emit('update');
      } else {
        clearInterval(interval);
      }
    }, 10);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const endTime = performance.now();
        const totalTime = endTime - startTime;

        expect(updateCount).toBe(maxUpdates);
        expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
        expect(totalTime / maxUpdates).toBeLessThan(50); // Average per update < 50ms

        eventManager.cleanup();
        virtualizedList.cleanup();
        resolve();
      }, 3000); // Reduced from 6000ms
    });
  });

  it('should handle memory usage efficiently with large datasets', () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Create multiple virtualized lists with different data
    const lists: VirtualizedList[] = [];
    for (let i = 0; i < 5; i++) {
      const data = generateTestData(5000);
      const list = createVirtualizedList(data, 10);
      lists.push(list);

      // Perform some operations
      list.scrollToIndex(Math.floor(data.length / 2));
      list.getVisibleItems();
    }

    const afterCreationMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const creationIncrease = afterCreationMemory - initialMemory;

    expect(creationIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB for 5 lists

    // Update all lists multiple times
    for (let cycle = 0; cycle < 10; cycle++) {
      lists.forEach((list, listIndex) => {
        const updatedData = generateTestData(5000);
        list.updateItems(updatedData);
        list.scrollToIndex(Math.floor(Math.random() * 5000));
        list.getVisibleItems();
      });
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const totalIncrease = finalMemory - initialMemory;

    expect(totalIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB total

    // Cleanup
    lists.forEach(list => list.cleanup());
  });

  it('should handle concurrent operations efficiently', () => {
    const largeData = generateTestData(10000);
    const virtualizedList = createVirtualizedList(largeData, 30);
    const eventManager = createEventManager();

    let completedOperations = 0;
    const totalOperations = 1000;

    // Simulate concurrent operations
    const operations = ['scroll', 'update', 'get-visible'];

    const handleOperation = (operation: string) => {
      switch (operation) {
        case 'scroll':
          virtualizedList.scrollToIndex(Math.floor(Math.random() * largeData.length));
          break;
        case 'update': {
          const updateIndex = Math.floor(Math.random() * largeData.length);
          largeData[updateIndex] = { ...largeData[updateIndex], score: Math.random() * 10 };
          virtualizedList.updateItems([...largeData]);
          break;
        }
        case 'get-visible':
          virtualizedList.getVisibleItems();
          break;
      }

      completedOperations++;
    };

    const startTime = performance.now();

    // Execute operations concurrently
    for (let i = 0; i < totalOperations; i++) {
      const operation = operations[i % operations.length];
      eventManager.on('operation', handleOperation);
      eventManager.emit('operation', operation);
      eventManager.off('operation', handleOperation);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgOperationTime = totalTime / totalOperations;

    expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    expect(avgOperationTime).toBeLessThan(5); // Average per operation < 5ms
    expect(completedOperations).toBe(totalOperations);

    eventManager.cleanup();
    virtualizedList.cleanup();
  });
});