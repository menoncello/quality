/**
 * Simple Result Aggregation Tests for Story 1.4 (DATA-001 Risk Validation)
 *
 * Tests to validate basic result aggregation functionality and data integrity
 * according to QA risk mitigation requirements.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { ResultNormalizer } from '../analysis/result-normalizer.js';
import { ResultAggregator } from '../analysis/result-aggregator.js';
import type { Logger, ToolResult } from '../plugins/analysis-plugin.js';

describe('Result Aggregation Validation (DATA-001)', () => {
  let normalizer: ResultNormalizer;
  let aggregator: ResultAggregator;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {}
    };

    normalizer = new ResultNormalizer(mockLogger);

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

  describe('Basic Result Normalization', () => {
    it('should normalize ESLint results correctly', () => {
      const eslintResult: ToolResult = {
        toolName: 'eslint',
        executionTime: 150,
        status: 'success',
        issues: [
          {
            id: 'eslint-1',
            type: 'error',
            toolName: 'eslint',
            filePath: 'src/file1.ts',
            lineNumber: 10,
            message: 'Unused variable "x"',
            ruleId: 'no-unused-vars',
            fixable: true,
            score: 10
          },
          {
            id: 'eslint-2',
            type: 'warning',
            toolName: 'eslint',
            filePath: 'src/file1.ts',
            lineNumber: 15,
            message: '"x" is never reassigned',
            ruleId: 'prefer-const',
            fixable: true,
            score: 3
          }
        ],
        metrics: {
          issuesCount: 2,
          errorsCount: 1,
          warningsCount: 1,
          infoCount: 0,
          fixableCount: 1,
          score: 87
        }
      };

      const normalized = normalizer.normalizeResult(eslintResult);

      expect(normalized.toolName).toBe('eslint');
      expect(normalized.issues).toHaveLength(2);
      expect(normalized.issues[0].severity).toBe('error');
      expect(normalized.issues[1].severity).toBe('warning');
      expect(normalized.issues[0].fixable).toBe(true);
      expect(normalized.metrics.issuesCount).toBe(2);
    });

    it('should normalize TypeScript results correctly', () => {
      const tsResult: ToolResult = {
        toolName: 'typescript',
        executionTime: 200,
        status: 'success',
        issues: [
          {
            id: 'ts-1',
            type: 'error',
            toolName: 'typescript',
            filePath: 'src/file1.ts',
            lineNumber: 20,
            message: "Property 'missingProp' does not exist",
            ruleId: '2339',
            fixable: false,
            score: 10
          }
        ],
        metrics: {
          issuesCount: 1,
          errorsCount: 1,
          warningsCount: 0,
          infoCount: 0,
          fixableCount: 0,
          score: 90
        }
      };

      const normalized = normalizer.normalizeResult(tsResult);

      expect(normalized.toolName).toBe('typescript');
      expect(normalized.issues).toHaveLength(1);
      expect(normalized.issues[0].severity).toBe('error');
      expect(normalized.issues[0].ruleId).toBe('2339');
      expect(normalized.metrics.issuesCount).toBe(1);
    });

    it('should normalize empty results correctly', () => {
      const emptyResult: ToolResult = {
        toolName: 'prettier',
        executionTime: 100,
        status: 'success',
        issues: [],
        metrics: {
          issuesCount: 0,
          errorsCount: 0,
          warningsCount: 0,
          infoCount: 0,
          fixableCount: 0,
          score: 100
        }
      };

      const normalized = normalizer.normalizeResult(emptyResult);

      expect(normalized.toolName).toBe('prettier');
      expect(normalized.issues).toHaveLength(0);
      expect(normalized.metrics.issuesCount).toBe(0);
      expect(normalized.metrics.score).toBe(100);
    });
  });

  describe('Basic Result Aggregation', () => {
    it('should aggregate multiple tool results correctly', () => {
      // Create mock normalized results using the same pattern as working tests
      const createMockResult = (toolName: string, issuesCount: number, errorsCount: number = 0): any => ({
        toolName,
        toolVersion: '1.0.0',
        status: 'success' as const,
        executionTime: 1000,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1000),
        issues: Array.from({ length: issuesCount }, (_, i) => ({
          id: `${toolName}-${Date.now()}-issue-${i}`, // Unique IDs with timestamp
          toolName,
          severity: i < errorsCount ? 'error' as const : 'warning' as const,
          category: 'test-category',
          filePath: `test-${toolName}.js`,
          lineNumber: i + 1,
          message: `Test issue ${i}`,
          originalMessage: `Test issue ${i}`,
          ruleId: `rule-${toolName}-${i}`,
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

      const results = [
        createMockResult('eslint', 2, 1), // 1 error, 1 warning
        createMockResult('typescript', 1, 1), // 1 error
        createMockResult('prettier', 0, 0) // no issues
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');

      expect(aggregated).toBeDefined();
      expect(aggregated.issueStatistics.total).toBe(3);
      expect(aggregated.issueStatistics.bySeverity.errors).toBe(2);
      expect(aggregated.issueStatistics.bySeverity.warnings).toBe(1);
      expect(aggregated.overallScore).toBeDefined();
      expect(aggregated.overallScore).toBeGreaterThan(0);
      expect(aggregated.overallScore).toBeLessThan(100);
      expect(aggregated.performance!.totalExecutionTime).toBe(3000);
      expect(aggregated.performance!.toolsExecuted).toBe(3);
    });

    it('should handle empty aggregation gracefully', () => {
      const aggregated = aggregator.aggregateResults([], 'test-project');

      expect(aggregated.issueStatistics.total).toBe(0);
      expect(aggregated.overallScore).toBe(100);
      expect(aggregated.grade).toBe('A');
      expect(aggregated.performance!.toolsExecuted).toBe(0);
    });

    it('should aggregate results with no issues', () => {
      const createMockResult = (toolName: string): any => ({
        toolName,
        toolVersion: '1.0.0',
        status: 'success' as const,
        executionTime: 100,
        startTime: new Date(),
        endTime: new Date(Date.now() + 100),
        issues: [],
        metrics: {
          toolName,
          executionTime: 100,
          issuesCount: 0,
          errorsCount: 0,
          warningsCount: 0,
          infoCount: 0,
          fixableCount: 0,
          score: 100,
          customMetrics: {},
          performance: {
            filesProcessed: 1,
            linesOfCode: 10
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
      });

      const results = [createMockResult('eslint'), createMockResult('prettier')];
      const aggregated = aggregator.aggregateResults(results, 'test-project');

      expect(aggregated.issueStatistics.total).toBe(0);
      expect(aggregated.overallScore).toBe(100);
      expect(aggregated.grade).toBe('A');
      expect(aggregated.performance!.totalExecutionTime).toBe(200);
      expect(aggregated.performance!.toolsExecuted).toBe(2);
    });
  });

  describe('Data Integrity Validation', () => {
    it('should maintain data consistency through aggregation pipeline', () => {
      const createMockResult = (toolName: string, issuesCount: number, errorsCount: number = 0): any => ({
        toolName,
        toolVersion: '1.0.0',
        status: 'success' as const,
        executionTime: 1000,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1000),
        issues: Array.from({ length: issuesCount }, (_, i) => ({
          id: `${toolName}-${Date.now()}-issue-${i}`, // Unique IDs with timestamp
          toolName,
          severity: i < errorsCount ? 'error' as const : 'warning' as const,
          category: 'test-category',
          filePath: `src/components/Button.tsx`,
          lineNumber: 25 + i,
          message: `Test issue ${i}`,
          originalMessage: `Test issue ${i}`,
          ruleId: `rule-${toolName}-${i}`,
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

      const results = [
        createMockResult('eslint', 1, 1),
        createMockResult('typescript', 1, 0)
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');

      // Validate data integrity
      expect(aggregated.issueStatistics.total).toBe(2);
      expect(aggregated.issueStatistics.bySeverity.errors).toBe(1);
      expect(aggregated.issueStatistics.bySeverity.warnings).toBe(1);
      expect(aggregated.performance!.totalExecutionTime).toBe(2000);
      expect(aggregated.performance!.toolsExecuted).toBe(2);
      expect(aggregated.issueStatistics.fixable).toBe(2); // Two fixable issues (one from each tool)
    });

    it('should handle error severity prioritization correctly', () => {
      const createMockResult = (toolName: string, hasErrors: boolean): any => ({
        toolName,
        toolVersion: '1.0.0',
        status: 'success' as const,
        executionTime: 500,
        startTime: new Date(),
        endTime: new Date(Date.now() + 500),
        issues: [
          {
            id: `${toolName}-${Date.now()}-issue-0`, // Unique ID with timestamp
            toolName,
            severity: hasErrors ? 'error' as const : 'warning' as const,
            category: 'test-category',
            filePath: 'test.js',
            lineNumber: 1,
            message: `Test ${hasErrors ? 'error' : 'warning'}`,
            originalMessage: `Test ${hasErrors ? 'error' : 'warning'}`,
            ruleId: `rule-${toolName}-0`,
            fixable: true,
            score: hasErrors ? 100 : 50,
            tags: ['test'],
            metadata: {}
          }
        ],
        metrics: {
          toolName,
          executionTime: 500,
          issuesCount: 1,
          errorsCount: hasErrors ? 1 : 0,
          warningsCount: hasErrors ? 0 : 1,
          infoCount: 0,
          fixableCount: 1,
          score: hasErrors ? 90 : 95,
          customMetrics: {},
          performance: {
            filesProcessed: 1,
            linesOfCode: 10
          }
        },
        summary: {
          totalIssues: 1,
          criticalIssues: hasErrors ? 1 : 0,
          majorIssues: 0,
          minorIssues: hasErrors ? 0 : 1,
          fixableIssues: 1,
          coveragePercentage: undefined
        },
        configuration: {},
        metadata: {}
      });

      const results = [
        createMockResult('error-tool', true), // Has error
        createMockResult('warning-tool', false) // Has warning
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');

      expect(aggregated.issueStatistics.total).toBe(2);
      expect(aggregated.issueStatistics.bySeverity.errors).toBe(1);
      expect(aggregated.issueStatistics.bySeverity.warnings).toBe(1);

      // Score should be penalized more heavily for errors
      expect(aggregated.overallScore).toBeLessThan(95); // Should be less than perfect score
      expect(aggregated.overallScore).toBeGreaterThan(0);
    });
  });

  describe('Error Tolerance', () => {
    it('should handle normalization errors gracefully', () => {
      const malformedResult = {
        toolName: '',
        executionTime: -100,
        status: 'invalid-status' as any,
        issues: null as any,
        metrics: {} as any
      };

      const normalized = normalizer.normalizeResult(malformedResult);

      // Should still produce a valid normalized result
      expect(normalized.toolName).toBe('');
      expect(normalized.executionTime).toBe(0);
      expect(normalized.status).toBe('error');
      expect(Array.isArray(normalized.issues)).toBe(true);
    });

    it('should handle aggregation with mixed quality results', () => {
      const createMockResult = (toolName: string, score: number, issuesCount: number): any => ({
        toolName,
        toolVersion: '1.0.0',
        status: 'success' as const,
        executionTime: 500,
        startTime: new Date(),
        endTime: new Date(Date.now() + 500),
        issues: Array.from({ length: issuesCount }, (_, i) => ({
          id: `${toolName}-${Date.now()}-issue-${i}`, // Unique IDs with timestamp
          toolName,
          severity: 'warning' as const,
          category: 'test-category',
          filePath: 'test.js',
          lineNumber: i + 1,
          message: `Test issue ${i}`,
          originalMessage: `Test issue ${i}`,
          ruleId: `rule-${toolName}-${i}`,
          fixable: true,
          score: 50,
          tags: ['test'],
          metadata: {}
        })),
        metrics: {
          toolName,
          executionTime: 500,
          issuesCount,
          errorsCount: 0,
          warningsCount: issuesCount,
          infoCount: 0,
          fixableCount: issuesCount,
          score,
          customMetrics: {},
          performance: {
            filesProcessed: 1,
            linesOfCode: 10
          }
        },
        summary: {
          totalIssues: issuesCount,
          criticalIssues: 0,
          majorIssues: 0,
          minorIssues: issuesCount,
          fixableIssues: issuesCount,
          coveragePercentage: undefined
        },
        configuration: {},
        metadata: {}
      });

      const results = [
        createMockResult('good-tool', 95, 1),
        createMockResult('bad-tool', 60, 10),
        createMockResult('average-tool', 80, 5)
      ];

      const aggregated = aggregator.aggregateResults(results, 'test-project');

      expect(aggregated.issueStatistics.total).toBe(16);
      expect(aggregated.overallScore).toBeLessThan(95); // Should be penalized for issues
      expect(aggregated.overallScore).toBeGreaterThan(60); // But not as low as worst tool
      expect(aggregated.performance!.toolsExecuted).toBe(3);
    });
  });
});