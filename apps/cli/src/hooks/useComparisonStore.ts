/**
 * Comparison Store Hook
 * Manages comparison analysis state for dashboard comparisons
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Issue } from '../types/analysis';

export interface AnalysisRun {
  id: string;
  timestamp: Date;
  version?: string;
  commitHash?: string;
  branch?: string;
  metadata: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    fixableIssues: number;
    score: number;
    executionTime: number;
    tools: string[];
  };
  issues: Issue[];
  metrics: {
    coverage: number;
    duplicates: number;
    newIssues: number;
    resolvedIssues: number;
    trends: {
      severity: Record<string, number>;
      tools: Record<string, number>;
      categories: Record<string, number>;
    };
  };
}

export interface ComparisonConfig {
  baselineRunId: string;
  comparisonRunId: string;
  metrics: string[];
  filters: {
    showNewIssues: boolean;
    showResolvedIssues: boolean;
    showUnchangedIssues: boolean;
    severityFilter: string[];
    toolFilter: string[];
  };
  visualization: {
    showCharts: boolean;
    showDiffs: boolean;
    showTrends: boolean;
  };
}

export interface ComparisonResult {
  config: ComparisonConfig;
  baseline: AnalysisRun;
  comparison: AnalysisRun;
  summary: {
    totalIssuesDiff: number;
    criticalIssuesDiff: number;
    scoreDiff: number;
    newIssuesCount: number;
    resolvedIssuesCount: number;
    unchangedIssuesCount: number;
    improvementRate: number;
  };
  differences: {
    newIssues: Issue[];
    resolvedIssues: Issue[];
    unchangedIssues: Issue[];
    severityChanges: Array<{
      issue: Issue;
      oldSeverity: string;
      newSeverity: string;
    }>;
    scoreChanges: Array<{
      issue: Issue;
      oldScore: number;
      newScore: number;
      diff: number;
    }>;
  };
  trends: {
    severity: Array<{
      type: string;
      baseline: number;
      comparison: number;
      diff: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    tools: Array<{
      tool: string;
      baseline: number;
      comparison: number;
      diff: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    categories: Array<{
      category: string;
      baseline: number;
      comparison: number;
      diff: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
  generatedAt: Date;
}

export interface ComparisonState {
  // Data
  runs: AnalysisRun[];
  comparisons: ComparisonResult[];
  currentComparison?: ComparisonResult;

  // UI state
  isComparing: boolean;
  showRunSelector: boolean;
  selectedBaselineRun?: string;
  selectedComparisonRun?: string;

  // Config
  comparisonConfig: ComparisonConfig;

  // Actions
  addRun: (run: AnalysisRun) => void;
  removeRun: (runId: string) => void;
  getRun: (runId: string) => AnalysisRun | undefined;
  updateRun: (runId: string, updates: Partial<AnalysisRun>) => void;

  // Comparison operations
  compareRuns: (baselineRunId: string, comparisonRunId: string) => ComparisonResult;
  setCurrentComparison: (comparison: ComparisonResult) => void;
  clearComparison: () => void;
  deleteComparison: (comparisonId: string) => void;

  // Config management
  updateComparisonConfig: (config: Partial<ComparisonConfig>) => void;
  setFilters: (filters: Partial<ComparisonConfig['filters']>) => void;
  setVisualization: (visualization: Partial<ComparisonConfig['visualization']>) => void;

  // UI actions
  toggleRunSelector: () => void;
  setRunSelectorOpen: (open: boolean) => void;
  selectBaselineRun: (runId: string) => void;
  selectComparisonRun: (runId: string) => void;

  // Export functionality
  exportComparison: (format: 'json' | 'csv' | 'markdown') => string;
  exportRuns: (format: 'json' | 'csv') => string;

  // Utility methods
  getRecentRuns: (limit?: number) => AnalysisRun[];
  getRunById: (runId: string) => AnalysisRun | undefined;
  calculateTrends: (runIds: string[]) => ComparisonResult['trends'];
}

const defaultConfig: ComparisonConfig = {
  baselineRunId: '',
  comparisonRunId: '',
  metrics: ['totalIssues', 'criticalIssues', 'score', 'fixableIssues'],
  filters: {
    showNewIssues: true,
    showResolvedIssues: true,
    showUnchangedIssues: false,
    severityFilter: [],
    toolFilter: [],
  },
  visualization: {
    showCharts: true,
    showDiffs: true,
    showTrends: true,
  },
};

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      // Initial state
      runs: [],
      comparisons: [],
      isComparing: false,
      showRunSelector: false,
      comparisonConfig: defaultConfig,

      // Run management
      addRun: run =>
        set(state => {
          // Check if run already exists
          const existingIndex = state.runs.findIndex(r => r.id === run.id);
          if (existingIndex >= 0) {
            // Update existing run
            const updatedRuns = [...state.runs];
            updatedRuns[existingIndex] = run;
            return { runs: updatedRuns };
          }
          // Add new run, sorted by timestamp (newest first)
          const sortedRuns = [run, ...state.runs].sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
          );
          return { runs: sortedRuns };
        }),

      removeRun: runId =>
        set(state => {
          const filteredRuns = state.runs.filter(r => r.id !== runId);
          const filteredComparisons = state.comparisons.filter(
            c => c.baseline.id !== runId && c.comparison.id !== runId
          );
          return {
            runs: filteredRuns,
            comparisons: filteredComparisons,
            currentComparison:
              state.currentComparison?.baseline.id === runId ||
              state.currentComparison?.comparison.id === runId
                ? undefined
                : state.currentComparison,
          };
        }),

      getRun: runId => get().runs.find(r => r.id === runId),

      updateRun: (runId, updates) =>
        set(state => ({
          runs: state.runs.map(run => (run.id === runId ? { ...run, ...updates } : run)),
        })),

      // Comparison operations
      compareRuns: (baselineRunId, comparisonRunId) => {
        const state = get();
        const baseline = state.getRun(baselineRunId);
        const comparison = state.getRun(comparisonRunId);

        if (!baseline || !comparison) {
          throw new Error('One or both runs not found');
        }

        // Calculate comparison result
        const result = generateComparisonResult(baseline, comparison, state.comparisonConfig);

        set(prevState => ({
          comparisons: [...prevState.comparisons, result],
          currentComparison: result,
          isComparing: false,
        }));

        return result;
      },

      setCurrentComparison: comparison => set({ currentComparison: comparison }),

      clearComparison: () => set({ currentComparison: undefined }),

      deleteComparison: comparisonId =>
        set(state => ({
          comparisons: state.comparisons.filter(c => c.generatedAt.toISOString() !== comparisonId),
          currentComparison:
            state.currentComparison?.generatedAt.toISOString() === comparisonId
              ? undefined
              : state.currentComparison,
        })),

      // Config management
      updateComparisonConfig: config =>
        set(state => ({
          comparisonConfig: { ...state.comparisonConfig, ...config },
        })),

      setFilters: filters =>
        set(state => ({
          comparisonConfig: {
            ...state.comparisonConfig,
            filters: { ...state.comparisonConfig.filters, ...filters },
          },
        })),

      setVisualization: visualization =>
        set(state => ({
          comparisonConfig: {
            ...state.comparisonConfig,
            visualization: { ...state.comparisonConfig.visualization, ...visualization },
          },
        })),

      // UI actions
      toggleRunSelector: () => set(state => ({ showRunSelector: !state.showRunSelector })),

      setRunSelectorOpen: open => set({ showRunSelector: open }),

      selectBaselineRun: runId =>
        set(state => ({
          selectedBaselineRun: runId,
          comparisonConfig: { ...state.comparisonConfig, baselineRunId: runId },
        })),

      selectComparisonRun: runId =>
        set(state => ({
          selectedComparisonRun: runId,
          comparisonConfig: { ...state.comparisonConfig, comparisonRunId: runId },
        })),

      // Export functionality
      exportComparison: format => {
        const state = get();
        if (!state.currentComparison) {
          throw new Error('No comparison to export');
        }

        switch (format) {
          case 'json':
            return JSON.stringify(state.currentComparison, null, 2);
          case 'csv':
            return exportComparisonAsCSV(state.currentComparison);
          case 'markdown':
            return exportComparisonAsMarkdown(state.currentComparison);
          default:
            throw new Error(`Unsupported export format: ${format}`);
        }
      },

      exportRuns: format => {
        const state = get();
        switch (format) {
          case 'json':
            return JSON.stringify(state.runs, null, 2);
          case 'csv':
            return exportRunsAsCSV(state.runs);
          default:
            throw new Error(`Unsupported export format: ${format}`);
        }
      },

      // Utility methods
      getRecentRuns: (limit = 10) => {
        return get().runs.slice(0, limit);
      },

      getRunById: runId => {
        return get().runs.find(r => r.id === runId);
      },

      calculateTrends: runIds => {
        const state = get();
        const runs = runIds.map(id => state.getRunById(id)).filter(Boolean) as AnalysisRun[];

        if (runs.length < 2) {
          return { severity: [], tools: [], categories: [] };
        }

        const oldest = runs[runs.length - 1];
        const newest = runs[0];

        if (!oldest || !newest) {
          return { severity: [], tools: [], categories: [] };
        }

        return generateTrends(oldest, newest);
      },
    }),
    {
      name: 'comparison-store',
      partialize: state => ({
        runs: state.runs.slice(0, 50), // Limit stored runs
        comparisonConfig: state.comparisonConfig,
      }),
    }
  )
);

/**
 * Generate comparison result between two runs
 */
