// Core analysis engine
export { AnalysisEngine } from './analysis-engine.js';
export type { AnalysisEngineConfig, AnalysisEngineEvents, AnalysisProgress } from './analysis-engine.js';

// Task scheduling and execution
export { TaskScheduler } from './task-scheduler.js';
export type {
  ScheduledTask,
  TaskResult,
  TaskStatus,
  WorkerPoolConfig,
  TaskSchedulerEvents
} from './task-scheduler.js';

// Context management
export { AnalysisContextFactory, AnalysisContextManager } from './analysis-context.js';
export type {
  EnhancedAnalysisContext,
  ContextFactoryConfig,
  ContextValidationResult,
  AnalysisCache,
  CacheStats
} from './analysis-context.js';

// Memory cache
export { MemoryCache } from './memory-cache.js';

// Result normalization and aggregation
export { ResultNormalizer } from './result-normalizer.js';
export type {
  NormalizationRule,
  NormalizedIssue,
  NormalizedMetrics,
  NormalizedResult
} from './result-normalizer.js';

export { ResultAggregator } from './result-aggregator.js';
export type {
  AggregationConfig,
  IssueStatistics,
  AggregatedCoverage,
  AggregatedPerformance,
  AggregatedSummary
} from './result-aggregator.js';

// Scoring algorithm
export { ScoringAlgorithm } from './scoring-algorithm.js';
export type {
  ScoringConfig,
  ScoringBreakdown,
  QualityDimensions
} from './scoring-algorithm.js';

// Performance optimization
export { PerformanceOptimizer } from './performance-optimizer.js';
export type {
  PerformanceOptimizerConfig,
  PerformanceMetrics,
  OptimizationRecommendation
} from './performance-optimizer.js';

// Resource management
export { ResourceManager } from './resource-manager.js';
export type {
  ResourceConfig,
  ResourceStats,
  ResourceRequest
} from './resource-manager.js';

// Error handling and graceful degradation
export { ErrorHandler } from './error-handler.js';
export type {
  ErrorClassification,
  ErrorSeverity,
  RecoveryStrategy,
  AnalysisError,
  ErrorHandlingConfig,
  ErrorStats
} from './error-handler.js';

export { GracefulDegradationManager } from './graceful-degradation.js';
export type {
  DegradationLevel,
  DegradationStrategy,
  HealthMetrics
} from './graceful-degradation.js';

// Result reporting and CLI integration
export { ResultReporter } from './result-reporter.js';
export type {
  ReportFormat,
  ReportConfig,
  ReportGenerationOptions,
  GeneratedReport
} from './result-reporter.js';

export { CLIIntegrationManager, CLIOutputFormatter, CLIProgressIndicator } from '../cli/cli-integration.js';
export type {
  CLICommandOptions,
  CLIConfiguration,
  CLIOutputFormat
} from '../cli/cli-integration.js';

// Coverage analysis
export { CoverageAnalysisEngine } from './coverage-analysis-engine.js';
export type {
  CoverageReport,
  CoverageSummary,
  CoverageConfiguration
} from '../types/coverage.js';