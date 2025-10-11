import { describe, it, expect, beforeEach } from 'vitest';

// Mock data structures for comparative analysis
interface AnalysisRun {
  id: string;
  timestamp: Date;
  projectId: string;
  overallScore: number;
  issueCount: number;
  issues: AnalysisIssue[];
  metrics: {
    coverage: number;
    maintainability: number;
    reliability: number;
    security: number;
  };
}

interface AnalysisIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: number;
  toolName: string;
  filePath: string;
  lineNumber: number;
  message: string;
  score: number;
}

interface ComparisonResult {
  run1: AnalysisRun;
  run2: AnalysisRun;
  differences: {
    addedIssues: AnalysisIssue[];
    removedIssues: AnalysisIssue[];
    modifiedIssues: Array<{ old: AnalysisIssue; new: AnalysisIssue }>;
  };
  metricChanges: {
    overallScore: number;
    coverage: number;
    maintainability: number;
    reliability: number;
    security: number;
    issueCount: number;
  };
  trend: 'improved' | 'degraded' | 'stable';
}

describe('2.3-UNIT-009: Diff Calculation Algorithm', () => {
  let generateMockRun: (id: string, baseScore: number) => AnalysisRun;

  beforeEach(() => {
    generateMockRun = (id: string, baseScore: number): AnalysisRun => {
      // Create deterministic base issues for consistent testing
      const baseIssues = Array.from({ length: 10 }, (_, i) => ({
        id: `base-issue-${i}`,
        type: ['error', 'warning', 'info'][i % 3] as 'error' | 'warning' | 'info',
        severity: (i % 5) + 5,
        toolName: ['eslint', 'typescript', 'prettier'][i % 3],
        filePath: `src/components/component${i}.tsx`,
        lineNumber: i + 1,
        message: `Base issue ${i}`,
        score: (i % 5) + 5
      }));

      return {
        id,
        timestamp: new Date(`2025-01-${id.padStart(2, '0')}`),
        projectId: 'test-project',
        overallScore: baseScore,
        issueCount: baseIssues.length,
        issues: baseIssues,
        metrics: {
          coverage: baseScore + 5,
          maintainability: baseScore - 5,
          reliability: baseScore + 10,
          security: baseScore
        }
      };
    };
  });

  const calculateDiff = (run1: AnalysisRun, run2: AnalysisRun): ComparisonResult => {
    // Find added issues (present in run2 but not run1)
    const addedIssues = run2.issues.filter(issue2 =>
      !run1.issues.some(issue1 =>
        issue1.id === issue2.id
      )
    );

    // Find removed issues (present in run1 but not run2)
    const removedIssues = run1.issues.filter(issue1 =>
      !run2.issues.some(issue2 =>
        issue1.id === issue2.id
      )
    );

    // Find modified issues (same ID but different details)
    const modifiedIssues = run1.issues.flatMap(issue1 => {
      const matchingIssue = run2.issues.find(issue2 =>
        issue1.id === issue2.id
      );

      if (matchingIssue &&
          (issue1.message !== matchingIssue.message ||
           issue1.severity !== matchingIssue.severity ||
           issue1.score !== matchingIssue.score)) {
        return [{ old: issue1, new: matchingIssue }];
      }
      return [];
    });

    // Calculate metric changes - use actual issue array lengths
    const metricChanges = {
      overallScore: run2.overallScore - run1.overallScore,
      coverage: run2.metrics.coverage - run1.metrics.coverage,
      maintainability: run2.metrics.maintainability - run1.metrics.maintainability,
      reliability: run2.metrics.reliability - run1.metrics.reliability,
      security: run2.metrics.security - run1.metrics.security,
      issueCount: run2.issues.length - run1.issues.length
    };

    // Determine trend
    let trend: 'improved' | 'degraded' | 'stable' = 'stable';
    const significantChanges = Object.values(metricChanges).filter(change =>
      Math.abs(change) > 5
    ).length;

    if (significantChanges > 0) {
      const positiveChanges = Object.values(metricChanges).filter(change =>
        change > 5
      ).length;
      const negativeChanges = Object.values(metricChanges).filter(change =>
        change < -5
      ).length;

      if (positiveChanges > negativeChanges) {
        trend = 'improved';
      } else if (negativeChanges > positiveChanges) {
        trend = 'degraded';
      }
    }

    return {
      run1,
      run2,
      differences: {
        addedIssues,
        removedIssues,
        modifiedIssues
      },
      metricChanges,
      trend
    };
  };

  it('should detect added issues correctly', () => {
    const run1 = generateMockRun('01', 75);
    const run2 = generateMockRun('02', 75);

    // Add a new issue to run2
    const newIssue: AnalysisIssue = {
      id: 'new-issue',
      type: 'error',
      severity: 8,
      toolName: 'eslint',
      filePath: 'src/components/NewComponent.tsx',
      lineNumber: 15,
      message: 'New issue introduced',
      score: 8
    };
    run2.issues.push(newIssue);

    const result = calculateDiff(run1, run2);

    expect(result.differences.addedIssues).toHaveLength(1);
    expect(result.differences.addedIssues[0]).toEqual(newIssue);
    expect(result.differences.removedIssues).toHaveLength(0);
    expect(result.metricChanges.issueCount).toBe(1);
  });

  it('should detect removed issues correctly', () => {
    const run1 = generateMockRun('01', 75);
    const run2 = generateMockRun('02', 75);

    // Remove an issue from run2
    const removedIssue = run1.issues[0];
    run2.issues = run1.issues.filter(issue => issue.id !== removedIssue.id);

    const result = calculateDiff(run1, run2);

    expect(result.differences.removedIssues).toHaveLength(1);
    expect(result.differences.removedIssues[0]).toEqual(removedIssue);
    expect(result.differences.addedIssues).toHaveLength(0);
    expect(result.metricChanges.issueCount).toBe(-1);
  });

  it('should detect modified issues correctly', () => {
    const run1 = generateMockRun('01', 75);
    const run2 = generateMockRun('02', 75);

    // Modify an issue in run2
    const modifiedIssue = { ...run2.issues[0] };
    modifiedIssue.severity = 9; // Changed from original
    modifiedIssue.message = 'Modified message'; // Changed message
    run2.issues[0] = modifiedIssue;

    const result = calculateDiff(run1, run2);

    expect(result.differences.modifiedIssues).toHaveLength(1);
    expect(result.differences.modifiedIssues[0].old).toEqual(run1.issues[0]);
    expect(result.differences.modifiedIssues[0].new).toEqual(modifiedIssue);
  });

  it('should handle complex diff scenarios', () => {
    const run1 = generateMockRun('01', 75);
    const run2 = generateMockRun('02', 80);

    // Add 2 new issues
    run2.issues.push(
      {
        id: 'added-1',
        type: 'error',
        severity: 7,
        toolName: 'typescript',
        filePath: 'src/added/file1.ts',
        lineNumber: 10,
        message: 'Added issue 1',
        score: 7
      },
      {
        id: 'added-2',
        type: 'warning',
        severity: 5,
        toolName: 'eslint',
        filePath: 'src/added/file2.ts',
        lineNumber: 20,
        message: 'Added issue 2',
        score: 5
      }
    );

    // Remove 1 issue
    const removedIssue = run1.issues[2];
    run2.issues = run2.issues.filter(issue => issue.id !== removedIssue.id);

    // Modify 1 issue
    const modifiedIndex = 1;
    run2.issues[modifiedIndex] = {
      ...run2.issues[modifiedIndex],
      severity: 8,
      message: 'Modified severity and message'
    };

    const result = calculateDiff(run1, run2);

    expect(result.differences.addedIssues).toHaveLength(2);
    expect(result.differences.removedIssues).toHaveLength(1);
    expect(result.differences.modifiedIssues).toHaveLength(1);
    expect(result.metricChanges.issueCount).toBe(1); // 2 added - 1 removed
  });

  it('should handle identical runs', () => {
    const run1 = generateMockRun('01', 75);
    const run2 = { ...run1, id: '02' }; // Same data, different ID

    const result = calculateDiff(run1, run2);

    expect(result.differences.addedIssues).toHaveLength(0);
    expect(result.differences.removedIssues).toHaveLength(0);
    expect(result.differences.modifiedIssues).toHaveLength(0);
    expect(result.trend).toBe('stable');
    expect(Object.values(result.metricChanges).every(change => change === 0)).toBe(true);
  });

  it('should handle empty issue lists', () => {
    const run1: AnalysisRun = {
      id: '01',
      timestamp: new Date('2025-01-01'),
      projectId: 'test-project',
      overallScore: 100,
      issueCount: 0,
      issues: [],
      metrics: { coverage: 100, maintainability: 100, reliability: 100, security: 100 }
    };

    const run2: AnalysisRun = {
      id: '02',
      timestamp: new Date('2025-01-02'),
      projectId: 'test-project',
      overallScore: 80,
      issueCount: 3,
      issues: [
        {
          id: 'issue-1',
          type: 'error',
          severity: 8,
          toolName: 'eslint',
          filePath: 'src/file.ts',
          lineNumber: 10,
          message: 'New error',
          score: 8
        }
      ],
      metrics: { coverage: 90, maintainability: 85, reliability: 80, security: 90 }
    };

    const result = calculateDiff(run1, run2);

    expect(result.differences.addedIssues).toHaveLength(1);
    expect(result.differences.removedIssues).toHaveLength(0);
    expect(result.differences.modifiedIssues).toHaveLength(0);
    expect(result.metricChanges.overallScore).toBe(-20);
    expect(result.trend).toBe('degraded');
  });
});

