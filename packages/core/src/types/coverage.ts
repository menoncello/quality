/**
 * Enhanced coverage data interfaces for advanced coverage analysis
 */

import { CoverageData } from '../plugins/analysis-plugin';

/**
 * Enhanced coverage data with detailed metrics and analysis
 */
export interface EnhancedCoverageData extends CoverageData {
  // File-level coverage details
  files: FileCoverage[];

  // Critical path analysis
  criticalPaths: CriticalPath[];

  // Coverage quality metrics
  qualityScore: CoverageQualityScore;

  // Trend analysis data
  trends?: CoverageTrend[];

  // Uncovered code analysis
  uncoveredAreas: UncoveredArea[];

  // Coverage recommendations
  recommendations: CoverageRecommendation[];

  // Metadata
  metadata: CoverageMetadata;
}

/**
 * Individual file coverage information
 */
export interface FileCoverage {
  filePath: string;
  relativePath: string;
  lines: LineCoverage[];
  functions: FunctionCoverage[];
  branches: BranchCoverage[];
  statements: StatementCoverage[];

  // File-level metrics
  totalLines: number;
  coveredLines: number;
  totalFunctions: number;
  coveredFunctions: number;
  totalBranches: number;
  coveredBranches: number;
  totalStatements: number;
  coveredStatements: number;

  // Risk assessment
  riskScore: number;
  complexity: number;
  changeFrequency: number;

  // Coverage percentages
  lineCoverage: number;
  functionCoverage: number;
  branchCoverage: number;
  statementCoverage: number;
  overallCoverage: number;
}

/**
 * Line-level coverage details
 */
export interface LineCoverage {
  lineNumber: number;
  count: number;
  covered: boolean;
  isCritical: boolean;
  complexity?: number;
  relatedFunctions?: string[];
}

/**
 * Function-level coverage details
 */
export interface FunctionCoverage {
  name: string;
  startLine: number;
  endLine: number;
  covered: boolean;
  calls: number;
  isCritical: boolean;
  complexity: number;
  parameters: number;
  branches: BranchCoverage[];
}

/**
 * Branch-level coverage details
 */
export interface BranchCoverage {
  type: 'if' | 'switch' | 'try' | 'loop' | 'conditional';
  lineNumber: number;
  covered: boolean;
  condition?: string;
  trueCount?: number;
  falseCount?: number;
  isCritical: boolean;
}

/**
 * Statement-level coverage details
 */
export interface StatementCoverage {
  type: 'expression' | 'declaration' | 'return' | 'throw' | 'debugger';
  lineNumber: number;
  covered: boolean;
  count: number;
  isCritical: boolean;
}

/**
 * Critical path identification and risk assessment
 */
export interface CriticalPath {
  id: string;
  name: string;
  description: string;
  files: string[];
  functions: string[];

  // Risk metrics
  riskScore: number;
  impact: 'low' | 'medium' | 'high' | 'critical';

  // Coverage metrics
  currentCoverage: number;
  requiredCoverage: number;
  coverageGap: number;

  // Business impact
  businessImpact: string;
  userFacing: boolean;

  // Recommendations
  priority: number;
  recommendations: string[];
}

/**
 * Coverage quality scoring
 */
export interface CoverageQualityScore {
  overall: number;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  statementCoverage: number;

  // Quality factors
  criticalPathCoverage: number;
  testComplexity: number;
  testMaintainability: number;
  codeComplexity: number;

  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  // Grade
  grade: 'A' | 'B' | 'C' | 'D' | 'F';

  // Breakdown
  breakdown: {
    coverage: number;
    complexity: number;
    criticality: number;
    trends: number;
  };
}

/**
 * Coverage trend tracking data
 */
export interface CoverageTrend {
  timestamp: Date;
  overallCoverage: number;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  statementCoverage: number;

  // Changes
  overallChange: number;
  lineChange: number;
  branchChange: number;
  functionChange: number;
  statementChange: number;

  // Metrics
  totalFiles: number;
  testedFiles: number;
  totalTests: number;
  passedTests: number;

  // Quality indicators
  qualityScore: number;
  riskScore: number;
}

/**
 * Uncovered code area analysis
 */
export interface UncoveredArea {
  filePath: string;
  startLine: number;
  endLine: number;
  type: 'function' | 'branch' | 'statement' | 'line';
  description: string;

  // Risk assessment
  riskScore: number;
  impact: 'low' | 'medium' | 'high' | 'critical';

  // Context
  functionName?: string;
  className?: string;
  module?: string;

  // Recommendations
  recommendation: string;
  priority: number;

  // Test suggestions
  suggestedTests: TestSuggestion[];
}

/**
 * Test suggestion for uncovered areas
 */
export interface TestSuggestion {
  type: 'unit' | 'integration' | 'e2e' | 'property';
  description: string;
  example?: string;
  priority: number;
  effort: 'low' | 'medium' | 'high';
}

/**
 * Coverage recommendation
 */
export interface CoverageRecommendation {
  id: string;
  type: 'test' | 'refactor' | 'architecture' | 'strategy';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;

  // Impact assessment
  impact: {
    coverageImprovement: number;
    riskReduction: number;
    qualityScore: number;
  };

  // Implementation details
  effort: 'low' | 'medium' | 'high';
  files: string[];
  functions: string[];

  // Action items
  actionItems: string[];

  // Examples
  examples?: string[];
}

/**
 * Coverage metadata
 */
export interface CoverageMetadata {
  generatedAt: Date;
  tool: string;
  version: string;

  // Project info
  projectPath: string;
  projectName: string;
  projectVersion: string;

  // Analysis info
  analysisDuration: number;
  filesAnalyzed: number;
  linesAnalyzed: number;

  // Test framework info
  testFramework: string;
  testRunner: string;

  // Configuration
  configuration: CoverageConfiguration;

  // Exclusions
  excludedFiles: string[];
  excludedPatterns: string[];
}

/**
 * Coverage analysis configuration
 */
export interface CoverageConfiguration {
  thresholds: CoverageThresholds;
  criticalPaths: CriticalPathConfig[];
  exclusions: string[];
  includePatterns: string[];
  enableTrending: boolean;
  enableQualityScoring: boolean;
  enableRiskAssessment: boolean;
}

/**
 * Coverage thresholds for quality assessment
 */
export interface CoverageThresholds {
  overall: number;
  lines: number;
  branches: number;
  functions: number;
  statements: number;
  criticalPaths: number;
}

/**
 * Critical path configuration
 */
export interface CriticalPathConfig {
  name: string;
  patterns: string[];
  requiredCoverage: number;
  description: string;
}

/**
 * Coverage report data structure
 */
export interface CoverageReport {
  id: string;
  projectId: string;
  timestamp: Date;

  // Coverage data
  coverage: EnhancedCoverageData;

  // Summary
  summary: CoverageSummary;

  // Historical data
  historical: CoverageTrend[];

  // Export metadata
  format: 'json' | 'html' | 'markdown' | 'csv';
  version: string;
}

/**
 * Coverage summary for quick overview
 */
export interface CoverageSummary {
  overallCoverage: number;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  statementCoverage: number;

  // Quality indicators
  qualityScore: number;
  grade: string;
  riskLevel: string;

  // File counts
  totalFiles: number;
  coveredFiles: number;
  partiallyCoveredFiles: number;
  uncoveredFiles: number;

  // Critical paths
  totalCriticalPaths: number;
  coveredCriticalPaths: number;

  // Recommendations count
  highPriorityRecommendations: number;
  mediumPriorityRecommendations: number;
  lowPriorityRecommendations: number;
}