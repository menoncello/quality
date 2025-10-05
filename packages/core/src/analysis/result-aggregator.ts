import type {
  NormalizedResult,
  NormalizedIssue
} from './result-normalizer.js';
import type { ResultSummary, AIPrompt, CoverageData } from '../plugins/analysis-plugin.js';

export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}
import type {
  AnalysisResult,
  ToolResult
} from '../plugins/analysis-plugin.js';

/**
 * Aggregation configuration
 */
export interface AggregationConfig {
  weights: {
    errors: number;
    warnings: number;
    info: number;
    coverage: number;
    performance: number;
  };
  thresholds: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  grouping: {
    byCategory: boolean;
    bySeverity: boolean;
    byFile: boolean;
    byTool: boolean;
  };
  filters: {
    excludeRules: string[];
    excludePaths: string[];
    excludeCategories: string[];
    minSeverity: 'error' | 'warning' | 'info';
  };
}

/**
 * Aggregated issue statistics
 */
export interface IssueStatistics {
  total: number;
  bySeverity: {
    errors: number;
    warnings: number;
    info: number;
  };
  byCategory: Record<string, number>;
  byTool: Record<string, number>;
  byFile: Record<string, number>;
  fixable: number;
  critical: number;
  duplicatesRemoved: number;
}

/**
 * Aggregated coverage data
 */
export interface AggregatedCoverage {
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
  toolCoverage: Record<string, unknown>;
}

/**
 * Aggregated performance metrics
 */
export interface AggregatedPerformance {
  totalExecutionTime: number;
  averageExecutionTime: number;
  slowestTool: string;
  fastestTool: string;
  toolsExecuted: number;
  toolsSucceeded: number;
  toolsFailed: number;
  memoryUsage: number;
  filesProcessed: number;
  linesOfCode: number;
}

/**
 * Aggregated result summary
 */
export interface AggregatedSummary {
  projectId: string;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issueStatistics: IssueStatistics;
  coverage: AggregatedCoverage | null;
  performance: AggregatedPerformance;
  recommendations: string[];
  trends: {
    newIssues: number;
    fixedIssues: number;
    regression: boolean;
  };
}

/**
 * Result aggregator for combining and analyzing multiple tool results
 */
export class ResultAggregator {
  private config: AggregationConfig;
  private logger: Logger;