function generateComparisonResult(
  baseline: AnalysisRun,
  comparison: AnalysisRun,
  config: ComparisonConfig
): ComparisonResult {
  const baselineIssues = new Map(baseline.issues.map(issue => [issue.id, issue]));
  const comparisonIssues = new Map(comparison.issues.map(issue => [issue.id, issue]));

  const newIssues: Issue[] = [];
  const resolvedIssues: Issue[] = [];
  const unchangedIssues: Issue[] = [];
  const severityChanges: Array<{
    issue: Issue;
    oldSeverity: string;
    newSeverity: string;
  }> = [];
  const scoreChanges: Array<{
    issue: Issue;
    oldScore: number;
    newScore: number;
    diff: number;
  }> = [];

  // Find new and changed issues
  for (const [id, issue] of comparisonIssues) {
    const baselineIssue = baselineIssues.get(id);
    if (!baselineIssue) {
      newIssues.push(issue);
    } else {
      // Check for changes
      if (baselineIssue.type !== issue.type) {
        severityChanges.push({
          issue,
          oldSeverity: baselineIssue.type,
          newSeverity: issue.type,
        });
      }

      if (baselineIssue.score !== issue.score) {
        scoreChanges.push({
          issue,
          oldScore: baselineIssue.score,
          newScore: issue.score,
          diff: issue.score - baselineIssue.score,
        });
      }

      unchangedIssues.push(issue);
    }
  }

  // Find resolved issues
  for (const [id, issue] of baselineIssues) {
    if (!comparisonIssues.has(id)) {
      resolvedIssues.push(issue);
    }
  }

  // Calculate summary
  const totalIssuesDiff = comparison.metadata.totalIssues - baseline.metadata.totalIssues;
  const criticalIssuesDiff = comparison.metadata.criticalIssues - baseline.metadata.criticalIssues;
  const scoreDiff = comparison.metadata.score - baseline.metadata.score;

  const improvementRate =
    totalIssuesDiff === 0
      ? 0
      : ((resolvedIssues.length - newIssues.length) / baseline.metadata.totalIssues) * 100;

  return {
    config,
    baseline,
    comparison,
    summary: {
      totalIssuesDiff,
      criticalIssuesDiff,
      scoreDiff,
      newIssuesCount: newIssues.length,
      resolvedIssuesCount: resolvedIssues.length,
      unchangedIssuesCount: unchangedIssues.length,
      improvementRate,
    },
    differences: {
      newIssues,
      resolvedIssues,
      unchangedIssues,
      severityChanges,
      scoreChanges,
    },
    trends: generateTrends(baseline, comparison),
    generatedAt: new Date(),
  };
}

