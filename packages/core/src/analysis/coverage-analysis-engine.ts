/**
 * Coverage Analysis Engine for orchestrating comprehensive coverage analysis
 */

import type {
  AnalysisContext,
  ToolResult,
  AnalysisPlugin
} from '../plugins/analysis-plugin.js';

import type {
  EnhancedCoverageData,
  CoverageReport,
  CoverageSummary,
  CoverageConfiguration
} from '../types/coverage.js';

import { CoverageAnalyzer } from '../services/coverage-analyzer.js';
import { CoverageTrendAnalyzer } from '../services/coverage-trend-analyzer.js';
import { CoverageReportGenerator } from '../services/coverage-report-generator.js';

/**
 * Coverage Analysis Engine coordinates all coverage-related analysis
 */
export class CoverageAnalysisEngine {
  private coverageAnalyzer: CoverageAnalyzer;
  private trendAnalyzer: CoverageTrendAnalyzer;
  private reportGenerator: CoverageReportGenerator;

  constructor(config?: Partial<CoverageConfiguration>) {
    this.coverageAnalyzer = new CoverageAnalyzer(config);
    this.trendAnalyzer = new CoverageTrendAnalyzer();
    this.reportGenerator = new CoverageReportGenerator();
  }

  /**
   * Execute comprehensive coverage analysis
   */
  async analyzeCoverage(
    context: AnalysisContext,
    toolResults: ToolResult[]
  ): Promise<CoverageReport> {
    // Extract coverage data from tool results
    const coverageResults = toolResults.filter(result => result.metrics.coverage);

    if (coverageResults.length === 0) {
      return this.createEmptyReport(context);
    }

    // Process coverage data from all tools
    const enhancedCoverageData = await this.processCoverageData(coverageResults, context);

    // Generate comprehensive report
    const report = await this.generateReport(enhancedCoverageData, context);

    return report;
  }

  /**
   * Process coverage data from multiple tools
   */
  private async processCoverageData(
    coverageResults: ToolResult[],
    context: AnalysisContext
  ): Promise<EnhancedCoverageData> {
    // Merge coverage data from multiple tools
    const mergedCoverage = this.mergeCoverageData(coverageResults);

    // Enhance with advanced analysis
    const enhancedCoverage = await this.coverageAnalyzer.analyzeCoverage(
      mergedCoverage,
      context,
      this.getDetailedCoverageData(context)
    );

    return enhancedCoverage;
  }

  /**
   * Merge coverage data from multiple tools
   */
  private mergeCoverageData(coverageResults: ToolResult[]): any {
    if (coverageResults.length === 1) {
      return coverageResults[0].metrics.coverage;
    }

    // Merge multiple coverage reports
    const merged = {
      lines: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 }
    };

    for (const result of coverageResults) {
      const coverage = result.metrics.coverage;
      if (coverage) {
        // Take the maximum values for each metric
        merged.lines.total = Math.max(merged.lines.total, coverage.lines.total);
        merged.lines.covered = Math.max(merged.lines.covered, coverage.lines.covered);
        merged.lines.percentage = Math.max(merged.lines.percentage, coverage.lines.percentage);

        merged.functions.total = Math.max(merged.functions.total, coverage.functions.total);
        merged.functions.covered = Math.max(merged.functions.covered, coverage.functions.covered);
        merged.functions.percentage = Math.max(merged.functions.percentage, coverage.functions.percentage);

        merged.branches.total = Math.max(merged.branches.total, coverage.branches.total);
        merged.branches.covered = Math.max(merged.branches.covered, coverage.branches.covered);
        merged.branches.percentage = Math.max(merged.branches.percentage, coverage.branches.percentage);

        merged.statements.total = Math.max(merged.statements.total, coverage.statements.total);
        merged.statements.covered = Math.max(merged.statements.covered, coverage.statements.covered);
        merged.statements.percentage = Math.max(merged.statements.percentage, coverage.statements.percentage);
      }
    }

