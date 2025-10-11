/**
 * Unit Tests for JSON Formatter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSONFormatter } from '../../../../../src/services/reporting/formatters/json-formatter';

// Mock data for testing
const mockAnalysisResult = {
  id: 'test-analysis-1',
  projectId: 'test-project',
  timestamp: '2023-10-09T10:00:00.000Z',
  duration: 5000,
  overallScore: 75,
  toolResults: [
    {
      toolName: 'eslint',
      status: 'success',
      executionTime: 2000,
      metrics: { score: 80, issuesCount: 5 },
      issues: [
        {
          id: 'issue-1',
          type: 'error',
          toolName: 'eslint',
          filePath: 'src/test.js',
          lineNumber: 10,
          message: 'Unexpected console statement',
          ruleId: 'no-console',
          fixable: true,
          score: 8,
        },
      ],
    },
  ],
  summary: {
    totalIssues: 5,
    totalErrors: 1,
    totalWarnings: 3,
    totalFixable: 2,
    overallScore: 75,
    toolCount: 1,
    executionTime: 5000,
  },
  aiPrompts: [],
};

const mockIssues = [
  {
    id: 'issue-1',
    type: 'error',
    toolName: 'eslint',
    filePath: 'src/test.js',
    lineNumber: 10,
    message: 'Unexpected console statement',
    ruleId: 'no-console',
    fixable: true,
    score: 8,
    suggestion: 'Remove console statement',
  },
  {
    id: 'issue-2',
    type: 'warning',
    toolName: 'eslint',
    filePath: 'src/test.js',
    lineNumber: 15,
    message: 'Unused variable',
    ruleId: 'no-unused-vars',
    fixable: true,
    score: 5,
  },
];

const mockMetrics = {
  totalIssues: 2,
  errorCount: 1,
  warningCount: 1,
  infoCount: 0,
  fixableCount: 2,
  coverage: {
    lines: { total: 100, covered: 80, percentage: 80 },
    functions: { total: 20, covered: 18, percentage: 90 },
    branches: { total: 50, covered: 35, percentage: 70 },
    statements: { total: 120, covered: 96, percentage: 80 },
  },
};

const mockExecutiveSummary = {
  overview: 'The codebase has achieved an overall quality score of 75/100 with 2 total issues identified.',
  keyMetrics: [
    {
      label: 'Overall Score',
      value: '75/100',
      trend: 'stable',
      significance: 'medium',
    },
    {
      label: 'Total Issues',
      value: 2,
      trend: 'down',
      significance: 'low',
    },
  ],
  priorities: [
    {
      title: 'Fix Auto-correctable Errors',
      description: 'Resolve 1 error that can be automatically fixed',
      impact: 'high',
      effort: 'low',
    },
  ],
  recommendations: [
    'Enable auto-fix for resolveable issues',
    'Increase test coverage to at least 80%',
  ],
  nextSteps: [
    'Address high-priority security vulnerabilities',
    'Fix critical build-breaking errors',
  ],
};

const mockTemplate = {
  id: 'test-template',
  name: 'Test Template',
  sections: [
    { id: 'summary', name: 'Summary', type: 'summary', enabled: true, order: 1 },
    { id: 'metrics', name: 'Metrics', type: 'metrics', enabled: true, order: 2 },
    { id: 'issues', name: 'Issues', type: 'issues', enabled: true, order: 3 },
  ],
  format: 'json',
  templateType: 'builtin' as const,
  content: 'test content',
};

const mockConfiguration = {
  id: 'test-config',
  name: 'Test Configuration',
  templateId: 'test-template',
  format: 'json' as const,
  filters: {},
  recipients: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
};

const mockReportData = {
  metadata: {
    title: 'Test Report',
    description: 'Test Description',
    version: '1.0.0',
    generatedAt: '2023-10-09T10:00:00.000Z',
    reportId: 'test-report-1',
  },
  analysisResult: mockAnalysisResult,
  issues: mockIssues,
  metrics: mockMetrics,
  executiveSummary: mockExecutiveSummary,
  trendAnalysis: undefined,
  historicalData: undefined,
  template: mockTemplate,
  configuration: mockConfiguration,
};

describe('JSONFormatter', () => {
  let formatter: JSONFormatter;

  beforeEach(() => {
    formatter = new JSONFormatter();
  });

  describe('format', () => {
    it('should generate valid JSON report', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');

      // Verify it's valid JSON
      const parsed = JSON.parse(result);
      expect(parsed).toBeDefined();
      expect(parsed.metadata).toBeDefined();
    });

    it('should include all required metadata', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);
      const parsed = JSON.parse(result);

      expect(parsed.metadata.title).toBe('Test Report');
      expect(parsed.metadata.description).toBe('Test Description');
      expect(parsed.metadata.version).toBe('1.0.0');
      expect(parsed.metadata.reportId).toBe('test-report-1');
      expect(parsed.metadata.format).toBe('json');
    });

    it('should include executive summary when enabled', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);
      const parsed = JSON.parse(result);

      expect(parsed.executiveSummary).toBeDefined();
      expect(parsed.executiveSummary.overview).toBe(mockExecutiveSummary.overview);
      expect(parsed.executiveSummary.keyMetrics).toHaveLength(2);
      expect(parsed.executiveSummary.priorities).toHaveLength(1);
    });

    it('should include issues when enabled', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);
      const parsed = JSON.parse(result);

      expect(parsed.issues).toBeDefined();
      expect(parsed.issues).toHaveLength(2);
      expect(parsed.issues[0].id).toBe('issue-1');
      expect(parsed.issues[0].type).toBe('error');
      expect(parsed.issues[0].location.file).toBe('src/test.js');
      expect(parsed.issues[0].location.line).toBe(10);
    });

    it('should include tool results when enabled', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);
      const parsed = JSON.parse(result);

      expect(parsed.toolResults).toBeDefined();
      expect(parsed.toolResults).toHaveLength(1);
      expect(parsed.toolResults[0].toolName).toBe('eslint');
      expect(parsed.toolResults[0].status).toBe('success');
    });

    it('should include summary metrics', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);
      const parsed = JSON.parse(result);

      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.project.id).toBe('test-project');
      expect(parsed.summary.project.overallScore).toBe(75);
      expect(parsed.summary.issues.total).toBe(2);
      expect(parsed.summary.issues.errors).toBe(1);
      expect(parsed.summary.issues.warnings).toBe(1);
    });

    it('should include coverage information when available', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);
      const parsed = JSON.parse(result);

      expect(parsed.summary.metrics.coverage).toBeDefined();
      expect(parsed.summary.metrics.coverage.lines.percentage).toBe(80);
      expect(parsed.summary.metrics.coverage.functions.percentage).toBe(90);
    });

    it('should handle missing executive summary gracefully', async () => {
      const dataWithoutSummary = {
        ...mockReportData,
        executiveSummary: undefined,
      };

      const result = await formatter.format(dataWithoutSummary, mockTemplate);
      const parsed = JSON.parse(result);

      expect(parsed.executiveSummary).toBeUndefined();
    });

    it('should handle missing coverage information gracefully', async () => {
      const dataWithoutCoverage = {
        ...mockReportData,
        metrics: {
          ...mockMetrics,
          coverage: undefined,
        },
      };

      const result = await formatter.format(dataWithoutCoverage, mockTemplate);
      const parsed = JSON.parse(result);

      expect(parsed.summary.metrics.coverage).toBeUndefined();
    });

    it('should include AI prompts when available', async () => {
      const dataWithPrompts = {
        ...mockReportData,
        analysisResult: {
          ...mockAnalysisResult,
          aiPrompts: [
            {
              id: 'prompt-1',
              type: 'security',
              title: 'Security Issues',
              description: 'Review security vulnerabilities',
              priority: 'high' as const,
              issues: [mockIssues[0]],
            },
          ],
        },
      };

      const result = await formatter.format(dataWithPrompts, mockTemplate);
      const parsed = JSON.parse(result);

      expect(parsed.aiPrompts).toBeDefined();
      expect(parsed.aiPrompts).toHaveLength(1);
      expect(parsed.aiPrompts[0].id).toBe('prompt-1');
      expect(parsed.aiPrompts[0].priority).toBe('high');
    });

    it('should format issues correctly', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);
      const parsed = JSON.parse(result);

      const issue = parsed.issues[0];
      expect(issue.id).toBe('issue-1');
      expect(issue.type).toBe('error');
      expect(issue.severity).toBe('error');
      expect(issue.location.file).toBe('src/test.js');
      expect(issue.location.line).toBe(10);
      expect(issue.message).toBe('Unexpected console statement');
      expect(issue.rule.id).toBe('no-console');
      expect(issue.score).toBe(8);
      expect(issue.fixable).toBe(true);
      expect(issue.suggestion).toBe('Remove console statement');
    });

    it('should include schema reference', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);
      const parsed = JSON.parse(result);

      expect(parsed.$schema).toBe('https://dev-quality-cli.com/schemas/report/v1.json');
    });

    it('should handle empty issues array', async () => {
      const dataWithNoIssues = {
        ...mockReportData,
        issues: [],
        metrics: {
          ...mockMetrics,
          totalIssues: 0,
          errorCount: 0,
          warningCount: 0,
          fixableCount: 0,
        },
      };

      const result = await formatter.format(dataWithNoIssues, mockTemplate);
      const parsed = JSON.parse(result);

      expect(parsed.issues).toEqual([]);
      expect(parsed.summary.issues.total).toBe(0);
    });

    it('should include custom sections when enabled', async () => {
      const templateWithCustom = {
        ...mockTemplate,
        sections: [
          ...mockTemplate.sections,
          {
            id: 'custom',
            name: 'Custom Section',
            type: 'custom' as const,
            enabled: true,
            order: 4,
            config: { customData: 'test' },
          },
        ],
      };

      const result = await formatter.format(mockReportData, templateWithCustom);
      const parsed = JSON.parse(result);

      expect(parsed.customSections).toBeDefined();
      expect(parsed.customSections).toHaveLength(1);
      expect(parsed.customSections[0].id).toBe('custom');
      expect(parsed.customSections[0].config.customData).toBe('test');
    });

    it('should handle formatting errors gracefully', async () => {
      // Create data that might cause JSON.stringify to fail
      const problematicData = {
        ...mockReportData,
        metadata: {
          ...mockReportData.metadata,
          title: undefined, // This might cause issues in JSON.stringify
        },
      };

      // Should not throw but should handle gracefully
      await expect(formatter.format(problematicData, mockTemplate)).resolves.toBeDefined();
    });

    it('should preserve all tool result data', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);
      const parsed = JSON.parse(result);

      const toolResult = parsed.toolResults[0];
      expect(toolResult.toolName).toBe('eslint');
      expect(toolResult.status).toBe('success');
      expect(toolResult.executionTime).toBe(2000);
      expect(toolResult.metrics).toBeDefined();
      expect(toolResult.issues).toBeDefined();
    });

    it('should generate properly formatted JSON with indentation', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      // Check that the JSON is properly formatted (contains newlines and proper indentation)
      expect(result).toContain('\n');
      expect(result).toContain('"metadata":');
      expect(result).toContain('"title":');
    });
  });
});