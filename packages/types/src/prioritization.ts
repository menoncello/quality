/**
 * Issue Prioritization Engine Types
 * Multi-factor scoring and ML-based classification system
 */

/**
 * Re-export Issue interface for compatibility
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
 * Issue classification result from ML model
 */
export interface IssueClassification {
  category: 'bug' | 'performance' | 'security' | 'maintainability' | 'documentation' | 'feature';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1 scale
  features: ClassificationFeatures;
}

/**
 * Feature set used for ML classification
 */
export interface ClassificationFeatures {
  codeComplexity: number;
  changeFrequency: number;
  teamImpact: number;
  userFacingImpact: number;
  businessCriticality: number;
  technicalDebtImpact: number;
}

/**
 * Project context for issue analysis
 */
export interface IssueContext {
  projectType: string;
  filePath: string;
  componentType: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  teamWorkflow: string;
  recentChanges: boolean;
  businessDomain?: string;
  complexityMetrics: {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    linesOfCode: number;
    dependencies: number;
  };
}

/**
 * Automated triage suggestion
 */
export interface TriageSuggestion {
  action: 'fix-now' | 'schedule' | 'delegate' | 'monitor' | 'ignore';
  priority: number; // 1-10 scale
  estimatedEffort: number; // hours
  assignee?: string;
  deadline?: Date;
  reasoning: string;
  confidence: number; // 0-1 scale
}

/**
 * Complete issue prioritization result
 */
export interface IssuePrioritization {
  id: string;
  issueId: string;
  severity: number; // 1-10 scale
  impact: number; // 1-10 scale
  effort: number; // 1-10 scale (estimated fix effort)
  businessValue: number; // 1-10 scale
  finalScore: number; // Calculated prioritization score
  context: IssueContext;
  classification: IssueClassification;
  triageSuggestion: TriageSuggestion;
  scoringFactors: ScoringFactors;
  metadata: PrioritizationMetadata;
}

/**
 * Individual scoring factors
 */
export interface ScoringFactors {
  severityWeight: number;
  impactWeight: number;
  effortWeight: number;
  businessValueWeight: number;
  contextMultiplier: number;
  classificationBonus: number;
  workflowAdjustment: number;
}

/**
 * Metadata for prioritization process
 */
export interface PrioritizationMetadata {
  processedAt: Date;
  algorithm: string;
  modelVersion?: string;
  processingTime: number; // milliseconds
  cacheHit: boolean;
}

/**
 * Custom prioritization rule
 */
export interface PrioritizationRule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  weight: number;
  enabled: boolean;
  priority: number; // Rule execution order
  metadata: RuleMetadata;
}

/**
 * Rule condition for matching issues
 */
export interface RuleCondition {
  field: string; // e.g., 'severity', 'type', 'filePath'
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean;
  caseSensitive?: boolean;
}

/**
 * Rule action to apply when conditions match
 */
export interface RuleAction {
  type: 'adjustScore' | 'setPriority' | 'skipTriage' | 'customAction';
  parameters: Record<string, unknown>;
}

/**
 * Rule metadata
 */
export interface RuleMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: string;
  lastApplied?: Date;
  applicationCount: number;
}

/**
 * Training data for ML model
 */
export interface IssueTrainingData {
  issueId: string;
  features: ClassificationFeatures;
  actualOutcome: IssueResolutionOutcome;
  context: IssueContext;
  timestamp: Date;
}

/**
 * Historical issue resolution outcome
 */
export interface IssueResolutionOutcome {
  resolutionTime: number; // hours
  effort: number; // 1-10 scale
  success: boolean;
  userFeedback?: number; // 1-5 satisfaction rating
  notes?: string;
}

/**
 * Issue resolution data for rule optimization
 */
export interface IssueResolutionData {
  issueId: string;
  originalPriority: number;
  finalPriority: number;
  resolutionTime: number;
  effort: number;
  success: boolean;
  teamSatisfaction?: number;
  businessImpact: number; // 1-10 scale
  userFeedback?: number;
  resolvedAt: Date;
}

/**
 * ML model performance metrics
 */
export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  trainingDataSize: number;
  validationDataSize: number;
  modelVersion: string;
  trainedAt: Date;
}

/**
 * Validation result for rule validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

/**
 * Project context for prioritization engine
 */
export interface ProjectContext {
  projectConfiguration: unknown; // Will be typed with ProjectConfiguration from index.ts
  teamPreferences: TeamPreferences;
  historicalData: HistoricalData;
  currentSprint?: SprintContext;
}

/**
 * Team workflow preferences
 */
export interface TeamPreferences {
  workflow: 'kanban' | 'scrum' | 'waterfall' | 'custom';
  priorities: {
    performance: number;
    security: number;
    maintainability: number;
    features: number;
  };
  workingHours: {
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
  sprintDuration?: number; // days for scrum
}

/**
 * Historical project data
 */
export interface HistoricalData {
  averageResolutionTime: number;
  commonIssueTypes: string[];
  teamVelocity: number; // issues per sprint
  bugRate: number; // percentage of bugs vs features
  performance: {
    bugFixTime: number;
    featureImplementationTime: number;
    reviewTime: number;
  };
}

/**
 * Current sprint context (for scrum teams)
 */
export interface SprintContext {
  number: number;
  startDate: Date;
  endDate: Date;
  capacity: number; // hours
  currentLoad: number; // hours
  goals: string[];
}

/**
 * Prioritization engine configuration
 */
export interface PrioritizationConfiguration {
  algorithm: 'weighted' | 'ml-enhanced' | 'hybrid';
  weights: {
    severity: number;
    impact: number;
    effort: number;
    businessValue: number;
  };
  mlSettings: {
    enabled: boolean;
    modelPath?: string;
    retrainingThreshold: number;
    confidenceThreshold: number;
  };
  rules: {
    enabled: boolean;
    autoOptimize: boolean;
    conflictResolution: 'first-match' | 'highest-weight' | 'combine';
  };
  caching: {
    enabled: boolean;
    ttl: number; // seconds
    maxSize: number; // entries
  };
}