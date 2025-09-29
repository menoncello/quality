import { existsSync, statSync } from 'fs';
import { DetectionResult } from './types.js';

/**
 * Cache entry with TTL and modification time tracking
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  mtime?: number;
}

/**
 * Cache options for configuration
 */
interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache entries
}

/**
 * DetectionCache implements the caching strategy specified in Story 1.2 requirements:
 * 1. File system cache with change detection
 * 2. Configuration cache with TTL
 * 3. Dependency cache for resolved trees
 * 4. Analysis results cache
 * 5. Smart cache invalidation based on file modifications
 */
export class DetectionCache {
  private fileCache: Map<string, CacheEntry<string>>;
  private configCache: Map<string, CacheEntry<unknown>>;
  private dependencyCache: Map<string, CacheEntry<unknown>>;
  private resultCache: Map<string, CacheEntry<DetectionResult>>;

  private readonly defaultTTL: number;
  private readonly maxCacheSize: number;

  constructor(options: CacheOptions = {}) {
    this.fileCache = new Map();
    this.configCache = new Map();
    this.dependencyCache = new Map();
    this.resultCache = new Map();

    this.defaultTTL = options.ttl ?? 5 * 60 * 1000; // Default 5 minutes
    this.maxCacheSize = options.maxSize ?? 1000; // Default max 1000 entries
  }

  /**
   * Get cached file content with modification time validation
   */
  getCachedFile(filePath: string): string | null {
    if (!existsSync(filePath)) {
      return null;
    }

    const cached = this.fileCache.get(filePath);
    if (!cached) {
      return null;
    }

    // Check if file has been modified
    const stats = statSync(filePath);
    const currentMtime = stats.mtimeMs;

    if (cached.mtime !== currentMtime) {
      // File changed, invalidate cache
      this.fileCache.delete(filePath);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache file content with modification time tracking
   */
  setCachedFile(filePath: string, content: string): void {
    if (!existsSync(filePath)) {
      return;
    }

    this.ensureCacheSize(this.fileCache);

    const stats = statSync(filePath);
    this.fileCache.set(filePath, {
      data: content,
      timestamp: Date.now(),
      mtime: stats.mtimeMs,
    });
  }

  /**
   * Get cached configuration with TTL validation
   */
  getCachedConfig(key: string): unknown | null {
    const cached = this.configCache.get(key);
    if (!cached) {
      return null;
    }

    // Check TTL
    if (Date.now() - cached.timestamp > this.defaultTTL) {
      this.configCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache configuration with TTL
   */
  setCachedConfig(key: string, data: unknown): void {
    this.ensureCacheSize(this.configCache);

    this.configCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached dependency tree with TTL validation
   */
  getCachedDependencies(rootPath: string): unknown | null {
    const cached = this.dependencyCache.get(rootPath);
    if (!cached) {
      return null;
    }

    // Check TTL
    if (Date.now() - cached.timestamp > this.defaultTTL) {
      this.dependencyCache.delete(rootPath);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache dependency tree with TTL
   */
  setCachedDependencies(rootPath: string, data: unknown): void {
    this.ensureCacheSize(this.dependencyCache);

    this.dependencyCache.set(rootPath, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached detection result with file modification validation
   */
  getCachedResult(rootPath: string): DetectionResult | null {
    const cached = this.resultCache.get(rootPath);
    if (!cached) {
      return null;
    }

    // Check if package.json has been modified (key indicator of project changes)
    const packageJsonPath = `${rootPath}/package.json`;
    if (existsSync(packageJsonPath)) {
      const stats = statSync(packageJsonPath);
      if (cached.mtime && cached.mtime !== stats.mtimeMs) {
        // package.json changed, invalidate result cache
        this.resultCache.delete(rootPath);
        return null;
      }
    }

    // Check TTL
    if (Date.now() - cached.timestamp > this.defaultTTL) {
      this.resultCache.delete(rootPath);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache detection result with modification time tracking
   */
  setCachedResult(rootPath: string, result: DetectionResult): void {
    this.ensureCacheSize(this.resultCache);

    let mtime: number | undefined;
    const packageJsonPath = `${rootPath}/package.json`;
    if (existsSync(packageJsonPath)) {
      const stats = statSync(packageJsonPath);
      mtime = stats.mtimeMs;
    }

    this.resultCache.set(rootPath, {
      data: result,
      timestamp: Date.now(),
      mtime,
    });
  }

  /**
   * Invalidate all caches for a specific path
   */
  invalidate(rootPath: string): void {
    // Remove file cache entries for this path
    for (const [key] of this.fileCache) {
      if (key.startsWith(rootPath)) {
        this.fileCache.delete(key);
      }
    }

    // Remove config cache entries
    for (const [key] of this.configCache) {
      if (key.startsWith(rootPath)) {
        this.configCache.delete(key);
      }
    }

    // Remove dependency cache
    this.dependencyCache.delete(rootPath);

    // Remove result cache
    this.resultCache.delete(rootPath);
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.fileCache.clear();
    this.configCache.clear();
    this.dependencyCache.clear();
    this.resultCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      fileCache: {
        size: this.fileCache.size,
        maxSize: this.maxCacheSize,
      },
      configCache: {
        size: this.configCache.size,
        maxSize: this.maxCacheSize,
      },
      dependencyCache: {
        size: this.dependencyCache.size,
        maxSize: this.maxCacheSize,
      },
      resultCache: {
        size: this.resultCache.size,
        maxSize: this.maxCacheSize,
      },
    };
  }

  /**
   * Ensure cache size doesn't exceed maximum
   */
  private ensureCacheSize<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size >= this.maxCacheSize) {
      // Remove oldest entry (FIFO eviction)
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
  }
}
