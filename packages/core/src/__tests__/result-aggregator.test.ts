import { describe, it, expect, beforeEach } from 'bun:test';
import { ResultAggregator } from '../analysis/result-aggregator.js';
import type { NormalizedResult, IssueStatistics, AggregatedCoverage, AggregatedPerformance } from '../analysis/result-aggregator.js';
import type { Logger } from '../plugins/analysis-plugin.js';

describe('ResultAggregator', () => {
  let aggregator: ResultAggregator;
  let mockLogger: Logger;

  // Helper function available to all describe blocks
  const createMockResult = (toolName: string, issuesCount: number, errorsCount: number = 0): NormalizedResult => ({
    toolName,
    toolVersion: '1.0.0',
    status: 'success' as const,
    executionTime: 1000,
    startTime: new Date(),
    endTime: new Date(Date.now() + 1000),
    issues: Array.from({ length: issuesCount }, (_, i) => ({
      id: `issue-${toolName}-${i}`,
      toolName,
      severity: i < errorsCount ? 'error' as const : 'warning' as const,
      category: 'test-category',
      filePath: `test-${toolName}.js`,
      lineNumber: i + 1,
      message: `Test issue ${i}`,
      originalMessage: `Test issue ${i}`,
      ruleId: `rule-${i}`,
      fixable: i % 2 === 0,
      score: i < errorsCount ? 100 : 50,
      tags: ['test'],
      metadata: {}
    })),
    metrics: {
      toolName,
      executionTime: 1000,
      issuesCount,
      errorsCount,
      warningsCount: issuesCount - errorsCount,
      infoCount: 0,
      fixableCount: Math.floor(issuesCount / 2),
      score: 100 - (errorsCount * 10) - ((issuesCount - errorsCount) * 5),
      customMetrics: {},
      performance: {
        filesProcessed: 5,
        linesOfCode: 100
      }
    },
    summary: {
      totalIssues: issuesCount,
      criticalIssues: errorsCount,
      majorIssues: 0,
      minorIssues: issuesCount - errorsCount,
      fixableIssues: Math.floor(issuesCount / 2),
      coveragePercentage: undefined
    },
    configuration: {},
    metadata: {}
  });

  beforeEach(() => {
    mockLogger = {
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {}
    };

    const config = {
      weights: {
        errors: 5,
        warnings: 1,
        info: 0.5,
        coverage: 2,
        performance: 1
      },
      thresholds: {
        excellent: 90,
        good: 80,
        fair: 70,
        poor: 60
      },
      grouping: {
        byCategory: true,
        bySeverity: true,
        byFile: true,
        byTool: true
      },
      filters: {
        excludeRules: [],
        excludePaths: [],
        excludeCategories: [],
        minSeverity: 'info' as const
      }
    };

    aggregator = new ResultAggregator(config, mockLogger);
  });

  describe('result aggregation', () => {

    it('should aggregate normalized results', () => {
      const results = [
        createMockResult('eslint', 10, 2),
        createMockResult('prettier', 5, 0),
        createMockResult('typescript', 3, 1)
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');

      expect(aggregated).toBeDefined();
      expect(aggregated.issueStatistics.total).toBe(18);
      expect(aggregated.issueStatistics.bySeverity.errors).toBe(3);
      expect(aggregated.issueStatistics.bySeverity.warnings).toBe(15);
      expect(aggregated.issueStatistics.fixable).toBe(10);
    });

    it('should calculate overall score correctly', () => {
      const results = [
        createMockResult('eslint', 10, 2),
        createMockResult('prettier', 5, 0)
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.overallScore).toBeGreaterThan(50);
      expect(aggregated.overallScore).toBeLessThan(100);
    });

    it('should generate appropriate grade', () => {
      const results = [
        createMockResult('perfect-tool', 0, 0)
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.overallScore).toBe(100);
      expect(aggregated.grade).toBe('A');

      const resultsWithIssues = [
        createMockResult('problematic-tool', 20, 10)
      ];

      const aggregatedWithIssues = aggregator.aggregateResults(resultsWithIssues, 'test-project');
      expect(aggregatedWithIssues.overallScore).toBeLessThan(50);
      expect(['D', 'F']).toContain(aggregatedWithIssues.grade);
    });

    it('should group issues by category', () => {
      const results = [
        createMockResult('eslint', 5, 2),
        createMockResult('prettier', 5, 0)
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.issueStatistics.byCategory['test-category']).toBe(10);
    });

    it('should group issues by tool', () => {
      const results = [
        createMockResult('eslint', 5, 2),
        createMockResult('prettier', 5, 0)
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.issueStatistics.byTool['eslint']).toBe(5);
      expect(aggregated.issueStatistics.byTool['prettier']).toBe(5);
    });
  });

  describe('coverage aggregation', () => {
    it('should aggregate coverage data', () => {
      const results = [
        {
          toolName: 'test-coverage',
          toolVersion: '1.0.0',
          status: 'success' as const,
          executionTime: 1000,
          startTime: new Date(),
          endTime: new Date(Date.now() + 1000),
          issues: [],
          metrics: {
            toolName: 'test-coverage',
            executionTime: 1000,
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100,
            coverage: {
              lines: { total: 100, covered: 80, percentage: 80 },
              functions: { total: 20, covered: 15, percentage: 75 },
              branches: { total: 50, covered: 30, percentage: 60 },
              statements: { total: 150, covered: 120, percentage: 80 }
            },
            customMetrics: {},
            performance: {
              filesProcessed: 5,
              linesOfCode: 100
            }
          },
          summary: {
            totalIssues: 0,
            criticalIssues: 0,
            majorIssues: 0,
            minorIssues: 0,
            fixableIssues: 0,
            coveragePercentage: 80
          },
          configuration: {},
          metadata: {}
        }
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.coverage).toBeDefined();
      expect(aggregated.coverage!.lines.percentage).toBe(80);
      expect(aggregated.coverage!.functions.percentage).toBe(75);
      expect(aggregated.coverage!.branches.percentage).toBe(60);
      expect(aggregated.coverage!.statements.percentage).toBe(80);
    });

    it('should handle missing coverage data', () => {
      const results = [
        {
          toolName: 'no-coverage-tool',
          toolVersion: '1.0.0',
          status: 'success' as const,
          executionTime: 1000,
          startTime: new Date(),
          endTime: new Date(Date.now() + 1000),
          issues: [],
          metrics: {
            toolName: 'no-coverage-tool',
            executionTime: 1000,
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100,
            customMetrics: {},
            performance: {
              filesProcessed: 5,
              linesOfCode: 100
            }
          },
          summary: {
            totalIssues: 0,
            criticalIssues: 0,
            majorIssues: 0,
            minorIssues: 0,
            fixableIssues: 0,
            coveragePercentage: undefined
          },
          configuration: {},
          metadata: {}
        }
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.coverage).toBeNull();
    });
  });

  describe('performance aggregation', () => {
    it('should aggregate performance metrics', () => {
      const results = [
        {
          toolName: 'fast-tool',
          toolVersion: '1.0.0',
          status: 'success' as const,
          executionTime: 500,
          startTime: new Date(),
          endTime: new Date(Date.now() + 500),
          issues: [],
          metrics: {
            toolName: 'fast-tool',
            executionTime: 500,
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100,
            customMetrics: {},
            performance: {
              filesProcessed: 10,
              linesOfCode: 200
            }
          },
          summary: {
            totalIssues: 0,
            criticalIssues: 0,
            majorIssues: 0,
            minorIssues: 0,
            fixableIssues: 0,
            coveragePercentage: undefined
          },
          configuration: {},
          metadata: {}
        },
        {
          toolName: 'slow-tool',
          toolVersion: '1.0.0',
          status: 'success' as const,
          executionTime: 2000,
          startTime: new Date(),
          endTime: new Date(Date.now() + 2000),
          issues: [],
          metrics: {
            toolName: 'slow-tool',
            executionTime: 2000,
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100,
            customMetrics: {},
            performance: {
              filesProcessed: 5,
              linesOfCode: 100
            }
          },
          summary: {
            totalIssues: 0,
            criticalIssues: 0,
            majorIssues: 0,
            minorIssues: 0,
            fixableIssues: 0,
            coveragePercentage: undefined
          },
          configuration: {},
          metadata: {}
        }
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.performance).toBeDefined();
      expect(aggregated.performance!.totalExecutionTime).toBe(2500);
      expect(aggregated.performance!.averageExecutionTime).toBe(1250);
      expect(aggregated.performance!.slowestTool).toBe('slow-tool');
      expect(aggregated.performance!.fastestTool).toBe('fast-tool');
      expect(aggregated.performance!.toolsExecuted).toBe(2);
      expect(aggregated.performance!.filesProcessed).toBe(15);
      expect(aggregated.performance!.linesOfCode).toBe(300);
    });
  });

  describe('trend analysis', () => {
    it('should analyze trends with baseline', () => {
      const currentResults = [
        createMockResult('eslint', 10, 5),
        createMockResult('prettier', 5, 0)
      ];

      const baselineResults = [
        createMockResult('eslint', 15, 8),
        createMockResult('prettier', 3, 0)
      ];

      const aggregated = aggregator.aggregateResults(currentResults, 'test-project', baselineResults);

      // The trend analysis works as follows:
      // - Issues 1-10 exist in both ESLint results (not new/fixed)
      // - Issues 11-15 existed only in baseline ESLint (fixed: 5)
      // - Issues 1-3 exist in both Prettier results (not new/fixed)
      // - Issues 4-5 exist only in current Prettier (new: 2)

      expect(aggregated.trends.newIssues).toBe(2); // Only prettier issues 4-5 are new
      expect(aggregated.trends.fixedIssues).toBe(5); // ESLint issues 11-15 are fixed
      expect(aggregated.trends.regression).toBe(false); // More fixed issues than new issues (improvement)
      expect(aggregated.trends).toBeDefined();
    });

    it('should handle missing baseline', () => {
      const results = [
        createMockResult('eslint', 10, 5)
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.trends.newIssues).toBe(0);
      expect(aggregated.trends.fixedIssues).toBe(0);
      expect(aggregated.trends.regression).toBe(false);
    });
  });

  describe('recommendations', () => {
    it('should generate recommendations based on results', () => {
      const results = [
        createMockResult('eslint', 20, 10), // High error count
        createMockResult('prettier', 0, 0)      // No issues
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.recommendations.length).toBeGreaterThan(0);
      expect(aggregated.recommendations.some(rec => rec.includes('error'))).toBe(true);
    });

    it('should recommend coverage improvements', () => {
      const results = [
        {
          toolName: 'coverage-tool',
          toolVersion: '1.0.0',
          status: 'success' as const,
          executionTime: 1000,
          startTime: new Date(),
          endTime: new Date(Date.now() + 1000),
          issues: [],
          metrics: {
            toolName: 'coverage-tool',
            executionTime: 1000,
            issuesCount: 0,
            errorsCount: 0,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 100,
            coverage: {
              lines: { total: 100, covered: 50, percentage: 50 }, // Low coverage
              functions: { total: 20, covered: 10, percentage: 50 },
              branches: { total: 50, covered: 25, percentage: 50 },
              statements: { total: 150, covered: 75, percentage: 50 }
            },
            customMetrics: {},
            performance: {
              filesProcessed: 5,
              linesOfCode: 100
            }
          },
          summary: {
            totalIssues: 0,
            criticalIssues: 0,
            majorIssues: 0,
            minorIssues: 0,
            fixableIssues: 0,
            coveragePercentage: 50
          },
          configuration: {},
          metadata: {}
        }
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.recommendations.some(rec => rec.includes('coverage'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty results', () => {
      const aggregated = aggregator.aggregateResults([], 'test-project');
      expect(aggregated.issueStatistics.total).toBe(0);
      expect(aggregated.overallScore).toBe(100);
      expect(aggregated.grade).toBe('A');
    });

    it('should handle results with no issues', () => {
      const results = [
        createMockResult('perfect-tool', 0, 0)
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.issueStatistics.total).toBe(0);
      expect(aggregated.overallScore).toBe(100);
      expect(aggregated.grade).toBe('A');
      expect(aggregated.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle very high issue counts', () => {
      const results = [
        createMockResult('problematic-tool', 1000, 500) // Very high issue count
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');
      expect(aggregated.issueStatistics.total).toBe(1000);
      expect(aggregated.overallScore).toBeLessThan(20);
      expect(['F', 'D']).toContain(aggregated.grade);
    });
  });

  describe('AI prompt generation', () => {
    it('should generate AI prompts for critical issues', () => {
      const results = [
        createMockResult('eslint', 10, 8) // High severity issues
      ];

      const startTime = new Date();
      const analysisResult = aggregator.createAnalysisResult(results, {
        overallScore: 20,
        issueStatistics: {
          total: results.reduce((sum, r) => sum + r.issues.length, 0),
          bySeverity: {
            errors: results.reduce((sum, r) => sum + (r.errorsCount || 0), 0),
            warnings: results.reduce((sum, r) => sum + (r.warningsCount || 0), 0),
            info: 0
          },
          byCategory: {},
          fixable: results.reduce((sum, r) => sum + (r.fixableCount || 0), 0),
          critical: results.reduce((sum, r) => sum + (r.criticalCount || 0), 0)
        }
      } as any, 'test-project', startTime);

      expect(analysisResult.aiPrompts.length).toBeGreaterThan(0);
      expect(analysisResult.aiPrompts[0].type).toBe('fix-suggestions');
      expect(analysisResult.aiPrompts[0].priority).toBe('high');
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        weights: {
          errors: 200,
          warnings: 100,
          info: 20,
          coverage: 40,
          performance: 20
        },
        thresholds: {
          excellent: 95,
          good: 85,
          fair: 75,
          poor: 65
        },
        grouping: {
          byCategory: false,
          bySeverity: false,
          byFile: false,
          byTool: false
        },
        filters: {
          excludeRules: ['test-rule'],
          excludePaths: ['test.js'],
          excludeCategories: ['test-category'],
          minSeverity: 'error' as const
        }
      };

      aggregator.updateConfig(newConfig);
      // Should not throw
      expect(aggregator).toBeDefined();
    });
  });
});