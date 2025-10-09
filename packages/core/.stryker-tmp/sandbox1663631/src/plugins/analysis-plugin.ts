/**
 * Base interface for all analysis plugins
 */
export interface AnalysisPlugin {
  name: string;
  version: string;
  dependencies?: string[];

  // Plugin lifecycle
  initialize(config: PluginConfig): Promise<void>;
  execute(context: AnalysisContext): Promise<ToolResult>;
  cleanup?(): Promise<void>;

  // Configuration
  getDefaultConfig(): ToolConfiguration;
  validateConfig(config: ToolConfiguration): ValidationResult;

  // Capabilities
  supportsIncremental(): boolean;
  supportsCache(): boolean;
  getMetrics(): PluginMetrics;
}

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  enabled: boolean;
  timeout: number;
  cacheEnabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  [key: string]: unknown;
}

/**
 * Analysis context provided to plugins during execution
 */
export interface AnalysisContext {
  projectPath: string;
  changedFiles?: string[];
  cache?: CacheInterface;
  logger: Logger;
  signal?: AbortSignal;
  config: ProjectConfiguration;
}

/**
 * Tool result interface returned by plugins
 */
export interface ToolResult {
  toolName: string;
  executionTime: number;
  status: 'success' | 'error' | 'warning';
  issues: Issue[];
  metrics: ToolMetrics;
  coverage?: CoverageData;
  summary?: {
    totalIssues: number;
    totalErrors: number;
    totalWarnings: number;
    totalFixable: number;
    overallScore: number;
    toolCount: number;
    executionTime: number;
  };
  attemptCount?: number;
}

/**
 * Issue representation
 */
export interface Issue {
  id: string;
  type: "error" | "warning" | "info";
  toolName: string;
  filePath: string;
  lineNumber: number;
  message: string;
  ruleId?: string;
  fixable: boolean;
  suggestion?: string;
  score: number; // Basic score - to be enhanced with prioritization
}

/**
 * Tool-specific metrics
 */
export interface ToolMetrics {
  issuesCount: number;
  errorsCount: number;
  warningsCount: number;
  infoCount: number;
  fixableCount: number;
  score: number;
  coverage?: CoverageData;
  [key: string]: unknown;
}

/**
 * Coverage data interface
 */
export interface CoverageData {
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
}

/**
 * Plugin validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Plugin runtime metrics
 */
export interface PluginMetrics {
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  successCount: number;
  errorCount: number;
  lastExecutionTime?: Date;
}

/**
 * Cache interface for plugins
 */
export interface CacheInterface {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * Logger interface for plugins
 */
export interface Logger {
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Tool configuration interface
 */
export interface ToolConfiguration {
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  dependencies?: string[];
}

/**
 * Project configuration interface
 */
export interface ProjectConfiguration {
  name: string;
  version: string;
  tools: ToolConfiguration[];
  [key: string]: unknown;
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  id: string;
  projectId: string;
  timestamp: Date;
  duration: number;
  overallScore: number;
  toolResults: ToolResult[];
  summary: ResultSummary;
  aiPrompts: AIPrompt[];
}

/**
 * Analysis result summary
 */
export interface ResultSummary {
  totalIssues: number;
  totalErrors: number;
  totalWarnings: number;
  totalFixable: number;
  overallScore: number;
  toolCount: number;
  executionTime: number;
}

/**
 * AI prompt for analysis results
 */
export interface AIPrompt {
  id: string;
  type: string;
  title: string;
  description: string;
  issues: Issue[];
  priority: 'low' | 'medium' | 'high';
}