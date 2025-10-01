import type { AnalysisPlugin } from './analysis-plugin.js';
import type { Logger } from './analysis-plugin.js';

/**
 * Dependency graph node
 */
interface DependencyNode {
  plugin: AnalysisPlugin;
  dependencies: string[];
  dependents: string[];
  resolved: boolean;
  visiting: boolean;
}

/**
 * Plugin dependency resolver for managing plugin relationships
 */
export class PluginDependencyResolver {
  private logger: Logger;
  private dependencyGraph = new Map<string, DependencyNode>();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Add a plugin to the dependency graph
   */
  addPlugin(plugin: AnalysisPlugin): void {
    const dependencies = plugin.dependencies || [];

    this.dependencyGraph.set(plugin.name, {
      plugin,
      dependencies,
      dependents: [],
      resolved: false,
      visiting: false
    });

    // Update dependents for existing plugins
    for (const dep of dependencies) {
      const depNode = this.dependencyGraph.get(dep);
      if (depNode) {
        depNode.dependents.push(plugin.name);
      }
    }

    this.logger.debug(`Added plugin ${plugin.name} with dependencies: [${dependencies.join(', ')}]`);
  }

  /**
   * Remove a plugin from the dependency graph
   */
  removePlugin(pluginName: string): void {
    const node = this.dependencyGraph.get(pluginName);
    if (!node) return;

    // Remove from dependents of dependencies
    for (const dep of node.dependencies) {
      const depNode = this.dependencyGraph.get(dep);
      if (depNode) {
        depNode.dependents = depNode.dependents.filter(name => name !== pluginName);
      }
    }

    this.dependencyGraph.delete(pluginName);
    this.logger.debug(`Removed plugin ${pluginName} from dependency graph`);
  }

  /**
   * Validate plugin dependencies
   */
  validateDependencies(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [name, node] of this.dependencyGraph) {
      // Check for missing dependencies
      for (const dep of node.dependencies) {
        if (!this.dependencyGraph.has(dep)) {
          errors.push(`Plugin ${name} depends on missing plugin: ${dep}`);
        }
      }

      // Check for circular dependencies
      const circularPath = this.detectCircularDependency(name);
      if (circularPath) {
        errors.push(`Circular dependency detected: ${circularPath.join(' -> ')}`);
      }

      // Check for self-dependencies
      if (node.dependencies.includes(name)) {
        errors.push(`Plugin ${name} depends on itself`);
      }
    }

    // Check for orphaned plugins (no dependents and not a root dependency)
    const orphanedPlugins: string[] = [];
    for (const [name, node] of this.dependencyGraph) {
      if (node.dependents.length === 0 && node.dependencies.length === 0) {
        orphanedPlugins.push(name);
      }
    }

    if (orphanedPlugins.length > 0) {
      warnings.push(`Orphaned plugins detected (no dependencies or dependents): ${orphanedPlugins.join(', ')}`);
    }

    const valid = errors.length === 0;

    if (!valid) {
      this.logger.error('Dependency validation failed:', errors);
    }

    if (warnings.length > 0) {
      this.logger.warn('Dependency validation warnings:', warnings);
    }