/**
 * Generate trend analysis between two runs
 */
function generateTrends(
  baseline: AnalysisRun,
  comparison: AnalysisRun
): ComparisonResult['trends'] {
  const severity = Object.keys(baseline.metrics.trends.severity).map(type => ({
    type,
    baseline: baseline.metrics.trends.severity[type] ?? 0,
    comparison: comparison.metrics.trends.severity[type] ?? 0,
    diff:
      (comparison.metrics.trends.severity[type] ?? 0) -
      (baseline.metrics.trends.severity[type] ?? 0),
    trend: 'stable' as 'up' | 'down' | 'stable',
  }));

  const tools = Object.keys(baseline.metrics.trends.tools).map(tool => ({
    tool,
    baseline: baseline.metrics.trends.tools[tool] ?? 0,
    comparison: comparison.metrics.trends.tools[tool] ?? 0,
    diff: (comparison.metrics.trends.tools[tool] ?? 0) - (baseline.metrics.trends.tools[tool] ?? 0),
    trend: 'stable' as 'up' | 'down' | 'stable',
  }));

  const categories = Object.keys(baseline.metrics.trends.categories).map(category => ({
    category,
    baseline: baseline.metrics.trends.categories[category] ?? 0,
    comparison: comparison.metrics.trends.categories[category] ?? 0,
    diff:
      (comparison.metrics.trends.categories[category] ?? 0) -
      (baseline.metrics.trends.categories[category] ?? 0),
    trend: 'stable' as 'up' | 'down' | 'stable',
  }));

  // Determine trends
  const updatedSeverity = severity.map(
    (item): (typeof severity)[0] & { trend: 'up' | 'down' | 'stable' } => ({
      ...item,
      trend: item.diff > 0 ? 'up' : item.diff < 0 ? 'down' : 'stable',
    })
  );

  const updatedTools = tools.map(
    (item): (typeof tools)[0] & { trend: 'up' | 'down' | 'stable' } => ({
      ...item,
      trend: item.diff > 0 ? 'up' : item.diff < 0 ? 'down' : 'stable',
    })
  );

  const updatedCategories = categories.map(
    (item): (typeof categories)[0] & { trend: 'up' | 'down' | 'stable' } => ({
      ...item,
      trend: item.diff > 0 ? 'up' : item.diff < 0 ? 'down' : 'stable',
    })
  );

  return {
    severity: updatedSeverity,
    tools: updatedTools,
    categories: updatedCategories,
  };
}

