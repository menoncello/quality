/**
 * Issue Prioritization Engine Module
 * Multi-factor scoring, ML-based classification, and customizable rules
 */

// Core interfaces and types
export * from '@dev-quality/types';

// Main engine interfaces (export type for isolatedModules compatibility)
export type { IssuePrioritizationEngine } from './issue-prioritization-engine';

// Engine implementation
export { IssuePrioritizationEngineImpl } from './prioritization-engine-impl';

// Factory
export { IssuePrioritizationEngineFactoryImpl } from './prioritization-factory';
export type { IssuePrioritizationEngineFactory } from './issue-prioritization-engine';

// Core components
export { ScoringAlgorithm } from './scoring-algorithm';
export { IssueClassifier } from './issue-classifier';
export { RuleEngine } from './rule-engine';

// Advanced components
export { WorkflowIntegration } from './workflow-integration';
export type { WorkflowAnalysis, WorkflowMetrics } from './workflow-integration';
export { TriageEngine } from './triage-engine';
export type {
  TriageRuleRecommendation,
  TriageOutcome,
  TriageEffectivenessReport
} from './triage-engine';

// Default factory instance (lazy initialization to avoid circular dependencies)
export const prioritizationFactory = {
  createEngine: async (config?: Partial<unknown>) => {
    const { IssuePrioritizationEngineFactoryImpl } = await import('./prioritization-factory');
    const factory = new IssuePrioritizationEngineFactoryImpl();
    return factory.createEngine(config);
  },
  createEngineWithDefaults: async () => {
    const { IssuePrioritizationEngineFactoryImpl } = await import('./prioritization-factory');
    const factory = new IssuePrioritizationEngineFactoryImpl();
    return factory.createEngineWithDefaults();
  },
  createPerformanceOptimizedEngine: async () => {
    const { IssuePrioritizationEngineFactoryImpl } = await import('./prioritization-factory');
    const factory = new IssuePrioritizationEngineFactoryImpl();
    return factory.createPerformanceOptimizedEngine();
  },
  createAccuracyOptimizedEngine: async () => {
    const { IssuePrioritizationEngineFactoryImpl } = await import('./prioritization-factory');
    const factory = new IssuePrioritizationEngineFactoryImpl();
    return factory.createAccuracyOptimizedEngine();
  },
  createSmallProjectEngine: async () => {
    const { IssuePrioritizationEngineFactoryImpl } = await import('./prioritization-factory');
    const factory = new IssuePrioritizationEngineFactoryImpl();
    return factory.createSmallProjectEngine();
  },
  createEnterpriseEngine: async () => {
    const { IssuePrioritizationEngineFactoryImpl } = await import('./prioritization-factory');
    const factory = new IssuePrioritizationEngineFactoryImpl();
    return factory.createEnterpriseEngine();
  }
};