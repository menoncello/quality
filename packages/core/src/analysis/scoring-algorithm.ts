import type {
  NormalizedResult
} from './result-normalizer.js';
import type {
  AggregatedCoverage,
  AggregatedPerformance,
  AggregatedSummary,
  IssueStatistics,
  Logger
} from './result-aggregator.js';

/**
 * Scoring algorithm configuration
 */
export interface ScoringConfig {
  weights: {
    critical: number;
    major: number;
    minor: number;
    info: number;
    coverage: number;
    performance: number;
    complexity: number;
    maintainability: number;
    security: number;
  };
  penalties: {
    unfixedCritical: number;
    uncoveredFile: number;
    slowExecution: number;
    lowCoverage: number;
    codeDuplication: number;
    securityVulnerability: number;
  };
  bonuses: {
    highCoverage: number;
    fastExecution: number;
    allTestsPassing: number;
    zeroCriticalIssues: number;
    goodDocumentation: number;
  };
  thresholds: {
    criticalScore: number;
    majorScore: number;
    minorScore: number;
    coverageThreshold: number;
    performanceThreshold: number;
  };
}

/**
 * Scoring breakdown for transparency
 */
export interface ScoringBreakdown {
  baseScore: number;
  deductions: {
    critical: number;
    major: number;
    minor: number;
    info: number;
    coverage: number;
    performance: number;
    complexity: number;
    maintainability: number;
    security: number;
  };
  bonuses: {
    highCoverage: number;
    fastExecution: number;
    allTestsPassing: number;
    zeroCriticalIssues: number;
    goodDocumentation: number;
  };
  totalDeductions: number;
  totalBonuses: number;
  finalScore: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  explanation: string[];
}

/**
 * Quality dimensions
 */
export interface QualityDimensions {
  reliability: number;      // Based on errors and test failures
  performance: number;      // Based on execution time and resource usage
  security: number;         // Based on security-related issues
  maintainability: number;  // Based on code complexity and documentation
  coverage: number;         // Based on test coverage
  overall: number;          // Weighted combination of all dimensions
}

/**
 * Advanced scoring algorithm for comprehensive quality assessment
 */
export class ScoringAlgorithm {
  private config: ScoringConfig;
  private logger: Logger;