/**
 * Export comparison as CSV
 */
function exportComparisonAsCSV(comparison: ComparisonResult): string {
  const headers = ['Metric', 'Baseline', 'Comparison', 'Difference', 'Trend'];

  const rows = [
    headers.join(','),
    `Total Issues,${comparison.baseline.metadata.totalIssues},${comparison.comparison.metadata.totalIssues},${comparison.summary.totalIssuesDiff},${comparison.summary.totalIssuesDiff > 0 ? 'up' : 'down'}`,
    `Critical Issues,${comparison.baseline.metadata.criticalIssues},${comparison.comparison.metadata.criticalIssues},${comparison.summary.criticalIssuesDiff},${comparison.summary.criticalIssuesDiff > 0 ? 'up' : 'down'}`,
    `Score,${comparison.baseline.metadata.score},${comparison.comparison.metadata.score},${comparison.summary.scoreDiff},${comparison.summary.scoreDiff > 0 ? 'up' : 'down'}`,
    `New Issues,0,${comparison.summary.newIssuesCount},${comparison.summary.newIssuesCount},new`,
    `Resolved Issues,0,${comparison.summary.resolvedIssuesCount},${-comparison.summary.resolvedIssuesCount},resolved`,
    `Improvement Rate,0,${comparison.summary.improvementRate.toFixed(2)}%,${comparison.summary.improvementRate.toFixed(2)}%,${comparison.summary.improvementRate > 0 ? 'improvement' : 'degradation'}`,
  ];

  return rows.join('\n');
}

