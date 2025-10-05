import { describe, it, expect, beforeEach } from 'bun:test';
import { ResultNormalizer } from '../analysis/result-normalizer.js';
import type {
  NormalizationRule,
  NormalizedIssue,
  NormalizedMetrics,
} from '../analysis/result-normalizer.js';
import type { Logger } from '../plugins/analysis-plugin.js';

describe('ResultNormalizer', () => {
  let resultNormalizer: ResultNormalizer;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {}
    };

    resultNormalizer = new ResultNormalizer(mockLogger);
  });

  describe('basic normalization', () => {
    it('should normalize a simple tool result', () => {
      const toolResult: any = {
        toolName: 'eslint',
        executionTime: 1500,
        status: 'success',
        issues: [
          {
            id: 'eslint-1',
            type: 'error',
            toolName: 'eslint',
            filePath: 'test.js',
            lineNumber: 10,
            message: 'Unexpected console statement',
            fixable: true,
            score: 80
          },
          {
            id: 'eslint-2',
            type: 'warning',
            toolName: 'eslint',
            filePath: 'test.js',
            lineNumber: 15,
            message: 'Missing semicolon',
            fixable: true,
            score: 60
          }
        ],
        metrics: {
          issuesCount: 2,
          errorsCount: 1,
          warningsCount: 1,
          infoCount: 0,
          fixableCount: 2,
          score: 70
        }
      };

      const normalized = resultNormalizer.normalizeResult(toolResult);

      expect(normalized.toolName).toBe('eslint');
      expect(normalized.toolVersion).toBeDefined();
      expect(normalized.status).toBe('success');
      expect(normalized.issues).toHaveLength(2);
      expect(normalized.metrics.issuesCount).toBe(2);
      expect(normalized.metrics.errorsCount).toBe(1);
      expect(normalized.metrics.warningsCount).toBe(1);
    });

    it('should handle empty results', () => {
      const toolResult: any = {
        toolName: 'empty-tool',
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

      const normalized = resultNormalizer.normalizeResult(toolResult);

      expect(normalized.issues).toHaveLength(0);
      expect(normalized.metrics.issuesCount).toBe(0);
      expect(normalized.metrics.score).toBe(100);
    });

    it('should handle failed tool results', () => {
      const toolResult: any = {
        toolName: 'failing-tool',
        executionTime: 500,
        status: 'error',
        issues: [],
        metrics: {
          issuesCount: 0,
          errorsCount: 0,
          warningsCount: 0,
          infoCount: 0,
          fixableCount: 0,
          score: 0
        }
      };

      const normalized = resultNormalizer.normalizeResult(toolResult);

      expect(normalized.status).toBe('error');
      expect(normalized.metrics.score).toBe(0);
    });
  });

  describe('issue normalization', () => {
    it('should normalize issue severity', () => {
      const toolResult: any = {
        toolName: 'test-tool',
        executionTime: 100,
        status: 'success',
        issues: [
          {
            id: 'issue-1',
            type: 'error',
            toolName: 'test-tool',
            filePath: 'test.js',
            lineNumber: 1,
            message: 'Error message',
            fixable: false,
            score: 90
          },
          {
            id: 'issue-2',
            type: 'warning',
            toolName: 'test-tool',
            filePath: 'test.js',
            lineNumber: 2,
            message: 'Warning message',
            fixable: true,
            score: 70
          },
          {
            id: 'issue-3',
            type: 'info',
            toolName: 'test-tool',
            filePath: 'test.js',
            lineNumber: 3,
            message: 'Info message',
            fixable: false,
            score: 50
          }
        ],
        metrics: {
          issuesCount: 3,
          errorsCount: 1,
          warningsCount: 1,
          infoCount: 1,
          fixableCount: 1,
          score: 70
        }
      };

      const normalized = resultNormalizer.normalizeResult(toolResult);

      expect(normalized.issues).toHaveLength(3);

      const errorIssue = normalized.issues.find(i => i.severity === 'error');
      const warningIssue = normalized.issues.find(i => i.severity === 'warning');
      const infoIssue = normalized.issues.find(i => i.severity === 'info');

      expect(errorIssue).toBeDefined();
      expect(warningIssue).toBeDefined();
      expect(infoIssue).toBeDefined();

      expect(errorIssue?.category).toBeDefined();
      expect(warningIssue?.category).toBeDefined();
      expect(infoIssue?.category).toBeDefined();
    });

    it('should add default categories to issues', () => {
      const toolResult: any = {
        toolName: 'test-tool',
        executionTime: 100,
        status: 'success',
        issues: [
          {
            id: 'uncategorized-issue',
            type: 'warning',
            toolName: 'test-tool',
            filePath: 'test.js',
            lineNumber: 1,
            message: 'Some issue',
            fixable: false,
            score: 60
          }
        ],
        metrics: {
          issuesCount: 1,
          errorsCount: 0,
          warningsCount: 1,
          infoCount: 0,
          fixableCount: 0,
          score: 60
        }
      };

      const normalized = resultNormalizer.normalizeResult(toolResult);

      expect(normalized.issues[0].category).toBe('general');
    });

    it('should normalize file paths', () => {
      const toolResult: any = {
        toolName: 'test-tool',
        executionTime: 100,
        status: 'success',
        issues: [
          {
            id: 'path-issue',
            type: 'warning',
            toolName: 'test-tool',
            filePath: './src/../src/test.js', // Complex path
            lineNumber: 1,
            message: 'Path issue',
            fixable: false,
            score: 60
          }
        ],
        metrics: {
          issuesCount: 1,
          errorsCount: 0,
          warningsCount: 1,
          infoCount: 0,
          fixableCount: 0,
          score: 60
        }
      };

      const normalized = resultNormalizer.normalizeResult(toolResult);

      expect(normalized.issues[0].filePath).toBe('src/test.js');
    });
  });

  describe('metrics normalization', () => {
    it('should calculate comprehensive metrics', () => {
      const toolResult: any = {
        toolName: 'metrics-tool',
        executionTime: 2000,
        status: 'success',
        issues: [
          {
            id: 'error-1',
            type: 'error',
            toolName: 'metrics-tool',
            filePath: 'file1.js',
            lineNumber: 1,
            message: 'Error 1',
            fixable: true,
            score: 80
          },
          {
            id: 'error-2',
            type: 'error',
            toolName: 'metrics-tool',
            filePath: 'file2.js',
            lineNumber: 1,
            message: 'Error 2',
            fixable: false,
            score: 90
          },
          {
            id: 'warning-1',
            type: 'warning',
            toolName: 'metrics-tool',
            filePath: 'file1.js',
            lineNumber: 10,
            message: 'Warning 1',
            fixable: true,
            score: 60
          }
        ],
        metrics: {
          issuesCount: 3,
          errorsCount: 2,
          warningsCount: 1,
          infoCount: 0,
          fixableCount: 2,
          score: 65
        }
      };

      const normalized = resultNormalizer.normalizeResult(toolResult);

      expect(normalized.metrics.issuesCount).toBe(3);
      expect(normalized.metrics.errorsCount).toBe(2);
      expect(normalized.metrics.warningsCount).toBe(1);
      expect(normalized.metrics.fixableCount).toBe(2);
      expect(normalized.metrics.executionTime).toBe(2000);

      // Should have performance metrics
      expect(normalized.metrics.performance).toBeDefined();
      expect(normalized.metrics.performance.filesProcessed).toBe(2); // file1.js, file2.js
    });

    it('should handle missing performance data', () => {
      const toolResult: any = {
        toolName: 'no-perf-tool',
        executionTime: 500,
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

      const normalized = resultNormalizer.normalizeResult(toolResult);

      expect(normalized.metrics.performance).toBeDefined();
      expect(normalized.metrics.performance.filesProcessed).toBe(0);
      expect(normalized.metrics.performance.linesOfCode).toBe(0);
    });
  });

  describe('custom normalization rules', () => {
    it('should apply custom normalization rules', () => {
      const customRule: NormalizationRule = {
        toolName: 'custom-tool',
        severityMapping: {
          'bug': 'error',
          'style': 'warning',
          'info': 'info'
        },
        categoryMapping: {
          'complexity': 'complexity',
          'maintainability': 'maintainability'
        },
        scoreMapping: {
          'bug': 90,
          'style': 50,
          'info': 20
        },
        pathNormalization: (path: string) => path,
        messageNormalization: (message: string) => message
      };

      resultNormalizer.addRule(customRule);

      const toolResult: any = {
        toolName: 'custom-tool',
        executionTime: 100,
        status: 'success',
        issues: [
          {
            id: 'custom-1',
            type: 'bug' as unknown, // Custom type
            toolName: 'custom-tool',
            filePath: 'test.js',
            lineNumber: 1,
            message: 'Bug issue',
            fixable: true,
            score: 80
          },
          {
            id: 'custom-2',
            type: 'style' as unknown, // Custom type
            toolName: 'custom-tool',
            filePath: 'test.js',
            lineNumber: 2,
            message: 'Style issue',
            fixable: false,
            score: 40
          }
        ],
        metrics: {
          issuesCount: 2,
          errorsCount: 0,
          warningsCount: 0,
          infoCount: 0,
          fixableCount: 1,
          score: 60
        }
      };

      const normalized = resultNormalizer.normalizeResult(toolResult);

      expect(normalized.issues[0].severity).toBe('error');
      expect(normalized.issues[1].severity).toBe('warning');
      expect(normalized.issues[0].score).toBe(90);
      expect(normalized.issues[1].score).toBe(50);
    });

    it('should remove custom normalization rules', () => {
      const customRule: NormalizationRule = {
        toolName: 'removable-tool',
        severityMapping: {
          'custom': 'error'
        },
        categoryMapping: {},
        scoreMapping: {},
        pathNormalization: (path: string) => path,
        messageNormalization: (message: string) => message
      };

      resultNormalizer.addRule(customRule);
      expect(resultNormalizer.hasNormalizationRule('removable-tool')).toBe(true);

      resultNormalizer.removeNormalizationRule('removable-tool');
      expect(resultNormalizer.hasNormalizationRule('removable-tool')).toBe(false);
    });
  });

  describe('built-in tool normalization', () => {
    it('should normalize ESLint results', () => {
      const eslintResult: any = {
        toolName: 'eslint',
        executionTime: 1000,
        status: 'success',
        issues: [
          {
            id: 'eslint-1',
            type: 'error',
            toolName: 'eslint',
            filePath: 'src/test.js',
            lineNumber: 5,
            message: 'no-unused-vars',
            fixable: true,
            score: 70,
            ruleId: 'no-unused-vars'
          }
        ],
        metrics: {
          issuesCount: 1,
          errorsCount: 1,
          warningsCount: 0,
          infoCount: 0,
          fixableCount: 1,
          score: 70
        }
      };

      const normalized = resultNormalizer.normalizeResult(eslintResult);

      expect(normalized.issues[0].severity).toBe('error');
      expect(normalized.issues[0].category).toBe('linting');
      expect(normalized.issues[0].ruleId).toBe('no-unused-vars');
    });

    it('should normalize TypeScript results', () => {
      const tsResult: any = {
        toolName: 'typescript',
        executionTime: 1500,
        status: 'success',
        issues: [
          {
            id: 'ts-1',
            type: 'error',
            toolName: 'typescript',
            filePath: 'src/test.ts',
            lineNumber: 10,
            message: "Property 'foo' does not exist",
            fixable: false,
            score: 85,
            ruleId: 'TS2339'
          }
        ],
        metrics: {
          issuesCount: 1,
          errorsCount: 1,
          warningsCount: 0,
          infoCount: 0,
          fixableCount: 0,
          score: 85
        }
      };

      const normalized = resultNormalizer.normalizeResult(tsResult);

      expect(normalized.issues[0].severity).toBe('error');
      expect(normalized.issues[0].category).toBe('typescript');
      expect(normalized.issues[0].ruleId).toBe('TS2339');
    });

    it('should normalize Prettier results', () => {
      const prettierResult: any = {
        toolName: 'prettier',
        executionTime: 800,
        status: 'success',
        issues: [
          {
            id: 'prettier-1',
            type: 'warning',
            toolName: 'prettier',
            filePath: 'src/test.js',
            lineNumber: 1,
            message: 'Code style issues',
            fixable: true,
            score: 40
          }
        ],
        metrics: {
          issuesCount: 1,
          errorsCount: 0,
          warningsCount: 1,
          infoCount: 0,
          fixableCount: 1,
          score: 40
        }
      };

      const normalized = resultNormalizer.normalizeResult(prettierResult);

      expect(normalized.issues[0].severity).toBe('warning');
      expect(normalized.issues[0].category).toBe('formatting');
    });
  });

  describe('batch normalization', () => {
    it('should normalize multiple results', () => {
      const results: any[] = [
        {
          toolName: 'tool1',
          executionTime: 500,
          status: 'success',
          issues: [
            {
              id: 'tool1-1',
              type: 'error',
              toolName: 'tool1',
              filePath: 'test.js',
              lineNumber: 1,
              message: 'Tool 1 error',
              fixable: false,
              score: 80
            }
          ],
          metrics: {
            issuesCount: 1,
            errorsCount: 1,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 0,
            score: 80
          }
        },
        {
          toolName: 'tool2',
          executionTime: 300,
          status: 'success',
          issues: [
            {
              id: 'tool2-1',
              type: 'warning',
              toolName: 'tool2',
              filePath: 'test.js',
              lineNumber: 2,
              message: 'Tool 2 warning',
              fixable: true,
              score: 60
            }
          ],
          metrics: {
            issuesCount: 1,
            errorsCount: 0,
            warningsCount: 1,
            infoCount: 0,
            fixableCount: 1,
            score: 60
          }
        }
      ];

      const normalized = resultNormalizer.normalizeResults(results);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].toolName).toBe('tool1');
      expect(normalized[1].toolName).toBe('tool2');
      expect(normalized[0].issues[0].severity).toBe('error');
      expect(normalized[1].issues[0].severity).toBe('warning');
    });
  });

  describe('validation and error handling', () => {
    it('should handle invalid tool results gracefully', () => {
      const invalidResult = {
        toolName: '', // Invalid empty name
        executionTime: -100, // Invalid negative time
        status: 'invalid-status' as unknown, // Invalid status
        issues: null as unknown, // Invalid null issues
        metrics: {} as unknown // Invalid empty metrics
      };

      const normalized = resultNormalizer.normalizeResult(invalidResult as any);

      // Should still produce a valid normalized result
      expect(normalized.toolName).toBe('');
      expect(normalized.executionTime).toBe(0);
      expect(normalized.status).toBe('error');
      expect(normalized.issues).toEqual([]);
    });

    it('should validate required fields in normalized results', () => {
      const normalized = resultNormalizer.createEmptyNormalizedResult('test-tool');

      expect(normalized.toolName).toBe('test-tool');
      expect(normalized.toolVersion).toBeDefined();
      expect(normalized.status).toBe('success');
      expect(Array.isArray(normalized.issues)).toBe(true);
      expect(normalized.metrics).toBeDefined();
      expect(normalized.summary).toBeDefined();
      expect(normalized.metadata).toBeDefined();
    });
  });

  describe('utility methods', () => {
    it('should create empty normalized results', () => {
      const empty = resultNormalizer.createEmptyNormalizedResult('empty-tool');

      expect(empty.toolName).toBe('empty-tool');
      expect(empty.issues).toHaveLength(0);
      expect(empty.metrics.issuesCount).toBe(0);
      expect(empty.metrics.score).toBe(100);
    });

    it('should merge normalized results', () => {
      const result1: any = {
        toolName: 'tool1',
        toolVersion: '1.0.0',
        status: 'success',
        executionTime: 500,
        startTime: new Date(),
        endTime: new Date(),
        issues: [
          {
            id: 'issue-1',
            toolName: 'tool1',
            severity: 'error',
            category: 'test',
            filePath: 'test.js',
            lineNumber: 1,
            message: 'Issue 1',
            originalMessage: 'Issue 1',
            ruleId: 'rule1',
            fixable: false,
            score: 80,
            tags: ['test'],
            metadata: {}
          }
        ],
        metrics: {
          toolName: 'tool1',
          executionTime: 500,
          issuesCount: 1,
          errorsCount: 1,
          warningsCount: 0,
          infoCount: 0,
          fixableCount: 0,
          score: 80,
          customMetrics: {},
          performance: {
            filesProcessed: 1,
            linesOfCode: 10
          }
        },
        summary: {
          totalIssues: 1,
          criticalIssues: 1,
          majorIssues: 0,
          minorIssues: 0,
          fixableIssues: 0,
          coveragePercentage: undefined
        },
        configuration: {},
        metadata: {}
      };

      const result2: any = {
        toolName: 'tool2',
        toolVersion: '1.0.0',
        status: 'success',
        executionTime: 300,
        startTime: new Date(),
        endTime: new Date(),
        issues: [
          {
            id: 'issue-2',
            toolName: 'tool2',
            severity: 'warning',
            category: 'test',
            filePath: 'test.js',
            lineNumber: 2,
            message: 'Issue 2',
            originalMessage: 'Issue 2',
            ruleId: 'rule2',
            fixable: true,
            score: 60,
            tags: ['test'],
            metadata: {}
          }
        ],
        metrics: {
          toolName: 'tool2',
          executionTime: 300,
          issuesCount: 1,
          errorsCount: 0,
          warningsCount: 1,
          infoCount: 0,
          fixableCount: 1,
          score: 60,
          customMetrics: {},
          performance: {
            filesProcessed: 1,
            linesOfCode: 5
          }
        },
        summary: {
          totalIssues: 1,
          criticalIssues: 0,
          majorIssues: 0,
          minorIssues: 1,
          fixableIssues: 1,
          coveragePercentage: undefined
        },
        configuration: {},
        metadata: {}
      };

      const merged = resultNormalizer.mergeNormalizedResults([result1, result2]);

      expect(merged.issues).toHaveLength(2);
      expect(merged.metrics.issuesCount).toBe(2);
      expect(merged.metrics.executionTime).toBe(800);
    });
  });
});