describe('2.3-UNIT-010: Metric Comparison Logic', () => {
  const calculateMetricComparison = (run1: AnalysisRun, run2: AnalysisRun) => {
    const metrics = ['coverage', 'maintainability', 'reliability', 'security'] as const;

    const roundToTwo = (num: number): number => Math.round(num * 100) / 100;

    return {
      changes: metrics.reduce((acc, metric) => {
        acc[metric] = {
          previous: run1.metrics[metric],
          current: run2.metrics[metric],
          change: run2.metrics[metric] - run1.metrics[metric],
          percentageChange: run1.metrics[metric] !== 0
            ? roundToTwo(((run2.metrics[metric] - run1.metrics[metric]) / run1.metrics[metric]) * 100)
            : 0
        };
        return acc;
      }, {} as Record<string, any>),

      overallScoreChange: run2.overallScore - run1.overallScore,
      overallScorePercentageChange: roundToTwo(((run2.overallScore - run1.overallScore) / run1.overallScore) * 100),

      issueCountChange: run2.issueCount - run1.issueCount,
      issueCountPercentageChange: run1.issueCount !== 0
        ? roundToTwo(((run2.issueCount - run1.issueCount) / run1.issueCount) * 100)
        : 0
    };
  };

  const defaultMetrics = {
    coverage: 80,
    maintainability: 75,
    reliability: 85,
    security: 90
  };

  const generateMockRunWithMetrics = (overallScore: number, metrics: Partial<typeof defaultMetrics>): AnalysisRun => {
    return {
      id: 'test',
      timestamp: new Date(),
      projectId: 'test',
      overallScore,
      issueCount: 10,
      issues: [],
      metrics: { ...defaultMetrics, ...metrics }
    };
  };

  it('should calculate metric changes correctly', () => {
    const run1 = generateMockRunWithMetrics(75, { coverage: 80, maintainability: 70 });
    const run2 = generateMockRunWithMetrics(85, { coverage: 85, maintainability: 75 });

    const comparison = calculateMetricComparison(run1, run2);

    expect(comparison.changes.coverage.change).toBe(5);
    expect(comparison.changes.coverage.percentageChange).toBe(6.25);
    expect(comparison.changes.maintainability.change).toBe(5);
    expect(comparison.changes.maintainability.percentageChange).toBe(7.14);
    expect(comparison.overallScoreChange).toBe(10);
    expect(comparison.overallScorePercentageChange).toBe(13.33);
  });

  it('should handle negative changes', () => {
    const run1 = generateMockRunWithMetrics(85, { coverage: 90, maintainability: 80 });
    const run2 = generateMockRunWithMetrics(75, { coverage: 85, maintainability: 70 });

    const comparison = calculateMetricComparison(run1, run2);

    expect(comparison.changes.coverage.change).toBe(-5);
    expect(comparison.changes.coverage.percentageChange).toBe(-5.56);
    expect(comparison.changes.maintainability.change).toBe(-10);
    expect(comparison.changes.maintainability.percentageChange).toBe(-12.5);
    expect(comparison.overallScoreChange).toBe(-10);
    expect(comparison.overallScorePercentageChange).toBe(-11.76);
  });

  it('should handle zero division safely', () => {
    const run1 = generateMockRunWithMetrics(0, { coverage: 0, maintainability: 0 });
    const run2 = generateMockRunWithMetrics(50, { coverage: 50, maintainability: 50 });

    const comparison = calculateMetricComparison(run1, run2);

    expect(comparison.changes.coverage.change).toBe(50);
    expect(comparison.changes.coverage.percentageChange).toBe(0); // Should handle zero division
    expect(comparison.overallScorePercentageChange).toBe(Infinity); // This is expected for zero base
  });

  it('should provide detailed metric analysis', () => {
    const run1 = generateMockRunWithMetrics(70, {
      coverage: 75,
      maintainability: 80,
      reliability: 65,
      security: 60
    });
    const run2 = generateMockRunWithMetrics(80, {
      coverage: 85,
      maintainability: 75,
      reliability: 70,
      security: 90
    });

    const comparison = calculateMetricComparison(run1, run2);

    // Verify all metrics are calculated
    expect(Object.keys(comparison.changes)).toHaveLength(4);
    expect(comparison.changes.coverage.previous).toBe(75);
    expect(comparison.changes.coverage.current).toBe(85);
    expect(comparison.changes.maintainability.previous).toBe(80);
    expect(comparison.changes.maintainability.current).toBe(75);
    expect(comparison.changes.reliability.previous).toBe(65);
    expect(comparison.changes.reliability.current).toBe(70);
    expect(comparison.changes.security.previous).toBe(60);
    expect(comparison.changes.security.current).toBe(90);
  });
});

