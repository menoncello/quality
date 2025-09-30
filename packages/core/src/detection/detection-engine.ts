import { ProjectDetector } from './project-detector';
import { ToolDetector } from './tool-detector';
import { DependencyChecker } from './dependency-checker';
import { StructureAnalyzer } from './structure-analyzer';
import { DetectionCache } from './detection-cache';
import { DetectionResult, DetectionEngine } from './types';

export class AutoConfigurationDetectionEngine implements DetectionEngine {
  private projectDetector: ProjectDetector;
  private toolDetector: ToolDetector;
  private dependencyChecker: DependencyChecker;
  private structureAnalyzer: StructureAnalyzer;
  private cache: DetectionCache;

  constructor(cache?: DetectionCache) {
    this.projectDetector = new ProjectDetector();
    this.toolDetector = new ToolDetector();
    this.dependencyChecker = new DependencyChecker();
    this.structureAnalyzer = new StructureAnalyzer();
    this.cache = cache ?? new DetectionCache();
  }

  async detectProject(rootPath: string) {
    return this.projectDetector.detectProject(rootPath);
  }

  async detectTools(rootPath: string) {
    return this.toolDetector.detectTools(rootPath);
  }

  async detectConfigs(rootPath: string) {
    return this.toolDetector.detectConfigs(rootPath);
  }

  async detectDependencies(rootPath: string) {
    return this.dependencyChecker.detectDependencies(rootPath);
  }

  async detectStructure(rootPath: string) {
    return this.structureAnalyzer.analyzeStructure(rootPath);
  }

  async detectAll(rootPath: string): Promise<DetectionResult> {
    try {
      // Check cache first
      const cachedResult = this.cache.getCachedResult(rootPath);
      if (cachedResult) {
        return cachedResult;
      }

      const [project, tools, configs, dependencies, structure] = await Promise.all([
        this.projectDetector.detectProject(rootPath),
        this.toolDetector.detectTools(rootPath),
        this.toolDetector.detectConfigs(rootPath),
        this.dependencyChecker.detectDependencies(rootPath),
        this.structureAnalyzer.analyzeStructure(rootPath),
      ]);

      const compatibility = await this.dependencyChecker.checkCompatibility(dependencies);
      const issues = this.generateIssues(
        project,
        tools,
        configs,
        dependencies,
        structure,
        compatibility
      );
      const recommendations = this.generateRecommendations(
        project,
        tools,
        configs,
        dependencies,
        structure,
        compatibility
      );

      const result: DetectionResult = {
        project,
        tools,
        configs,
        dependencies,
        structure,
        issues,
        recommendations,
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      this.cache.setCachedResult(rootPath, result);

      return result;
    } catch (error) {
      throw new Error(`Detection failed: ${error}`);
    }
  }

  /**
   * Clear cache for a specific path or all caches
   */
  clearCache(rootPath?: string): void {
    if (rootPath) {
      this.cache.invalidate(rootPath);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  private generateIssues(
    project: any,
    tools: any[],
    _configs: any[],
    _dependencies: any[],
    structure: any,
    compatibility: any
  ): string[] {
    const issues: string[] = [];

    // Project type issues
    if (project.type === 'unknown') {
      issues.push('Could not determine project type');
    }

    // Tool configuration issues
    const enabledTools = tools.filter((t: any) => t.enabled);
    if (enabledTools.length === 0) {
      issues.push('No development tools detected');
    }

    // Dependency issues
    if (compatibility.issues.length > 0) {
      issues.push(...compatibility.issues);
    }

    // Structure issues
    if (structure.sourceDirectories.length === 0) {
      issues.push('No source directories found');
    }

    if (structure.testDirectories.length === 0) {
      issues.push('No test directories found - consider adding tests');
    }

    // Configuration issues
    const hasLinting = tools.some((t: any) => t.name === 'eslint' && t.enabled);
    const hasFormatting = tools.some((t: any) => t.name === 'prettier' && t.enabled);

    if (!hasLinting) {
      issues.push('No linting tool detected - consider adding ESLint');
    }

    if (!hasFormatting) {
      issues.push('No formatting tool detected - consider adding Prettier');
    }

    return issues;
  }

  private generateRecommendations(
    project: any,
    tools: any[],
    configs: any[],
    dependencies: any[],
    structure: any,
    compatibility: any
  ): string[] {
    const recommendations: string[] = [];

    // Add compatibility recommendations
    recommendations.push(...compatibility.recommendations);

    // Tool recommendations
    const toolNames = tools.map((t: any) => t.name);

    if (!toolNames.includes('typescript') && project.hasTypeScript) {
      recommendations.push('Add TypeScript configuration');
    }

    if (!toolNames.includes('vitest') && !toolNames.includes('jest')) {
      recommendations.push('Add a testing framework (Vitest or Jest)');
    }

    // Basic tool recommendations for minimal projects
    if (!toolNames.includes('eslint')) {
      recommendations.push('Add ESLint for code linting and quality checks');
    }

    if (!toolNames.includes('prettier')) {
      recommendations.push('Add Prettier for consistent code formatting');
    }

    // Structure recommendations
    if (structure.complexity === 'complex' && !structure.isMonorepo) {
      recommendations.push('Consider converting to monorepo structure for better organization');
    }

    // Performance recommendations
    if (structure.packages.length > 5 && structure.workspaceType === 'npm') {
      recommendations.push('Consider using pnpm or yarn workspaces for better performance');
    }

    // Configuration recommendations
    if (toolNames.includes('eslint') && !toolNames.includes('prettier')) {
      recommendations.push('Add Prettier for consistent code formatting');
    }

    // Testing recommendations
    if (structure.testDirectories.length === 0) {
      recommendations.push('Set up testing structure with unit and integration tests');
    }

    return recommendations;
  }
}
