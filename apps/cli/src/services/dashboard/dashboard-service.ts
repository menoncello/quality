/**
 * Dashboard service for business logic
 */

import type { AnalysisResult } from '../../types';
import type { Issue } from '@dev-quality/core';
import type {
  DashboardData,
  DashboardMetrics,
  DashboardSummary,
  FilterState,
  SortField,
  SortOrder,
  IssueSeverity,
} from '../../types/dashboard';
import { transformCoreIssueToCLI } from '../../utils/type-transformers';
import type { Issue as CLIIssue } from '../../types/analysis';

export class DashboardService {
  /**
   * Process analysis results for dashboard display
   */
  processResults(analysisResult: AnalysisResult): DashboardData {
    const issues = this.extractAllIssues(analysisResult);
    const metrics = this.calculateMetrics(analysisResult, issues);
    const summary = this.generateSummary(analysisResult, issues);

    return {
      analysisResult,
      filteredIssues: issues,
      metrics,
      summary,
    };
  }

  /**
   * Apply filters to issues
   */
  applyFilters(issues: Issue[], filters: FilterState): Issue[] {
    return issues.filter(issue => {
      // Severity filter
      if (!filters.severity.includes(issue.type as IssueSeverity)) {
        return false;
      }

      // Tool filter
      if (filters.tools.length > 0 && !filters.tools.includes(issue.toolName)) {
        return false;
      }

      // File path filter
      if (filters.filePaths.length > 0) {
        const matchesPath = filters.filePaths.some(path => issue.filePath.includes(path));
        if (!matchesPath) return false;
      }

      // Fixable filter
      if (filters.fixable !== null && issue.fixable !== filters.fixable) {
        return false;
      }

      // Score range filter
      if (filters.minScore !== null && issue.score < filters.minScore) {
        return false;
      }
      if (filters.maxScore !== null && issue.score > filters.maxScore) {
        return false;
      }

      // Search query filter
      if (filters.searchQuery.trim() !== '') {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch =
          (issue.message.toLowerCase().includes(searchLower) ||
            issue.filePath.toLowerCase().includes(searchLower) ||
            issue.toolName.toLowerCase().includes(searchLower) ||
            issue.ruleId?.toLowerCase().includes(searchLower)) ??
          issue.suggestion?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      return true;
    });
  }

  /**
   * Sort issues
   */
  sortIssues(issues: Issue[], sortBy: SortField, order: SortOrder): Issue[] {
    return [...issues].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'severity': {
          const severityOrder = { error: 3, warning: 2, info: 1 };
          const aSeverity = (severityOrder as Record<string, number>)[a.type] ?? 0;
          const bSeverity = (severityOrder as Record<string, number>)[b.type] ?? 0;
          comparison = aSeverity - bSeverity;
          break;
        }
        case 'filePath':
          comparison = a.filePath.localeCompare(b.filePath);
          break;
        case 'toolName':
          comparison = a.toolName.localeCompare(b.toolName);
          break;
        case 'lineNumber':
          comparison = a.lineNumber - b.lineNumber;
          break;
        default:
          comparison = 0;
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Extract all issues from analysis result
   */
  private extractAllIssues(analysisResult: AnalysisResult): CLIIssue[] {
    return analysisResult.toolResults.flatMap(toolResult =>
      toolResult.issues.map(issue => transformCoreIssueToCLI(issue))
    );
  }

  /**
   * Calculate metrics from analysis results
   */
  private calculateMetrics(analysisResult: AnalysisResult, issues: Issue[]): DashboardMetrics {
    const errorCount = issues.filter(issue => issue.type === 'error').length;
    const warningCount = issues.filter(issue => issue.type === 'warning').length;
    const infoCount = issues.filter(issue => issue.type === 'info').length;
    const fixableCount = issues.filter(issue => issue.fixable).length;

    // Get coverage from first tool that has it
    const coverage = analysisResult.toolResults.find(result => result.coverage)?.coverage ?? null;

    return {
      totalIssues: issues.length,
      errorCount,
      warningCount,
      infoCount,
      fixableCount,
      overallScore: analysisResult.overallScore,
      coverage,
      toolsAnalyzed: analysisResult.toolResults.length,
      duration: analysisResult.duration,
    };
  }

  /**
   * Generate summary information
   */
  private generateSummary(analysisResult: AnalysisResult, issues: CLIIssue[]): DashboardSummary {
    // Get top issues (highest scoring)
    const topIssues = [...issues].sort((a, b) => b.score - a.score).slice(0, 5);

    // Get most affected files
    const fileIssueCount = new Map<string, { count: number; severity: string }>();
    issues.forEach(issue => {
      const current = fileIssueCount.get(issue.filePath) ?? { count: 0, severity: issue.type };
      current.count++;
      // Prioritize more severe issues
      if (issue.type === 'error' || (current.severity !== 'error' && issue.type === 'warning')) {
        current.severity = issue.type;
      }
      fileIssueCount.set(issue.filePath, current);
    });

    const mostAffectedFiles = Array.from(fileIssueCount.entries())
      .map(([filePath, data]) => ({
        filePath,
        issueCount: data.count,
        severity: data.severity as IssueSeverity,
      }))
      .sort((a, b) => b.issueCount - a.issueCount)
      .slice(0, 5);

    // Get tool summary
    const toolSummary = analysisResult.toolResults.map(toolResult => ({
      toolName: toolResult.toolName,
      issueCount: toolResult.issues.length,
      score: toolResult.metrics.score,
    }));

    return {
      topIssues,
      mostAffectedFiles,
      toolSummary,
    };
  }

  /**
   * Get filter statistics
   */
  getFilterStatistics(originalIssues: Issue[], filteredIssues: Issue[], filters: FilterState) {
    return {
      totalIssues: originalIssues.length,
      filteredIssues: filteredIssues.length,
      activeFilters: Object.entries(filters).filter(([key, value]) => {
        if (key === 'severity') return (value as string[]).length < 3;
        if (key === 'tools' || key === 'filePaths') return (value as string[]).length > 0;
        if (key === 'fixable') return value !== null;
        if (key === 'minScore' || key === 'maxScore') return value !== null;
        if (key === 'searchQuery') return (value as string).trim() !== '';
        return false;
      }).length,
      filterBreakdown: this.getFilterBreakdown(originalIssues, filters),
    };
  }

  /**
   * Get breakdown of issues by filter
   */
  private getFilterBreakdown(issues: Issue[], _filters: FilterState) {
    const breakdown: Record<string, number> = {};

    // Severity breakdown
    const severityCounts = issues.reduce(
      (acc, issue) => {
        acc[issue.type] = (acc[issue.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.assign(breakdown, severityCounts);

    // Tool breakdown
    const toolCounts = issues.reduce(
      (acc, issue) => {
        acc[issue.toolName] = (acc[issue.toolName] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.keys(toolCounts).forEach(tool => {
      const count = toolCounts[tool];
      if (count !== undefined) {
        breakdown[`tool:${tool}`] = count;
      }
    });

    return breakdown;
  }
}