    return { valid, errors, warnings };
  }

  /**
   * Resolve plugin execution order
   */
  resolveExecutionOrder(): string[] {
    // Reset resolution state
    for (const node of this.dependencyGraph.values()) {
      node.resolved = false;
      node.visiting = false;
    }

    const executionOrder: string[] = [];

    for (const [name] of this.dependencyGraph) {
      if (!this.dependencyGraph.get(name)?.resolved) {
        this.topologicalSort(name, executionOrder);
      }
    }

    this.logger.debug(`Resolved execution order: [${executionOrder.join(' -> ')}]`);
    return executionOrder;
  }

  /**
   * Get plugins that can be executed in parallel
   */
  getParallelGroups(): string[][] {
    const executionOrder = this.resolveExecutionOrder();
    const groups: string[][] = [];
    const remaining = new Set(executionOrder);

    while (remaining.size > 0) {
      const currentGroup: string[] = [];
      const toRemove: string[] = [];

      for (const pluginName of remaining) {
        const node = this.dependencyGraph.get(pluginName);
        if (!node) continue;

        // Check if all dependencies are already executed
        const dependenciesExecuted = node.dependencies.every(dep => !remaining.has(dep));

        if (dependenciesExecuted) {
          currentGroup.push(pluginName);
          toRemove.push(pluginName);
        }
      }

      if (currentGroup.length === 0) {
        // This should not happen if dependencies are valid
        throw new Error('Circular dependency detected during parallel grouping');
      }

      groups.push(currentGroup);

      for (const pluginName of toRemove) {
        remaining.delete(pluginName);
      }
    }

    this.logger.debug(`Generated ${groups.length} parallel groups for execution`);
    return groups;
  }

  /**
   * Get dependency levels (how deep a plugin is in the dependency chain)
   */
  getDependencyLevels(): Record<string, number> {
    const levels: Record<string, number> = {};

    for (const [name] of this.dependencyGraph) {
      levels[name] = this.calculateDependencyLevel(name);
    }

    return levels;
  }

  /**
   * Get critical path (longest dependency chain)
   */
  getCriticalPath(): string[] {
    let criticalPath: string[] = [];
    let maxLength = 0;

    for (const [name] of this.dependencyGraph) {
      const path = this.getDependencyPath(name);
      if (path.length > maxLength) {
        maxLength = path.length;
        criticalPath = path;
      }
    }

    return criticalPath;
  }

  /**
   * Get plugins that depend on a given plugin
   */
  getDependents(pluginName: string): string[] {
    const node = this.dependencyGraph.get(pluginName);
    return node ? [...node.dependents] : [];
  }

  /**
   * Get all dependencies (transitive) for a plugin
   */
  getAllDependencies(pluginName: string): string[] {
    const node = this.dependencyGraph.get(pluginName);
    if (!node) return [];

    const allDeps = new Set<string>();
    this.collectDependenciesTransitive(pluginName, allDeps);

    return Array.from(allDeps);
  }

  /**
   * Check if adding a plugin would create conflicts
   */
  checkCompatibility(plugin: AnalysisPlugin): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for version conflicts with existing plugins
    for (const [name, node] of this.dependencyGraph) {
      if (name === plugin.name) {
        errors.push(`Plugin ${name} already exists`);
        continue;
      }

      // Check for API compatibility based on interface assumptions
      if (this.detectApiConflict(node.plugin, plugin)) {
        warnings.push(`Plugin ${plugin.name} may have API conflicts with ${name}`);
      }
    }

    // Check dependency compatibility
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        const depNode = this.dependencyGraph.get(dep);
        if (depNode && !this.isVersionCompatible(plugin, depNode.plugin)) {
          errors.push(`Plugin ${plugin.name} requires incompatible version of ${dep}`);
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Clear the dependency graph
   */
  clear(): void {
    this.dependencyGraph.clear();
    this.logger.debug('Dependency graph cleared');
  }

  /**
   * Get dependency graph statistics
   */
  getStatistics(): {
    totalPlugins: number;
    totalDependencies: number;
    averageDependencies: number;
    maxDependencyDepth: number;
    criticalPathLength: number;
  } {
    const totalPlugins = this.dependencyGraph.size;
    let totalDependencies = 0;
    let maxDepth = 0;

    for (const node of this.dependencyGraph.values()) {
      totalDependencies += node.dependencies.length;
      const depth = this.calculateDependencyLevel(node.plugin.name);
      maxDepth = Math.max(maxDepth, depth);
    }

    const criticalPath = this.getCriticalPath();

    return {
      totalPlugins,
      totalDependencies,
      averageDependencies: totalDependencies / Math.max(totalPlugins, 1),
      maxDependencyDepth: maxDepth,
      criticalPathLength: criticalPath.length
    };
  }

  /**
   * Topological sort for dependency resolution
   */
  private topologicalSort(pluginName: string, result: string[]): void {
    const node = this.dependencyGraph.get(pluginName);
    if (!node) return;

    if (node.resolved) return;
    if (node.visiting) {
      throw new Error(`Circular dependency detected involving ${pluginName}`);
    }

    node.visiting = true;

    // Resolve dependencies first
    for (const dep of node.dependencies) {
      this.topologicalSort(dep, result);
    }

    node.visiting = false;
    node.resolved = true;
    result.push(pluginName);
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependency(startName: string): string[] | null {
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (pluginName: string): boolean => {
      if (path.includes(pluginName)) {
        const cycleStart = path.indexOf(pluginName);
        return path.slice(cycleStart).length > 1;
      }

      if (visited.has(pluginName)) return false;

      visited.add(pluginName);
      path.push(pluginName);

      const node = this.dependencyGraph.get(pluginName);
      if (node) {
        for (const dep of node.dependencies) {
          if (dfs(dep)) return true;
        }
      }

      path.pop();
      return false;
    };

    return dfs(startName) ? path : null;
  }

  /**
   * Calculate dependency level for a plugin
   */
  private calculateDependencyLevel(pluginName: string): number {
    const node = this.dependencyGraph.get(pluginName);
    if (!node || node.dependencies.length === 0) return 0;

    let maxLevel = 0;
    for (const dep of node.dependencies) {
      const depLevel = this.calculateDependencyLevel(dep);
      maxLevel = Math.max(maxLevel, depLevel);
    }

    return maxLevel + 1;
  }

  /**
   * Get dependency path for a plugin
   */
  private getDependencyPath(pluginName: string): string[] {
    const node = this.dependencyGraph.get(pluginName);
    if (!node || node.dependencies.length === 0) return [pluginName];

    let longestPath: string[] = [pluginName];

    for (const dep of node.dependencies) {
      const depPath = this.getDependencyPath(dep);
      if (depPath.length > longestPath.length - 1) {
        longestPath = [...depPath, pluginName];
      }
    }

    return longestPath;
  }

  /**
   * Collect all transitive dependencies
   */
  private collectDependenciesTransitive(pluginName: string, result: Set<string>): void {
    const node = this.dependencyGraph.get(pluginName);
    if (!node) return;

    for (const dep of node.dependencies) {
      if (!result.has(dep)) {
        result.add(dep);
        this.collectDependenciesTransitive(dep, result);
      }
    }
  }

  /**
   * Detect API conflicts between plugins (simplified heuristic)
   */
  private detectApiConflict(plugin1: AnalysisPlugin, plugin2: AnalysisPlugin): boolean {
    // This is a simplified check - in reality, you'd need more sophisticated API analysis
    return plugin1.name.toLowerCase() === plugin2.name.toLowerCase();
  }

  /**
   * Check version compatibility (simplified)
   */
  private isVersionCompatible(plugin1: AnalysisPlugin, plugin2: AnalysisPlugin): boolean {
    // Simplified version compatibility check
    // In reality, you'd implement semantic versioning checks
    return true;
  }
}

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}