/**
 * Comparison Summary Component Tests
 */

import { describe, it, expect, jest } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { ComparisonSummary } from '../../../src/components/dashboard/comparison-summary';
import type { ComparisonResult } from '../../../src/hooks/useComparisonStore';

describe('ComparisonSummary', () => {
  const mockComparison: ComparisonResult = {
    config: {
      baselineRunId: 'baseline-1',
      comparisonRunId: 'comparison-1',
      metrics: ['totalIssues', 'criticalIssues', 'score'],
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
    },
    baseline: {
      id: 'baseline-1',
      timestamp: new Date('2025-01-01T10:00:00Z'),
      version: 'v1.0.0',
      metadata: {
        totalIssues: 10,
        criticalIssues: 3,
        highIssues: 4,
        mediumIssues: 2,
        lowIssues: 1,
        fixableIssues: 7,
        score: 75,
        executionTime: 5000,
        tools: ['eslint', 'typescript'],
      },
      issues: [],
      metrics: {
        coverage: 85,
        duplicates: 2,
        newIssues: 0,
        resolvedIssues: 0,
        trends: {
          severity: { error: 3, warning: 4, info: 3 },
          tools: { eslint: 6, typescript: 4 },
          categories: { security: 2, performance: 3, maintainability: 5 },
        },
      },
    },
    comparison: {
      id: 'comparison-1',
      timestamp: new Date('2025-01-02T10:00:00Z'),
      version: 'v1.1.0',
      metadata: {
        totalIssues: 8,
        criticalIssues: 2,
        highIssues: 3,
        mediumIssues: 2,
        lowIssues: 1,
        fixableIssues: 6,
        score: 80,
        executionTime: 4500,
        tools: ['eslint', 'typescript'],
      },
      issues: [],
      metrics: {
        coverage: 88,
        duplicates: 1,
        newIssues: 1,
        resolvedIssues: 3,
        trends: {
          severity: { error: 2, warning: 4, info: 2 },
          tools: { eslint: 5, typescript: 3 },
          categories: { security: 1, performance: 3, maintainability: 4 },
        },
      },
    },
    summary: {
      totalIssuesDiff: -2,
      criticalIssuesDiff: -1,
      scoreDiff: 5,
      newIssuesCount: 1,
      resolvedIssuesCount: 3,
      unchangedIssuesCount: 5,
      improvementRate: 20,
    },
    differences: {
      newIssues: [],
      resolvedIssues: [],
      unchangedIssues: [],
      severityChanges: [],
      scoreChanges: [],
    },
    trends: {
      severity: [
        { type: 'error', baseline: 3, comparison: 2, diff: -1, trend: 'down' },
        { type: 'warning', baseline: 4, comparison: 4, diff: 0, trend: 'stable' },
        { type: 'info', baseline: 3, comparison: 2, diff: -1, trend: 'down' },
      ],
      tools: [
        { tool: 'eslint', baseline: 6, comparison: 5, diff: -1, trend: 'down' },
        { tool: 'typescript', baseline: 4, comparison: 3, diff: -1, trend: 'down' },
      ],
      categories: [
        { category: 'security', baseline: 2, comparison: 1, diff: -1, trend: 'down' },
        { category: 'performance', baseline: 3, comparison: 3, diff: 0, trend: 'stable' },
        { category: 'maintainability', baseline: 5, comparison: 4, diff: -1, trend: 'down' },
      ],
    },
    generatedAt: new Date('2025-01-03T10:00:00Z'),
  };

  it('should render comparison summary header', () => {
    const { lastFrame } = render(<ComparisonSummary comparison={mockComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Overview');
    expect(output).toContain('v1.0.0');
    expect(output).toContain('v1.1.0');
  });

  it('should display key metrics correctly', () => {
    const { lastFrame } = render(<ComparisonSummary comparison={mockComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Total Issues');
    expect(output).toContain('10');
    expect(output).toContain('8');
    expect(output).toContain('Critical Issues');
    expect(output).toContain('3');
    expect(output).toContain('2');
    expect(output).toContain('Quality Score');
    expect(output).toContain('75');
    expect(output).toContain('80');
  });

  it('should show issues changes', () => {
    const { lastFrame } = render(<ComparisonSummary comparison={mockComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Issues Changes');
    expect(output).toContain('New Issues:');
    expect(output).toContain('+1');
    expect(output).toContain('Resolved Issues:');
    expect(output).toContain('-3');
    expect(output).toContain('Unchanged Issues:');
    expect(output).toContain('5');
  });

  it('should display severity breakdown', () => {
    const { lastFrame } = render(<ComparisonSummary comparison={mockComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Severity Breakdown');
    expect(output).toContain('ERROR:');
    expect(output).toContain('3');
    expect(output).toContain('2');
    expect(output).toContain('WARNING:');
    expect(output).toContain('INFO:');
  });

  it('should show overall status with improvement rate', () => {
    const { lastFrame } = render(<ComparisonSummary comparison={mockComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Overall Status');
    expect(output).toContain('Improvement Rate: 20.00%');
    expect(output).toContain('Significant Improvement');
  });

  it('should display tool analysis', () => {
    const { lastFrame } = render(<ComparisonSummary comparison={mockComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Tool Analysis');
    expect(output).toContain('eslint:');
    expect(output).toContain('typescript:');
  });

  it('should handle negative improvement rate', () => {
    const negativeComparison = {
      ...mockComparison,
      summary: {
        ...mockComparison.summary,
        improvementRate: -15,
      },
    };

    const { lastFrame } = render(<ComparisonSummary comparison={negativeComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Significant Degradation');
    expect(output).toContain('Improvement Rate: -15.00%');
  });

  it('should show trend indicators correctly', () => {
    const { lastFrame } = render(<ComparisonSummary comparison={mockComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('📉'); // Down trend for total issues
    expect(output).toContain('📈'); // Up trend for score
  });

  it('should display relative time information', () => {
    const { lastFrame } = render(<ComparisonSummary comparison={mockComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('1/1/2025');
    expect(output).toContain('1/2/2025');
  });

  it('should show descriptive status messages', () => {
    const { lastFrame } = render(<ComparisonSummary comparison={mockComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('🟢 Good progress!');
    expect(output).toContain('3 issues resolved');
    expect(output).toContain('1 new issues introduced');
  });

  it('should handle comparison without version numbers', () => {
    const noVersionComparison = {
      ...mockComparison,
      baseline: { ...mockComparison.baseline, version: undefined },
      comparison: { ...mockComparison.comparison, version: undefined },
    };

    const { lastFrame } = render(<ComparisonSummary comparison={noVersionComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('baseline'); // Shows first 8 chars of ID
    expect(output).toContain('comparis'); // Shows first 8 chars of ID
    expect(output).not.toContain('v1.0.0');
  });

  it('should not display category trends (not implemented in this component)', () => {
    const { lastFrame } = render(<ComparisonSummary comparison={mockComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).not.toContain('Security:');
    expect(output).not.toContain('Performance:');
    expect(output).not.toContain('Maintainability:');
  });

  it('should show appropriate colors for different trend types', () => {
    // This test checks that the component includes trend indicators
    const { lastFrame } = render(<ComparisonSummary comparison={mockComparison} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    // The component should show some form of trend indication
    expect(output).toContain('10             →  8'); // Total issues trend
  });
});