/**
 * Export comparison as Markdown
 */
function exportComparisonAsMarkdown(comparison: ComparisonResult): string {
  const { baseline, comparison: comp, summary } = comparison;

  return `# Comparison Report

**Generated:** ${comparison.generatedAt.toISOString()}

## Overview

| Metric | ${baseline.version ?? 'Baseline'} (${baseline.timestamp.toISOString().split('T')[0]}) | ${comp.version ?? 'Comparison'} (${comp.timestamp.toISOString().split('T')[0]}) | Difference |
|--------|--------|--------|------------|
| Total Issues | ${baseline.metadata.totalIssues} | ${comp.metadata.totalIssues} | ${summary.totalIssuesDiff > 0 ? '+' : ''}${summary.totalIssuesDiff} |
| Critical Issues | ${baseline.metadata.criticalIssues} | ${comp.metadata.criticalIssues} | ${summary.criticalIssuesDiff > 0 ? '+' : ''}${summary.criticalIssuesDiff} |
| Score | ${baseline.metadata.score} | ${comp.metadata.score} | ${summary.scoreDiff > 0 ? '+' : ''}${summary.scoreDiff} |
| New Issues | 0 | ${summary.newIssuesCount} | +${summary.newIssuesCount} |
| Resolved Issues | 0 | ${summary.resolvedIssuesCount} | -${summary.resolvedIssuesCount} |
| Improvement Rate | - | ${summary.improvementRate.toFixed(2)}% | ${summary.improvementRate > 0 ? '✅' : '❌'} |

## Summary

${
  summary.improvementRate > 0
    ? `🟢 **Improvement**: ${summary.improvementRate.toFixed(2)}% improvement rate`
    : `🔴 **Degradation**: ${Math.abs(summary.improvementRate).toFixed(2)}% degradation rate`
}

## Issues Changes

- **New Issues**: ${summary.newIssuesCount}
- **Resolved Issues**: ${summary.resolvedIssuesCount}
- **Unchanged Issues**: ${summary.unchangedIssuesCount}

## Severity Trends

${comparison.trends.severity
  .map(
    trend =>
      `- **${trend.type}**: ${trend.baseline} → ${trend.comparison} (${trend.diff > 0 ? '+' : ''}${trend.diff}) ${trend.trend === 'up' ? '📈' : trend.trend === 'down' ? '📉' : '➡️'}`
  )
  .join('\n')}
`;
}

/**
 * Export runs as CSV
 */
function exportRunsAsCSV(runs: AnalysisRun[]): string {
  const headers = [
    'ID',
    'Timestamp',
    'Version',
    'Total Issues',
    'Critical Issues',
    'Score',
    'Fixable Issues',
    'Execution Time',
    'Tools',
  ];

  const rows = [
    headers.join(','),
    ...runs.map(run =>
      [
        run.id,
        run.timestamp.toISOString(),
        run.version ?? '',
        run.metadata.totalIssues,
        run.metadata.criticalIssues,
        run.metadata.score,
        run.metadata.fixableIssues,
        run.metadata.executionTime,
        run.metadata.tools.join(';'),
      ].join(',')
    ),
  ];

  return rows.join('\n');
}
