import type { AnalysisCache, CacheStats, ProjectConfiguration } from './analysis-context.js';
import type { ContextFactoryConfig } from './analysis-context.js';
import type { ToolResult } from '../plugins/analysis-plugin.js';

/**
 * Memory cache entry
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * LRU cache configuration
 */
interface LRUCacheConfig {
  maxSize: number;
  ttl: number;
  cleanupInterval: number;
}

/**
 * In-memory LRU cache implementation
 */
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: LRUCacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: LRUCacheConfig) {
    this.config = config;
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Ensure cache size limit
    while (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let hits = 0;
    let misses = 0;
    let totalAccesses = 0;

    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
      hits += entry.accessCount - 1; // First access is a miss
    }

    misses = this.cache.size;

    return {
      hits,
      misses,
      sets: this.cache.size,
      deletes: 0, // Not tracked in this implementation
      size: this.cache.size,
      hitRate: totalAccesses > 0 ? hits / totalAccesses : 0
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let cleanedCount = 0;
    const _now = Date.now();

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Destroy cache
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
}

/**
 * In-memory analysis cache implementation
 */
export class MemoryCache implements AnalysisCache {
  private config: ContextFactoryConfig;
  private cache: LRUCache<unknown>;
  private projectConfigCache: LRUCache<ProjectConfiguration>;
  private pluginResultCache: LRUCache<ToolResult>;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0
  };

  constructor(config: ContextFactoryConfig) {
    this.config = config;

    this.cache = new LRUCache({
      maxSize: config.maxCacheSize,
      ttl: config.cacheTtl,
      cleanupInterval: 60000 // 1 minute
    });

    this.projectConfigCache = new LRUCache({
      maxSize: 100, // Limited number of project configs
      ttl: config.cacheTtl * 10, // Longer TTL for project configs
      cleanupInterval: 300000 // 5 minutes
    });

    this.pluginResultCache = new LRUCache({
      maxSize: config.maxCacheSize / 2, // Half the size for plugin results
      ttl: config.cacheTtl,
      cleanupInterval: 60000 // 1 minute
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const result = this.cache.get(key) as T | null;

    if (result !== null) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    this.updateHitRate();
    return result;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    this.cache.set(key, value, ttlMs ?? this.config.cacheTtl);
    this.stats.sets++;
    this.stats.size = this.cache.size();
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    const result = this.cache.delete(key);
    if (result) {
      this.stats.deletes++;
      this.stats.size = this.cache.size();
    }
    return result;
  }

  /**
   * Clear cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.projectConfigCache.clear();
    this.pluginResultCache.clear();
    this.stats.size = 0;
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  /**
   * Get project configuration
   */
  async getProjectConfig(projectPath: string): Promise<ProjectConfiguration | null> {
    return this.projectConfigCache.get(projectPath);
  }

  /**
   * Set project configuration
   */
  async setProjectConfig(projectPath: string, config: ProjectConfiguration): Promise<void> {
    this.projectConfigCache.set(projectPath, config);
  }

  /**
   * Get plugin result
   */
  async getPluginResult(pluginName: string, contextHash: string): Promise<ToolResult | null> {
    const key = `plugin:${pluginName}:${contextHash}`;
    return this.pluginResultCache.get(key);
  }

  /**
   * Set plugin result
   */
  async setPluginResult(pluginName: string, contextHash: string, result: ToolResult): Promise<void> {
    const key = `plugin:${pluginName}:${contextHash}`;
    this.pluginResultCache.set(key, result);
  }

  /**
   * Invalidate project-related cache entries
   */
  async invalidateProject(projectPath: string): Promise<void> {
    // Remove project config
    this.projectConfigCache.delete(projectPath);

    // Remove plugin results related to this project
    // This is a simplified implementation - in reality, you'd track project-context relationships
    const keysToDelete: string[] = [];

    // Note: This is a simplified approach. A more sophisticated implementation
    // would maintain a mapping of project paths to cache keys.
    for (let i = 0; i < this.pluginResultCache.size(); i++) {
      // This is a placeholder - actual implementation would need to expose cache internals
      // or maintain a separate index
    }

    for (const key of keysToDelete) {
      this.pluginResultCache.delete(key);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const mainStats = this.cache.getStats();
    const projectStats = this.projectConfigCache.getStats();
    const pluginStats = this.pluginResultCache.getStats();

    return {
      hits: mainStats.hits + projectStats.hits + pluginStats.hits,
      misses: mainStats.misses + projectStats.misses + pluginStats.misses,
      sets: mainStats.sets + projectStats.sets + pluginStats.sets,
      deletes: mainStats.deletes + projectStats.deletes + pluginStats.deletes,
      size: mainStats.size + projectStats.size + pluginStats.size,
      hitRate: this.calculateOverallHitRate(mainStats, projectStats, pluginStats)
    };
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<number> {
    const mainCleanup = this.cache.cleanup();
    const projectCleanup = this.projectConfigCache.cleanup();
    const pluginCleanup = this.pluginResultCache.cleanup();

    const totalCleaned = mainCleanup + projectCleanup + pluginCleanup;
    this.stats.size = this.cache.size() + this.projectConfigCache.size() + this.pluginResultCache.size();

    return totalCleaned;
  }

  /**
   * Destroy cache
   */
  destroy(): void {
    this.cache.destroy();
    this.projectConfigCache.destroy();
    this.pluginResultCache.destroy();
  }

  /**
   * Generate context hash for caching
   */
  static generateContextHash(context: unknown): string {
    // Simple hash function - in production, use a proper hashing algorithm
    const str = JSON.stringify(context, context && typeof context === 'object' ? Object.keys(context).sort() : undefined);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  // Private methods

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Calculate overall hit rate
   */
  private calculateOverallHitRate(
    mainStats: CacheStats,
    projectStats: CacheStats,
    pluginStats: CacheStats
  ): number {
    const totalHits = mainStats.hits + projectStats.hits + pluginStats.hits;
    const totalAccesses = (mainStats.hits + mainStats.misses) +
                        (projectStats.hits + projectStats.misses) +
                        (pluginStats.hits + pluginStats.misses);

    return totalAccesses > 0 ? totalHits / totalAccesses : 0;
  }
}