    return merged;
  }

  /**
   * Get detailed coverage data for enhanced analysis
   */
  private async getDetailedCoverageData(context: AnalysisContext): Promise<any> {
    try {
      const fs = require('fs/promises');
      const path = require('path');

      const coveragePath = path.join(context.projectPath, 'coverage', 'coverage-final.json');

      try {
        const data = await fs.readFile(coveragePath, 'utf8');
        return JSON.parse(data);
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Generate comprehensive coverage report
   */
  private async generateReport(
    coverageData: EnhancedCoverageData,
    context: AnalysisContext
  ): Promise<CoverageReport> {
    // Generate summary
    const summary = this.generateSummary(coverageData);

    // Get historical trends
    const historical = await this.trendAnalyzer.analyzeTrends(context, coverageData);

    // Create report
    const report: CoverageReport = {
      id: this.generateReportId(),
      projectId: context.config.name || 'unknown',
      timestamp: new Date(),
      coverage: coverageData,
      summary,
      historical,
      format: 'json',
      version: '1.0.0'
    };

    return report;
  }

  /**
   * Generate coverage summary
   */
  private generateSummary(coverageData: EnhancedCoverageData): CoverageSummary {
    const files = coverageData.files || [];

    const totalFiles = files.length;
    const coveredFiles = files.filter(f => f.overallCoverage > 0).length;
    const partiallyCoveredFiles = files.filter(f => f.overallCoverage > 0 && f.overallCoverage < 100).length;
    const uncoveredFiles = files.filter(f => f.overallCoverage === 0).length;

    const criticalPaths = coverageData.criticalPaths || [];
    const totalCriticalPaths = criticalPaths.length;
    const coveredCriticalPaths = criticalPaths.filter(cp => cp.currentCoverage >= cp.requiredCoverage).length;

    const recommendations = coverageData.recommendations || [];
    const highPriorityRecommendations = recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length;
    const mediumPriorityRecommendations = recommendations.filter(r => r.priority === 'medium').length;
    const lowPriorityRecommendations = recommendations.filter(r => r.priority === 'low').length;

    return {
      overallCoverage: coverageData.lines.percentage,
      lineCoverage: coverageData.lines.percentage,
      branchCoverage: coverageData.branches.percentage,
      functionCoverage: coverageData.functions.percentage,
      statementCoverage: coverageData.statements.percentage,
      qualityScore: coverageData.qualityScore?.overall || 0,
      grade: coverageData.qualityScore?.grade || 'F',
      riskLevel: coverageData.qualityScore?.riskLevel || 'unknown',
      totalFiles,
      coveredFiles,
      partiallyCoveredFiles,
      uncoveredFiles,
      totalCriticalPaths,
      coveredCriticalPaths,
      highPriorityRecommendations,
      mediumPriorityRecommendations,
      lowPriorityRecommendations
    };
  }

  /**
   * Create empty report when no coverage data is available
   */
  private createEmptyReport(context: AnalysisContext): CoverageReport {
    const emptyCoverage: EnhancedCoverageData = {
      lines: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 },
      files: [],
      criticalPaths: [],
      qualityScore: {
        overall: 0,
        lineCoverage: 0,
        branchCoverage: 0,
        functionCoverage: 0,
        statementCoverage: 0,
        criticalPathCoverage: 0,
        testComplexity: 0,
        testMaintainability: 0,
        codeComplexity: 0,
        riskLevel: 'critical',
        grade: 'F',
        breakdown: {
          coverage: 0,
          complexity: 0,
          criticality: 0,
          trends: 0
        }
      },
      uncoveredAreas: [],
      recommendations: [],
      metadata: {
        generatedAt: new Date(),
        tool: 'coverage-analysis-engine',
        version: '1.0.0',
        projectPath: context.projectPath,
        projectName: context.config.name,
        projectVersion: context.config.version,
        analysisDuration: 0,
        filesAnalyzed: 0,
        linesAnalyzed: 0,
        testFramework: 'unknown',
        testRunner: 'unknown',
        configuration: {} as CoverageConfiguration,
        excludedFiles: [],
        excludedPatterns: []
      }
    };

    return {
      id: this.generateReportId(),
      projectId: context.config.name || 'unknown',
      timestamp: new Date(),
      coverage: emptyCoverage,
      summary: this.generateSummary(emptyCoverage),
      historical: [],
      format: 'json',
      version: '1.0.0'
    };
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `coverage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export report in different formats
   */
  async exportReport(
    report: CoverageReport,
    format: 'json' | 'html' | 'markdown' | 'csv',
    outputPath?: string
  ): Promise<string> {
    return this.reportGenerator.export(report, format, outputPath);
  }

  /**
   * Get coverage insights and recommendations
   */
  async getCoverageInsights(report: CoverageReport): Promise<{
    insights: string[];
    actionableItems: string[];
    riskAssessment: string;
    improvementPlan: string[];
  }> {
    const insights: string[] = [];
    const actionableItems: string[] = [];
    const improvementPlan: string[] = [];

    const { coverage, summary } = report;

    // Overall coverage insights
    if (summary.overallCoverage < 50) {
      insights.push('Overall coverage is critically low. Immediate attention required.');
      actionableItems.push('Prioritize writing tests for core functionality');
      improvementPlan.push('Week 1-2: Focus on high-risk areas and critical paths');
    } else if (summary.overallCoverage < 80) {
      insights.push('Coverage is below recommended levels. Room for improvement.');
      actionableItems.push('Increase test coverage for uncovered functions and branches');
      improvementPlan.push('Week 1-4: Systematically improve coverage across all modules');
    } else {
      insights.push('Good overall coverage. Focus on quality and edge cases.');
      actionableItems.push('Enhance test quality and add edge case coverage');
      improvementPlan.push('Ongoing: Maintain coverage while improving test quality');
    }

    // Critical path analysis
    if (summary.totalCriticalPaths > 0) {
      const criticalPathCoverage = (summary.coveredCriticalPaths / summary.totalCriticalPaths) * 100;
      if (criticalPathCoverage < 90) {
        insights.push(`${summary.totalCriticalPaths - summary.coveredCriticalPaths} critical paths are below required coverage.`);
        actionableItems.push('Focus testing efforts on critical business logic paths');
      }
    }

    // Risk assessment based on uncovered areas
    const highRiskAreas = coverage.uncoveredAreas?.filter(area => area.impact === 'critical') || [];
    if (highRiskAreas.length > 0) {
      insights.push(`${highRiskAreas.length} high-risk uncovered areas identified.`);
      actionableItems.push('Address critical uncovered areas immediately');
    }

    // Quality scoring insights
    if (coverage.qualityScore) {
      if (coverage.qualityScore.grade === 'A') {
        insights.push('Excellent coverage quality. Maintain current practices.');
      } else if (coverage.qualityScore.grade === 'B') {
        insights.push('Good coverage quality with room for improvement.');
        actionableItems.push('Focus on improving test complexity and maintainability');
      } else {
        insights.push('Coverage quality needs significant improvement.');
        actionableItems.push('Comprehensive test strategy revision required');
      }
    }

    // Recommendations analysis
    if (summary.highPriorityRecommendations > 0) {
      insights.push(`${summary.highPriorityRecommendations} high-priority recommendations require attention.`);
      actionableItems.push('Implement high-priority recommendations first');
    }

    const riskAssessment = this.assessOverallRisk(summary, coverage);

    return {
      insights,
      actionableItems,
      riskAssessment,
      improvementPlan
    };
  }

  /**
   * Assess overall risk based on coverage data
   */
  private assessOverallRisk(summary: CoverageSummary, coverage: EnhancedCoverageData): string {
    let riskScore = 0;

    // Coverage-based risk
    if (summary.overallCoverage < 50) riskScore += 40;
    else if (summary.overallCoverage < 70) riskScore += 25;
    else if (summary.overallCoverage < 85) riskScore += 10;

    // Critical path risk
    if (summary.totalCriticalPaths > 0) {
      const criticalCoverageRatio = summary.coveredCriticalPaths / summary.totalCriticalPaths;
      if (criticalCoverageRatio < 0.8) riskScore += 30;
      else if (criticalCoverageRatio < 0.9) riskScore += 15;
    }

    // Quality score risk
    if (coverage.qualityScore) {
      if (coverage.qualityScore.grade === 'F' || coverage.qualityScore.grade === 'D') riskScore += 20;
      else if (coverage.qualityScore.grade === 'C') riskScore += 10;
    }

    // Uncovered critical areas risk
    const criticalUncovered = coverage.uncoveredAreas?.filter(area => area.impact === 'critical').length || 0;
    riskScore += Math.min(criticalUncovered * 5, 25);

    if (riskScore >= 70) return 'CRITICAL: High-risk project with significant coverage gaps';
    if (riskScore >= 50) return 'HIGH: Moderate to high risk requiring immediate attention';
    if (riskScore >= 30) return 'MEDIUM: Acceptable risk with room for improvement';
    return 'LOW: Well-covered project with minimal risk';
  }

  /**
   * Update coverage analysis configuration
   */
  updateConfiguration(config: Partial<CoverageConfiguration>): void {
    this.coverageAnalyzer = new CoverageAnalyzer(config);
  }

  /**
   * Get current configuration
   */
  getConfiguration(): CoverageConfiguration {
    // Return current configuration - would need to be stored or passed through
    return {} as CoverageConfiguration;
  }
}