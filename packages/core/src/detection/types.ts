import type { ProjectConfiguration } from '@dev-quality/types';

export interface DetectedProject {
  name: string;
  version: string;
  description: string;
  type: ProjectConfiguration['type'];
  frameworks: string[];
  buildSystems: string[];
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  hasTypeScript: boolean;
  hasTests: boolean;
  isMonorepo?: boolean;
  root: string;
}

export interface DetectedTool {
  name: string;
  version: string;
  configPath: string;
  configFormat: 'json' | 'yaml' | 'js' | 'ts';
  enabled: boolean;
  priority: number;
  config: Record<string, unknown>;
}

export interface ConfigFile {
  path: string;
  format: 'json' | 'yaml' | 'js' | 'ts';
  tool: string;
  config: Record<string, unknown>;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency' | 'peerDependency';
  compatibility: 'compatible' | 'incompatible' | 'unknown';
  issues: string[];
}

export interface ProjectStructure {
  isMonorepo: boolean;
  workspaceType: 'npm' | 'yarn' | 'pnpm' | 'nx' | 'turbo' | 'lerna' | 'rush' | null;
  packages: string[];
  sourceDirectories: string[];
  testDirectories: string[];
  configDirectories: string[];
  complexity: 'simple' | 'medium' | 'complex';
}

export interface DetectionResult {
  project: DetectedProject;
  tools: DetectedTool[];
  configs: ConfigFile[];
  dependencies: DependencyInfo[];
  structure: ProjectStructure;
  issues: string[];
  recommendations: string[];
  timestamp: string;
}

export interface DetectionEngine {
  detectProject(rootPath: string): Promise<DetectedProject>;
  detectTools(rootPath: string): Promise<DetectedTool[]>;
  detectConfigs(rootPath: string): Promise<ConfigFile[]>;
  detectDependencies(rootPath: string): Promise<DependencyInfo[]>;
  detectStructure(rootPath: string): Promise<ProjectStructure>;
  detectAll(rootPath: string): Promise<DetectionResult>;
}

export interface ConfigAnalyzer {
  analyzeConfig(config: ConfigFile): Promise<{
    valid: boolean;
    issues: string[];
    suggestions: string[];
    normalizedConfig: Record<string, unknown>;
  }>;
  validateConfig(config: ConfigFile, tool: string): Promise<boolean>;
  migrateConfig(config: ConfigFile, targetVersion: string): Promise<ConfigFile>;
}

export interface DependencyChecker {
  checkCompatibility(deps: DependencyInfo[]): Promise<{
    compatible: boolean;
    issues: string[];
    recommendations: string[];
  }>;
  getMinimumVersion(tool: string): string;
  getRecommendedVersion(tool: string): string;
}

export interface StructureAnalyzer {
  analyzeStructure(rootPath: string): Promise<ProjectStructure>;
  detectMonorepoType(rootPath: string): Promise<ProjectStructure['workspaceType']>;
  calculateComplexity(structure: ProjectStructure): 'simple' | 'medium' | 'complex';
}