  constructor(config: ScoringConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Calculate comprehensive quality score from aggregated summary
   * Overload for convenience when working with AggregatedSummary
   */
  calculateScore(summary: AggregatedSummary, results: NormalizedResult[]): ScoringBreakdown;
  /**
   * Calculate comprehensive quality score from individual parameters
   */
  calculateScore(
    issueStats: IssueStatistics,
    coverage: AggregatedCoverage | null,
    performance: AggregatedPerformance,
    results: NormalizedResult[]
  ): ScoringBreakdown;
  /**
   * Calculate comprehensive quality score - Implementation
   */
  calculateScore(
    issueStatsOrSummary: IssueStatistics | AggregatedSummary,
    coverageOrResults: AggregatedCoverage | null | NormalizedResult[],
    performance?: AggregatedPerformance,
    results?: NormalizedResult[]
  ): ScoringBreakdown {
    // Handle overload: if first parameter is AggregatedSummary
    let issueStats: IssueStatistics;
    let coverage: AggregatedCoverage | null;
    let perfMetrics: AggregatedPerformance;
    let normalizedResults: NormalizedResult[];

    if ('projectId' in issueStatsOrSummary) {
      // First overload: AggregatedSummary
      const summary = issueStatsOrSummary;
      issueStats = summary.issueStatistics;
      coverage = summary.coverage;
      perfMetrics = summary.performance;
      normalizedResults = coverageOrResults as NormalizedResult[];
    } else {
      // Second overload: Individual parameters
      issueStats = issueStatsOrSummary;
      coverage = coverageOrResults as AggregatedCoverage | null;
      perfMetrics = performance || {
        averageExecutionTime: 0,
        totalExecutionTime: 0,
        slowestTool: '',
        fastestTool: '',
        toolsExecuted: 0,
        toolsSucceeded: 0,
        toolsFailed: 0,
        memoryUsage: 0,
        filesProcessed: 0,
        linesOfCode: 0
      };
      normalizedResults = results || [];
    }
    this.logger.info('Calculating comprehensive quality score');

    try {
      // Start with base score
      const baseScore = 100;

      // Calculate deductions
      const deductions = this.calculateDeductions(issueStats, coverage, perfMetrics, normalizedResults);

      // Calculate bonuses
      const bonuses = this.calculateBonuses(issueStats, coverage, perfMetrics, normalizedResults);

      // Apply deductions and bonuses
      const totalDeductions = Object.values(deductions).reduce((sum, value) => sum + (value ?? 0), 0);
      const totalBonuses = Object.values(bonuses).reduce((sum, value) => sum + (value ?? 0), 0);

      let finalScore = baseScore - totalDeductions + totalBonuses;
      finalScore = Math.max(0, Math.min(100, finalScore)); // Clamp between 0 and 100

      // Debug logging
      if (isNaN(finalScore)) {
        this.logger.error('finalScore is NaN', { baseScore, totalDeductions, totalBonuses, deductions, bonuses });
      }

      // Calculate grade
      const grade = this.calculateGrade(finalScore);

      // Generate explanation
      const explanation = this.generateExplanation(deductions, bonuses, issueStats, coverage, perfMetrics);

      const breakdown: ScoringBreakdown = {
        baseScore,
        deductions,
        bonuses,
        totalDeductions,
        totalBonuses,
        finalScore,
        grade,
        explanation
      };

      this.logger.debug(`Score calculation completed: ${finalScore} (${grade})`);
      return breakdown;

    } catch (error) {
      this.logger.error('Failed to calculate score:', error);
      throw new Error(`Score calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate quality dimensions
   */
  calculateQualityDimensions(
    breakdown: ScoringBreakdown,
    issueStats: IssueStatistics,
    coverage: AggregatedCoverage | null,
    performance: AggregatedPerformance,
    results: NormalizedResult[]
  ): QualityDimensions {
    // Reliability: Based on critical errors and test failures
    const reliability = Math.max(0, 100 - (breakdown.deductions.critical * 2));

    // Performance: Based on execution time and efficiency
    const performanceScore = Math.max(0, 100 - breakdown.deductions.performance);

    // Security: Based on security-related issues
    const security = this.calculateSecurityScore(results, issueStats);

    // Maintainability: Based on code complexity and issue types
    const maintainability = this.calculateMaintainabilityScore(results, issueStats);

    // Coverage: Based on test coverage percentage
    const coverageScore = coverage ? coverage.lines.percentage : 0;

    // Overall: Weighted combination
    const overall = (
      reliability * 0.3 +
      performanceScore * 0.2 +
      security * 0.2 +
      maintainability * 0.2 +
      coverageScore * 0.1
    );

    return {
      reliability,
      performance: performanceScore,
      security,
      maintainability,
      coverage: coverageScore,
      overall: Math.round(overall)
    };
  }

  /**
   * Generate quality insights and recommendations
   */
  generateInsights(
    breakdown: ScoringBreakdown,
    dimensions: QualityDimensions,
    issueStats: IssueStatistics,
    coverage: AggregatedCoverage | null,
    performance: AggregatedPerformance
  ): {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    priority: 'high' | 'medium' | 'low';
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze strengths
    if (breakdown.deductions.critical === 0) {
      strengths.push('No critical issues found');
    }

    if (coverage && coverage.lines && coverage.lines.percentage >= 90) {
      strengths.push('Excellent test coverage');
    }

    if (performance.averageExecutionTime < 5000) {
      strengths.push('Fast tool execution performance');
    }

    if (dimensions.maintainability >= 80) {
      strengths.push('High code maintainability');
    }

    // Analyze weaknesses
    if (breakdown.deductions.critical > 10) {
      weaknesses.push('High number of critical issues');
      recommendations.push('Address critical issues immediately to improve code quality');
    }

    if (coverage && coverage.lines && coverage.lines.percentage < 60) {
      weaknesses.push('Low test coverage');
      recommendations.push('Increase test coverage to at least 80%');
    }

    if (performance.averageExecutionTime > 30000) {
      weaknesses.push('Slow tool execution');
      recommendations.push('Optimize tool configuration and performance');
    }

    if (dimensions.security < 70) {
      weaknesses.push('Security concerns detected');
      recommendations.push('Review and fix security vulnerabilities');
    }

    if (dimensions.maintainability < 60) {
      weaknesses.push('Code maintainability issues');
      recommendations.push('Improve code structure and documentation');
    }

    // Determine priority
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (breakdown.finalScore < 60 || breakdown.deductions.critical > 5) {
      priority = 'high';
    } else if (breakdown.finalScore < 80 || breakdown.deductions.critical > 0) {
      priority = 'medium';
    }

    return { strengths, weaknesses, recommendations, priority };
  }

  /**
   * Update scoring configuration
   */
  updateConfig(newConfig: Partial<ScoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Scoring configuration updated');
  }

  // Private methods

  /**
   * Calculate score deductions
   */
  private calculateDeductions(
    issueStats: IssueStatistics,
    coverage: AggregatedCoverage | null,
    performance: AggregatedPerformance,
    results: NormalizedResult[]
  ): ScoringBreakdown['deductions'] {
    const deductions = {
      critical: 0,
      major: 0,
      minor: 0,
      info: 0,
      coverage: 0,
      performance: 0,
      complexity: 0,
      maintainability: 0,
      security: 0
    };

    // Issue-based deductions
    deductions.critical = issueStats.critical * this.config.weights.critical;
    deductions.major = ((issueStats.bySeverity?.errors ?? 0) - issueStats.critical) * this.config.weights.major;
    deductions.minor = (issueStats.bySeverity?.warnings ?? 0) * this.config.weights.minor;
    deductions.info = (issueStats.bySeverity?.info ?? 0) * this.config.weights.info;

    // Coverage deductions
    if (coverage && coverage.lines.percentage < this.config.thresholds.coverageThreshold) {
      const coverageGap = this.config.thresholds.coverageThreshold - coverage.lines.percentage;
      deductions.coverage = (coverageGap / 100) * this.config.weights.coverage;
    }

    // Performance deductions
    if (performance.averageExecutionTime > this.config.thresholds.performanceThreshold) {
      const performanceExcess = performance.averageExecutionTime - this.config.thresholds.performanceThreshold;
      deductions.performance = (performanceExcess / 1000) * this.config.weights.performance;
    }

    // Security deductions
    deductions.security = this.calculateSecurityDeductions(results);

    // Complexity deductions (simplified)
    deductions.complexity = this.calculateComplexityDeductions(results);

    // Maintainability deductions
    deductions.maintainability = this.calculateMaintainabilityDeductions(results, issueStats);

    return deductions;
  }

  /**
   * Calculate score bonuses
   */
  private calculateBonuses(
    issueStats: IssueStatistics,
    coverage: AggregatedCoverage | null,
    performance: AggregatedPerformance,
    results: NormalizedResult[]
  ): ScoringBreakdown['bonuses'] {
    const bonuses = {
      highCoverage: 0,
      fastExecution: 0,
      allTestsPassing: 0,
      zeroCriticalIssues: 0,
      goodDocumentation: 0
    };

    // High coverage bonus
    if (coverage && coverage.lines && coverage.lines.percentage >= 95) {
      bonuses.highCoverage = this.config.bonuses.highCoverage;
    }

    // Fast execution bonus
    if (performance.averageExecutionTime < 5000) {
      bonuses.fastExecution = this.config.bonuses.fastExecution;
    }

    // All tests passing bonus
    const allTestsPassed = results.every(result =>
      result.toolName !== 'bun-test'  || result.status === 'success'
    );
    if (allTestsPassed) {
      bonuses.allTestsPassing = this.config.bonuses.allTestsPassing;
    }

    // Zero critical issues bonus
    if (issueStats.critical === 0) {
      bonuses.zeroCriticalIssues = this.config.bonuses.zeroCriticalIssues;
    }

    // Good documentation bonus (simplified)
    bonuses.goodDocumentation = this.calculateDocumentationBonus(results);

    return bonuses;
  }

  /**
   * Calculate grade from score
   */
  private calculateGrade(score: number): ScoringBreakdown['grade'] {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 89) return 'B+';
    if (score >= 85) return 'B';
    if (score >= 81) return 'C+';
    if (score >= 75) return 'C';
    if (score >= 70) return 'D';
    return 'F';
  }

  /**
   * Generate explanation for the score
   */
  private generateExplanation(
    deductions: ScoringBreakdown['deductions'],
    bonuses: ScoringBreakdown['bonuses'],
    issueStats: IssueStatistics,
    coverage: AggregatedCoverage | null,
    _performance: AggregatedPerformance
  ): string[] {
    const explanation: string[] = [];

    // Explain deductions
    if (deductions.critical > 0) {
      explanation.push(`Deducted ${Math.round(deductions.critical)} points for ${issueStats.critical} critical issues`);
    }

    if (deductions.coverage > 0) {
      const coveragePercent = coverage ? coverage.lines.percentage : 0;
      explanation.push(`Deducted ${Math.round(deductions.coverage)} points for ${coveragePercent}% test coverage`);
    }

    if (deductions.performance > 0) {
      explanation.push(`Deducted ${Math.round(deductions.performance)} points for slow performance`);
    }

    // Explain bonuses
    if (bonuses.highCoverage > 0) {
      explanation.push(`Added ${Math.round(bonuses.highCoverage)} points for excellent test coverage`);
    }

    if (bonuses.zeroCriticalIssues > 0) {
      explanation.push(`Added ${Math.round(bonuses.zeroCriticalIssues)} points for zero critical issues`);
    }

    return explanation;
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(results: NormalizedResult[], _issueStats: IssueStatistics): number {
    // Count security-related issues (simplified)
    const securityIssues = (results ?? [])
      .flatMap(result => result.issues ?? [])
      .filter(issue =>
        issue.category.toLowerCase().includes('security') ?? issue.ruleId?.toLowerCase().includes('security')
      ).length;

    return Math.max(0, 100 - (securityIssues * 10));
  }

  /**
   * Calculate maintainability score
   */
  private calculateMaintainabilityScore(results: NormalizedResult[], _issueStats: IssueStatistics): number {
    let score = 100;

    // Deduct for style issues
    const styleIssues = (results ?? [])
      .flatMap(result => result.issues ?? [])
      .filter(issue => issue.category === 'Code Style').length;

    score -= styleIssues * 2;

    // Deduct for complexity issues
    const complexityIssues = (results ?? [])
      .flatMap(result => result.issues ?? [])
      .filter(issue => issue.category === 'Complexity').length;

    score -= complexityIssues * 5;

    return Math.max(0, score);
  }

  /**
   * Calculate security deductions
   */
  private calculateSecurityDeductions(results: NormalizedResult[]): number {
    const securityIssues = (results ?? [])
      .flatMap(result => result.issues ?? [])
      .filter(issue =>
        issue.category.toLowerCase().includes('security') ?? issue.ruleId?.toLowerCase().includes('security')
      ).length;

    return securityIssues * this.config.penalties.securityVulnerability;
  }

  /**
   * Calculate complexity deductions
   */
  private calculateComplexityDeductions(results: NormalizedResult[]): number {
    // Simplified complexity calculation
    const complexityIssues = (results ?? [])
      .flatMap(result => result.issues ?? [])
      .filter(issue => issue.category === 'Complexity').length;

    return complexityIssues * 2;
  }

  /**
   * Calculate maintainability deductions
   */
  private calculateMaintainabilityDeductions(results: NormalizedResult[], issueStats: IssueStatistics): number {
    let deductions = 0;

    // Deduct for style and formatting issues
    const styleIssues = (results ?? [])
      .flatMap(result => result.issues ?? [])
      .filter(issue => issue.category === 'Code Style').length;

    deductions += styleIssues * 0.5;

    // Deduct for unfixed issues
    const unfixedIssues = issueStats.total - issueStats.fixable;
    deductions += unfixedIssues * 0.2;

    return deductions;
  }

  /**
   * Calculate documentation bonus
   */
  private calculateDocumentationBonus(results: NormalizedResult[]): number {
    // Simplified check for documentation-related positives
    const hasDocumentation = results.some(result =>
      result.issues.some(issue =>
        issue.category.toLowerCase().includes('documentation')
      )
    );

    return hasDocumentation ? this.config.bonuses.goodDocumentation : 0;
  }
}