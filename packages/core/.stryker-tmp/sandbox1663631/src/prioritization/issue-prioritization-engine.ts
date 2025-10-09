import {
  Issue,
  IssuePrioritization,
  ProjectContext,
  PrioritizationRule,
  IssueTrainingData,
  ModelMetrics,
  TriageSuggestion,
  PrioritizationConfiguration
} from '@dev-quality/types';

/**
 * Main Issue Prioritization Engine interface
 * Provides multi-factor scoring, ML-based classification, and automated triage
 */
export interface IssuePrioritizationEngine {
  /**
   * Prioritize a list of issues using multi-factor analysis
   */
  prioritizeIssues(issues: Issue[], context: ProjectContext): Promise<IssuePrioritization[]>;

  /**
   * Train the ML classification model with historical data
   */
  trainClassificationModel(trainingData: IssueTrainingData[]): Promise<ModelMetrics>;

  /**
   * Update custom prioritization rules
   */
  updatePrioritizationRules(rules: PrioritizationRule[]): Promise<void>;

  /**
   * Generate automated triage suggestions for prioritized issues
   */
  generateTriageSuggestions(prioritizedIssues: IssuePrioritization[]): Promise<TriageSuggestion[]>;

  /**
   * Get current engine configuration
   */
  getConfiguration(): PrioritizationConfiguration;

  /**
   * Update engine configuration
   */
  updateConfiguration(config: Partial<PrioritizationConfiguration>): Promise<void>;

  /**
   * Get model performance metrics
   */
  getModelMetrics(): Promise<ModelMetrics>;

  /**
   * Clear all caches and reset state
   */
  clearCache(): Promise<void>;
}

/**
 * Factory interface for creating prioritization engine instances
 */
export interface IssuePrioritizationEngineFactory {
  createEngine(config?: Partial<PrioritizationConfiguration>): Promise<IssuePrioritizationEngine>;
  createEngineWithDefaults(): Promise<IssuePrioritizationEngine>;
}