describe('2.3-UNIT-011: Trend Analysis Calculations', () => {
  interface TrendData {
    runs: AnalysisRun[];
    trends: {
      overallScore: 'improving' | 'declining' | 'stable';
      issueCount: 'improving' | 'declining' | 'stable';
      metrics: Record<string, 'improving' | 'declining' | 'stable'>;
    };
  }

  const calculateTrendAnalysis = (runs: AnalysisRun[]): TrendData => {
    if (runs.length < 2) {
      return {
        runs,
        trends: {
          overallScore: 'stable',
          issueCount: 'stable',
          metrics: {}
        }
      };
    }

    const calculateTrend = (values: number[]): 'improving' | 'declining' | 'stable' => {
      if (values.length < 2) return 'stable';

      // Calculate linear regression slope
      const n = values.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = values;

      const sumX = x.reduce((sum, val) => sum + val, 0);
      const sumY = y.reduce((sum, val) => sum + val, 0);
      const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
      const sumXX = x.reduce((sum, val) => sum + val * val, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

      if (Math.abs(slope) < 0.1) return 'stable';
      return slope > 0 ? 'improving' : 'declining';
    };

    const overallScores = runs.map(run => run.overallScore);
    const issueCounts = runs.map(run => run.issueCount);

    const metricTrends = {
      coverage: calculateTrend(runs.map(run => run.metrics.coverage)),
      maintainability: calculateTrend(runs.map(run => run.metrics.maintainability)),
      reliability: calculateTrend(runs.map(run => run.metrics.reliability)),
      security: calculateTrend(runs.map(run => run.metrics.security))
    };

    return {
      runs,
      trends: {
        overallScore: calculateTrend(overallScores),
        issueCount: calculateTrend(issueCounts.map(count => -count)), // Invert - fewer issues is better
        metrics: metricTrends
      }
    };
  };

  const generateMockRuns = (count: number, startScore: number, trend: 'improving' | 'declining' | 'stable'): AnalysisRun[] => {
    const runs: AnalysisRun[] = [];

    for (let i = 0; i < count; i++) {
      let score: number;
      if (trend === 'improving') {
        score = startScore + (i * 2);
      } else if (trend === 'declining') {
        score = startScore - (i * 2);
      } else {
        score = startScore + (Math.sin(i * 0.5) * 0.2); // Very small deterministic variations
      }

      const baseIssueCount = 20;
      let issueCount: number;
      if (trend === 'improving') {
        issueCount = Math.max(0, baseIssueCount - i); // Fewer issues over time
      } else if (trend === 'declining') {
        issueCount = baseIssueCount + i; // More issues over time
      } else {
        issueCount = baseIssueCount + Math.floor(Math.sin(i * 0.3) * 1); // Stable with very small deterministic variations
      }

      runs.push({
        id: `run-${i + 1}`,
        timestamp: new Date(`2025-01-${(i + 1).toString().padStart(2, '0')}`),
        projectId: 'test-project',
        overallScore: Math.max(0, Math.min(100, score)),
        issueCount,
        issues: [],
        metrics: {
          coverage: Math.max(0, Math.min(100, 80 + (trend === 'improving' ? i * 1 : trend === 'declining' ? -i * 1 : Math.sin(i * 0.4) * 0.5))),
          maintainability: Math.max(0, Math.min(100, 75 + (trend === 'improving' ? i * 1.5 : trend === 'declining' ? -i * 1.5 : Math.sin(i * 0.3) * 0.5))),
          reliability: Math.max(0, Math.min(100, 85 + (trend === 'improving' ? i * 0.5 : trend === 'declining' ? -i * 0.5 : Math.sin(i * 0.6) * 0.3))),
          security: Math.max(0, Math.min(100, 90 + (trend === 'improving' ? i * 0.3 : trend === 'declining' ? -i * 0.3 : Math.sin(i * 0.2) * 0.2)))
        }
      });
    }

    return runs;
  };

  it('should detect improving trend', () => {
    const runs = generateMockRuns(10, 70, 'improving');
    const trendData = calculateTrendAnalysis(runs);

    expect(trendData.trends.overallScore).toBe('improving');
    expect(trendData.trends.issueCount).toBe('improving'); // Fewer issues is better
    expect(trendData.trends.metrics.coverage).toBe('improving');
    expect(trendData.trends.metrics.maintainability).toBe('improving');
  });

  it('should detect declining trend', () => {
    const runs = generateMockRuns(10, 80, 'declining');
    const trendData = calculateTrendAnalysis(runs);

    expect(trendData.trends.overallScore).toBe('declining');
    expect(trendData.trends.issueCount).toBe('declining'); // More issues is worse
    expect(trendData.trends.metrics.coverage).toBe('declining');
    expect(trendData.trends.metrics.maintainability).toBe('declining');
  });

  it('should detect stable trend', () => {
    const runs = generateMockRuns(10, 75, 'stable');
    const trendData = calculateTrendAnalysis(runs);

    expect(trendData.trends.overallScore).toBe('stable');
    expect(trendData.trends.issueCount).toBe('stable');
  });

  it('should handle insufficient data', () => {
    const singleRun = generateMockRuns(1, 75, 'stable');
    const trendData = calculateTrendAnalysis(singleRun);

    expect(trendData.trends.overallScore).toBe('stable');
    expect(trendData.trends.issueCount).toBe('stable');
    expect(Object.keys(trendData.trends.metrics)).toHaveLength(0);
  });

  it('should calculate mixed trends correctly', () => {
    // Create runs with different trends for different metrics
    const runs: AnalysisRun[] = [
      {
        id: 'run-1',
        timestamp: new Date('2025-01-01'),
        projectId: 'test',
        overallScore: 70,
        issueCount: 20,
        issues: [],
        metrics: { coverage: 80, maintainability: 60, reliability: 85, security: 90 }
      },
      {
        id: 'run-2',
        timestamp: new Date('2025-01-02'),
        projectId: 'test',
        overallScore: 75,
        issueCount: 18,
        issues: [],
        metrics: { coverage: 82, maintainability: 65, reliability: 83, security: 88 }
      },
      {
        id: 'run-3',
        timestamp: new Date('2025-01-03'),
        projectId: 'test',
        overallScore: 80,
        issueCount: 15,
        issues: [],
        metrics: { coverage: 85, maintainability: 70, reliability: 80, security: 85 }
      }
    ];

    const trendData = calculateTrendAnalysis(runs);

    expect(trendData.trends.overallScore).toBe('improving');
    expect(trendData.trends.issueCount).toBe('improving');
    expect(trendData.trends.metrics.coverage).toBe('improving');
    expect(trendData.trends.metrics.maintainability).toBe('improving');
    expect(trendData.trends.metrics.reliability).toBe('declining');
    expect(trendData.trends.metrics.security).toBe('declining');
  });
});