  constructor(config: AggregationConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Aggregate normalized results
   */
  aggregateResults(
    normalizedResults: NormalizedResult[],
    projectId: string,
    baselineResults?: NormalizedResult[]
  ): AggregatedSummary {
    this.logger.info(`Aggregating ${normalizedResults.length} normalized results`);

    try {
      // Filter and deduplicate issues
      const filteredIssues = this.filterAndDeduplicateIssues(normalizedResults);
      const issueStatistics = this.calculateIssueStatistics(filteredIssues, normalizedResults);

      // Aggregate coverage
      const coverage = this.aggregateCoverage(normalizedResults);

      // Aggregate performance metrics
      const performance = this.aggregatePerformance(normalizedResults);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(
        issueStatistics,
        coverage,
        performance,
        normalizedResults
      );

      // Generate grade
      const grade = this.calculateGrade(overallScore);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        issueStatistics,
        coverage,
        performance,
        normalizedResults
      );

      // Analyze trends if baseline is available
      const trends = this.analyzeTrends(normalizedResults, baselineResults);

      const summary: AggregatedSummary = {
        projectId,
        overallScore,
        grade,
        issueStatistics,
        coverage,
        performance,
        recommendations,
        trends
      };

      this.logger.debug(`Aggregation completed with overall score: ${overallScore} (${grade})`);
      return summary;

    } catch (error) {
      this.logger.error('Failed to aggregate results:', error);
      throw new Error(`Result aggregation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create complete analysis result from aggregation
   */
  createAnalysisResult(
    normalizedResults: NormalizedResult[],
    aggregatedSummary: AggregatedSummary,
    projectId: string,
    startTime: Date
  ): AnalysisResult {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Convert normalized results back to tool results
    const toolResults = normalizedResults.map(nr => this.convertToToolResult(nr));

    // Create result summary
    const resultSummary: ResultSummary = {
      totalIssues: aggregatedSummary.issueStatistics.total,
      totalErrors: aggregatedSummary.issueStatistics.bySeverity.errors,
      totalWarnings: aggregatedSummary.issueStatistics.bySeverity.warnings,
      totalFixable: aggregatedSummary.issueStatistics.fixable,
      overallScore: aggregatedSummary.overallScore,
      toolCount: normalizedResults.length,
      executionTime: duration
    };

    // Generate AI prompts
    const aiPrompts = this.generateAIPrompts(aggregatedSummary, normalizedResults);

    return {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      timestamp: endTime,
      duration,
      overallScore: aggregatedSummary.overallScore,
      toolResults,
      summary: resultSummary,
      aiPrompts
    };
  }

  /**
   * Update aggregation configuration
   */
  updateConfig(newConfig: Partial<AggregationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Aggregation configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): AggregationConfig {
    return { ...this.config };
  }

  // Private methods

  /**
   * Filter and deduplicate issues from all results
   */
  private filterAndDeduplicateIssues(results: NormalizedResult[]): NormalizedIssue[] {
    const allIssues = results.flatMap(result => result.issues);
    const seenIssues = new Set<string>();
    const deduplicatedIssues: NormalizedIssue[] = [];

    for (const issue of allIssues) {
      // Apply filters
      if (!this.shouldIncludeIssue(issue)) {
        continue;
      }

      // Create deduplication key
      const dedupeKey = this.createDeduplicationKey(issue);

      if (!seenIssues.has(dedupeKey)) {
        seenIssues.add(dedupeKey);
        deduplicatedIssues.push(issue);
      }
    }

    this.logger.debug(`Deduplicated ${allIssues.length} issues to ${deduplicatedIssues.length}`);
    return deduplicatedIssues;
  }

  /**
   * Check if issue should be included based on filters
   */
  private shouldIncludeIssue(issue: NormalizedIssue): boolean {
    // Ensure filters exist
    if (!this.config.filters) {
      return true; // Include all issues if no filters configured
    }

    // Severity filter (lower index = higher severity)
    const severityLevels = ['error', 'warning', 'info'];
    const minSeverityIndex = severityLevels.indexOf(this.config.filters.minSeverity   ?? 'info');
    const issueSeverityIndex = severityLevels.indexOf(issue.severity);

    // Include issues with severity equal to or more severe than minSeverity
    if (issueSeverityIndex > minSeverityIndex) {
      return false;
    }

    // Rule filter
    if (issue.ruleId && this.config.filters.excludeRules?.includes(issue.ruleId)) {
      return false;
    }

    // Category filter
    if (this.config.filters.excludeCategories?.includes(issue.category)) {
      return false;
    }

    // Path filter
    for (const excludePath of this.config.filters.excludePaths ?? []) {
      if (issue.filePath.includes(excludePath)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create deduplication key for issue
   */
  private createDeduplicationKey(issue: NormalizedIssue): string {
    return `${issue.filePath}:${issue.lineNumber}:${issue.ruleId}:${issue.message.substring(0, 100)}`;
  }

  /**
   * Calculate issue statistics
   */
  private calculateIssueStatistics(
    issues: NormalizedIssue[],
    results: NormalizedResult[]
  ): IssueStatistics {
    const stats: IssueStatistics = {
      total: issues.length,
      bySeverity: { errors: 0, warnings: 0, info: 0 },
      byCategory: {},
      byTool: {},
      byFile: {},
      fixable: 0,
      critical: 0,
      duplicatesRemoved: 0
    };

    // Calculate original total before deduplication
    const originalTotal = results.reduce((sum, result) => sum + result.issues.length, 0);
    stats.duplicatesRemoved = originalTotal - issues.length;

    for (const issue of issues) {
      // Count by severity (map issue severity to statistics property)
      if (issue.severity === 'error') {
        stats.bySeverity.errors++;
      } else if (issue.severity === 'warning') {
        stats.bySeverity.warnings++;
      } else if (issue.severity === 'info') {
        stats.bySeverity.info++;
      }

      // Count by category
      stats.byCategory[issue.category] = (stats.byCategory[issue.category]  || 0) + 1;

      // Count by tool
      stats.byTool[issue.toolName] = (stats.byTool[issue.toolName] ?? 0) + 1;

      // Count by file
      stats.byFile[issue.filePath] = (stats.byFile[issue.filePath] ?? 0) + 1;

      // Count fixable
      if (issue.fixable) {
        stats.fixable++;
      }

      // Count critical (high score errors)
      if (issue.severity === 'error' && issue.score >= 80) {
        stats.critical++;
      }
    }

    return stats;
  }

  /**
   * Aggregate coverage data from all results
   */
  private aggregateCoverage(results: NormalizedResult[]): AggregatedCoverage | null {
    const coverageResults = results
      .map(result => result.metrics.coverage)
      .filter(coverage => coverage !== undefined) as CoverageData[];

    if (coverageResults.length === 0) {
      return null;
    }

    const aggregated: AggregatedCoverage = {
      lines: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 },
      toolCoverage: {}
    };

    // Sum up all coverage data
    for (const coverage of coverageResults) {
      aggregated.lines.total += coverage.lines.total;
      aggregated.lines.covered += coverage.lines.covered;

      aggregated.functions.total += coverage.functions.total;
      aggregated.functions.covered += coverage.functions.covered;

      aggregated.branches.total += coverage.branches.total;
      aggregated.branches.covered += coverage.branches.covered;

      aggregated.statements.total += coverage.statements.total;
      aggregated.statements.covered += coverage.statements.covered;
    }

    // Calculate percentages
    aggregated.lines.percentage = aggregated.lines.total > 0
      ? Math.round((aggregated.lines.covered / aggregated.lines.total) * 100)
      : 0;

    aggregated.functions.percentage = aggregated.functions.total > 0
      ? Math.round((aggregated.functions.covered / aggregated.functions.total) * 100)
      : 0;

    aggregated.branches.percentage = aggregated.branches.total > 0
      ? Math.round((aggregated.branches.covered / aggregated.branches.total) * 100)
      : 0;

    aggregated.statements.percentage = aggregated.statements.total > 0
      ? Math.round((aggregated.statements.covered / aggregated.statements.total) * 100)
      : 0;

    return aggregated;
  }

  /**
   * Aggregate performance metrics
   */
  private aggregatePerformance(results: NormalizedResult[]): AggregatedPerformance {
    // Handle empty results
    if (results.length === 0) {
      return {
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        slowestTool: 'none',
        fastestTool: 'none',
        toolsExecuted: 0,
        toolsSucceeded: 0,
        toolsFailed: 0,
        memoryUsage: 0,
        filesProcessed: 0,
        linesOfCode: 0
      };
    }

    const executionTimes = results.map(result => result.executionTime);
    const totalExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0);
    const averageExecutionTime = totalExecutionTime / results.length;

    const slowestTool = results.reduce((slowest, result) =>
      result.executionTime > slowest.executionTime ? result : slowest
    , results[0]); // Add initial value

    const fastestTool = results.reduce((fastest, result) =>
      result.executionTime < fastest.executionTime ? result : fastest
    , results[0]); // Add initial value

    const toolsSucceeded = results.filter(result =>
      result.status === 'success'  || result.status === 'warning'
    ).length;

    const totalFilesProcessed = results.reduce((sum, result) =>
      sum + (result.metrics.performance.filesProcessed ?? 0), 0
    );

    const totalLinesOfCode = results.reduce((sum, result) =>
      sum + (result.metrics.performance.linesOfCode ?? 0), 0
    );

    return {
      totalExecutionTime,
      averageExecutionTime,
      slowestTool: slowestTool.toolName,
      fastestTool: fastestTool.toolName,
      toolsExecuted: results.length,
      toolsSucceeded,
      toolsFailed: results.length - toolsSucceeded,
      memoryUsage: 0, // Would need actual memory tracking
      filesProcessed: totalFilesProcessed,
      linesOfCode: totalLinesOfCode
    };
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    issueStats: IssueStatistics,
    coverage: AggregatedCoverage | null,
    performance: AggregatedPerformance,
    _results: NormalizedResult[]
  ): number {
    let score = 100;

    // Ensure weights exist with defaults
    const weights = this.config.weights ?? {
      errors: 5,
      warnings: 1,
      info: 0.5,
      coverage: 2,
      performance: 1
    };

    // Deduct points for issues
    const errorDeduction = (issueStats.bySeverity?.errors ?? 0) * weights.errors;
    const warningDeduction = (issueStats.bySeverity?.warnings ?? 0) * weights.warnings;
    const infoDeduction = (issueStats.bySeverity?.info ?? 0) * weights.info;

    score -= errorDeduction + warningDeduction + infoDeduction;

    // Add points for coverage
    if (coverage?.lines) {
      const coverageScore = (coverage.lines.percentage / 100) * weights.coverage;
      score = Math.min(100, score + coverageScore);
    }

    // Deduct points for poor performance
    const performancePenalty = Math.max(0, ((performance.averageExecutionTime ?? 0) - 10000) / 1000); // 10s is baseline
    score -= performancePenalty * weights.performance;

    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate grade from score
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= this.config.thresholds.excellent) return 'A';
    if (score >= this.config.thresholds.good) return 'B';
    if (score >= this.config.thresholds.fair) return 'C';
    if (score >= this.config.thresholds.poor) return 'D';
    return 'F';
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(
    issueStats: IssueStatistics,
    coverage: AggregatedCoverage | null,
    performance: AggregatedPerformance | null,
    results: NormalizedResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Error recommendations
    if ((issueStats.bySeverity?.errors ?? 0) > 0) {
      recommendations.push(`Fix ${issueStats.bySeverity?.errors ?? 0} error(s) to improve code quality`);
    }

    // Coverage recommendations
    if (coverage && coverage.lines.percentage < 80) {
      recommendations.push(`Increase test coverage from ${coverage.lines.percentage}% to at least 80%`);
    }

    // Performance recommendations
    if (performance && performance.averageExecutionTime && performance.averageExecutionTime > 30000) {
      recommendations.push('Optimize tool performance - average execution time exceeds 30 seconds');
    }

    // Fixable issues recommendations
    if (issueStats.fixable > 0) {
      recommendations.push(`${issueStats.fixable} issue(s) can be automatically fixed`);
    }

    // Critical issues recommendations
    if (issueStats.critical > 0) {
      recommendations.push(`Address ${issueStats.critical} critical issue(s) immediately`);
    }

    // Tool-specific recommendations
    for (const result of results) {
      if (result.status === 'error') {
        recommendations.push(`Fix configuration or setup issues for ${result.toolName}`);
      }
    }

    return recommendations;
  }

  /**
   * Analyze trends compared to baseline
   */
  private analyzeTrends(
    currentResults: NormalizedResult[],
    baselineResults?: NormalizedResult[]
  ): { newIssues: number; fixedIssues: number; regression: boolean } {
    if (!baselineResults || baselineResults.length === 0) {
      return { newIssues: 0, fixedIssues: 0, regression: false };
    }

    const currentIssues = new Set(
      currentResults.flatMap(result => result.issues.map(this.createDeduplicationKey))
    );

    const baselineIssues = new Set(
      baselineResults.flatMap(result => result.issues.map(this.createDeduplicationKey))
    );

    const newIssues = [...currentIssues].filter(issue => !baselineIssues.has(issue)).length;
    const fixedIssues = [...baselineIssues].filter(issue => !currentIssues.has(issue)).length;
    const regression = newIssues > fixedIssues;

    return { newIssues, fixedIssues, regression };
  }

  /**
   * Generate AI prompts based on results
   */
  private generateAIPrompts(
    aggregatedSummary: AggregatedSummary,
    normalizedResults: NormalizedResult[]
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];

    // Critical issues prompt
    const criticalIssues = normalizedResults
      .flatMap(result => result.issues)
      .filter(issue => issue.severity === 'error' && issue.score >= 80)
      .slice(0, 10);

    if (criticalIssues.length > 0) {
      prompts.push({
        id: `critical-issues-${Date.now()}`,
        type: 'fix-suggestions',
        title: 'Critical Issues Analysis',
        description: `Analyze and provide fix suggestions for ${criticalIssues.length} critical issues`,
        issues: criticalIssues.map(issue => ({
          id: issue.id,
          type: issue.severity,
          toolName: issue.toolName,
          filePath: issue.filePath,
          lineNumber: issue.lineNumber,
          message: issue.message,
          ruleId: issue.ruleId,
          fixable: issue.fixable,
          suggestion: issue.suggestion,
          score: issue.score
        })),
        priority: 'high'
      });
    }

    // Coverage improvement prompt
    if (aggregatedSummary.coverage && aggregatedSummary.coverage.lines.percentage < 80) {
      prompts.push({
        id: `coverage-improvement-${Date.now()}`,
        type: 'coverage-analysis',
        title: 'Test Coverage Improvement',
        description: `Provide recommendations to improve test coverage from ${aggregatedSummary.coverage.lines.percentage}%`,
        issues: [],
        priority: 'medium'
      });
    }

    return prompts;
  }

  /**
   * Convert normalized result back to tool result format
   */
  private convertToToolResult(normalizedResult: NormalizedResult): ToolResult {
    return {
      toolName: normalizedResult.toolName,
      executionTime: normalizedResult.executionTime,
      status: normalizedResult.status as 'error' | 'success' | 'warning',
      issues: normalizedResult.issues.map(issue => ({
        id: issue.id,
        type: issue.severity,
        toolName: issue.toolName,
        filePath: issue.filePath,
        lineNumber: issue.lineNumber,
        message: issue.message,
        ruleId: issue.ruleId,
        fixable: issue.fixable,
        suggestion: issue.suggestion,
        score: issue.score
      })),
      metrics: {
        issuesCount: normalizedResult.metrics.issuesCount,
        errorsCount: normalizedResult.metrics.errorsCount,
        warningsCount: normalizedResult.metrics.warningsCount,
        infoCount: normalizedResult.metrics.infoCount,
        fixableCount: normalizedResult.metrics.fixableCount,
        score: normalizedResult.metrics.score,
        coverage: normalizedResult.metrics.coverage
      }
    };
  }
}