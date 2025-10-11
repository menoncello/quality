/**
 * Unit Tests for Markdown Formatter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownFormatter } from '../../../../../src/services/reporting/formatters/markdown-formatter';

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
  {
    id: 'issue-3',
    type: 'info',
    toolName: 'eslint',
    filePath: 'src/components/Button.jsx',
    lineNumber: 25,
    message: 'Missing JSDoc comment',
    ruleId: 'jsdoc/require-jsdoc',
    fixable: false,
    score: 3,
  },
];

const mockMetrics = {
  totalIssues: 3,
  errorCount: 1,
  warningCount: 1,
  infoCount: 1,
  fixableCount: 2,
  coverage: {
    lines: { total: 100, covered: 80, percentage: 80 },
    functions: { total: 20, covered: 18, percentage: 90 },
    branches: { total: 50, covered: 35, percentage: 70 },
    statements: { total: 120, covered: 96, percentage: 80 },
  },
};

const mockExecutiveSummary = {
  overview: 'The codebase has achieved an overall quality score of 75/100 with 3 total issues identified.',
  keyMetrics: [
    {
      label: 'Overall Score',
      value: '75/100',
      trend: 'stable',
      significance: 'medium',
    },
    {
      label: 'Total Issues',
      value: 3,
      trend: 'down',
      significance: 'low',
    },
  ],
  priorities: [
    {
      title: 'Fix Auto-correctable Errors',
      description: 'Resolve 2 errors that can be automatically fixed',
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
    { id: 'trends', name: 'Trends', type: 'trends', enabled: true, order: 4 },
    { id: 'charts', name: 'Charts', type: 'charts', enabled: true, order: 5 },
  ],
  format: 'markdown',
  templateType: 'builtin' as const,
  content: 'test content',
};

const mockConfiguration = {
  id: 'test-config',
  name: 'Test Configuration',
  templateId: 'test-template',
  format: 'markdown' as const,
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

describe('MarkdownFormatter', () => {
  let formatter: MarkdownFormatter;

  beforeEach(() => {
    formatter = new MarkdownFormatter();
  });

  describe('format', () => {
    it('should generate valid Markdown report', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toStartWith('# Test Report');
    });

    it('should include proper header section', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('# Test Report');
      expect(result).toContain('## Project Information');
      expect(result).toContain('| Property | Value |');
      expect(result).toContain('|----------|-------|');
      expect(result).toContain('`test-project`');
      expect(result).toContain('**75/100**');
    });

    it('should include executive summary when enabled', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('## Executive Summary');
      expect(result).toContain(mockExecutiveSummary.overview);
      expect(result).toContain('### Key Metrics');
      expect(result).toContain('### Priorities');
      expect(result).toContain('### Recommendations');
      expect(result).toContain('### Next Steps');
    });

    it('should include metrics section', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('## Analysis Metrics');
      expect(result).toContain('### Overview');
      expect(result).toContain('| Metric | Value |');
      expect(result).toContain('**Overall Score**');
      expect(result).toContain('**Total Issues**');
      expect(result).toContain('### Tool Results');
      expect(result).toContain('| Tool | Status | Issues | Score | Time (ms) |');
    });

    it('should include issues section grouped by file', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('## Issues (3)');
      expect(result).toContain('### Summary');
      expect(result).toContain('### Issue Details');
      expect(result).toContain('#### 📁 `src/test\\.js` (2 issues)');
      expect(result).toContain('#### 📁 `src/components/Button\\.jsx` (1 issues)');
    });

    it('should include severity indicators', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('❌ ERROR');
      expect(result).toContain('⚠️ WARNING');
      expect(result).toContain('ℹ️ INFO');
      expect(result).toContain('🔧'); // fixable indicator
    });

    it('should include coverage information when available', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('### Code Coverage');
      expect(result).toContain('| Coverage Type | Percentage | Covered / Total |');
      expect(result).toContain('| **Lines** | 80% | 80 / 100 |');
      expect(result).toContain('| **Functions** | 90% | 18 / 20 |');
    });

    it('should escape markdown special characters', async () => {
      const maliciousData = {
        ...mockReportData,
        metadata: {
          ...mockReportData.metadata,
          title: 'Title with *bold* and _italic_ text',
        },
        analysisResult: {
          ...mockReportData.analysisResult,
          projectId: 'Project|with|pipes',
        },
        issues: [
          {
            ...mockIssues[0],
            message: 'Message with `backticks` and *asterisks*',
            filePath: 'File with [brackets] and {braces}',
          },
        ],
      };

      const result = await formatter.format(maliciousData, mockTemplate);

      expect(result).toContain('\\*bold\\*');
      expect(result).toContain('\\_italic\\_');
      expect(result).toContain('`Project|with|pipes`');
      expect(result).toContain('\\`backticks\\`');
      expect(result).toContain('\\*asterisks\\*');
      expect(result).toContain('\\[brackets\\]');
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
          infoCount: 0,
          fixableCount: 0,
        },
      };

      const result = await formatter.format(dataWithNoIssues, mockTemplate);

      expect(result).toContain('## Issues');
      expect(result).toContain('🎉 No issues found! Great job maintaining code quality.');
    });

    it('should handle missing executive summary', async () => {
      const dataWithoutSummary = {
        ...mockReportData,
        executiveSummary: undefined,
      };

      const result = await formatter.format(dataWithoutSummary, mockTemplate);

      expect(result).not.toContain('## Executive Summary');
    });

    it('should handle missing coverage information', async () => {
      const dataWithoutCoverage = {
        ...mockReportData,
        metrics: {
          ...mockMetrics,
          coverage: undefined,
        },
      };

      const result = await formatter.format(dataWithoutCoverage, mockTemplate);

      expect(result).not.toContain('### Code Coverage');
    });

    it('should include trend analysis when available', async () => {
      const mockTrendAnalysis = {
        period: 'last-4-periods',
        direction: 'improving' as const,
        changePercentage: 15.5,
        confidence: 85,
        insights: ['Quality score improved by 15.5%'],
      };

      const mockHistoricalData = [
        {
          timestamp: new Date('2023-10-08'),
          overallScore: 65,
          totalIssues: 10,
          errorCount: 5,
          warningCount: 3,
          infoCount: 2,
          fixableCount: 6,
          toolResults: [],
        },
        {
          timestamp: new Date('2023-10-09'),
          overallScore: 75,
          totalIssues: 5,
          errorCount: 2,
          warningCount: 2,
          infoCount: 1,
          fixableCount: 3,
          toolResults: [],
        },
      ];

      const dataWithTrends = {
        ...mockReportData,
        trendAnalysis: mockTrendAnalysis,
        historicalData: mockHistoricalData,
      };

      const result = await formatter.format(dataWithTrends, mockTemplate);

      expect(result).toContain('## Trend Analysis');
      expect(result).toContain('### Summary');
      expect(result).toContain('### Insights');
      expect(result).toContain('### Historical Data');
      expect(result).toContain('15.5');
      expect(result).toContain('improving');
      expect(result).toContain('### Score Trend');
    });

    it('should include ASCII charts in visual analytics', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('## Visual Analytics');
      expect(result).toContain('### Issue Distribution');
      expect(result).toContain('### Tool Performance');
      expect(result).toContain('```');
      expect(result).toContain('█'); // ASCII bar character
    });

    it('should generate ASCII bar charts correctly', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('Errors         ');
      expect(result).toContain('Warnings       ');
      expect(result).toContain('Info           ');
      expect(result).toContain('█'); // Bar characters
    });

    it('should generate ASCII trend chart when historical data available', async () => {
      const mockTrendAnalysis = {
        period: 'last-4-periods',
        direction: 'improving' as const,
        changePercentage: 15.5,
        confidence: 85,
        insights: ['Quality score improved by 15.5%'],
      };

      const mockHistoricalData = [
        {
          timestamp: new Date('2023-10-07'),
          overallScore: 60,
          totalIssues: 8,
          errorCount: 4,
          warningCount: 2,
          infoCount: 2,
          fixableCount: 5,
          toolResults: [],
        },
        {
          timestamp: new Date('2023-10-08'),
          overallScore: 65,
          totalIssues: 6,
          errorCount: 3,
          warningCount: 2,
          infoCount: 1,
          fixableCount: 4,
          toolResults: [],
        },
        {
          timestamp: new Date('2023-10-09'),
          overallScore: 75,
          totalIssues: 5,
          errorCount: 2,
          warningCount: 2,
          infoCount: 1,
          fixableCount: 3,
          toolResults: [],
        },
      ];

      const dataWithHistorical = {
        ...mockReportData,
        trendAnalysis: mockTrendAnalysis,
        historicalData: mockHistoricalData,
      };

      const result = await formatter.format(dataWithHistorical, mockTemplate);

      expect(result).toContain('### Score Trend');
      expect(result).toContain('```');
      expect(result).toContain('│'); // Chart axis
      expect(result).toContain('●'); // Data points
      expect(result).toContain('─'); // Horizontal lines
    });

    it('should include priority indicators', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('🔴 high');
      // expect(result).toContain('🟡 medium');
      expect(result).toContain('🟢 low');
    });

    it('should include trend indicators in key metrics', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('📉'); // down trend (for Total Issues)
      expect(result).toContain('➡️'); // stable trend (for Overall Score)
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
          },
        ],
      };

      const result = await formatter.format(mockReportData, templateWithCustom);

      expect(result).toContain('## Custom Section');
    });

    it('should include proper footer', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('---');
      expect(result).toContain('*Report generated by DevQuality CLI on 10/9/2023, 10:00:00 AM*');
      expect(result).toContain('**Report ID**: `test-report-1`');
    });

    it('should format dates correctly', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain(new Date(mockReportData.metadata.generatedAt).toLocaleDateString());
      expect(result).toContain(new Date(mockAnalysisResult.timestamp).toLocaleDateString());
    });

    it('should handle issues with different severities correctly', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('❌ ERROR 🔧');
      expect(result).toContain('⚠️ WARNING 🔧');
      expect(result).toContain('ℹ️ INFO');
    });

    it('should include tool status indicators', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('✅'); // success status
    });

    it('should include issue details properly formatted', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('**Message**: Unexpected console statement');
      expect(result).toContain('**Location**: Line 10');
      expect(result).toContain('**Tool**: eslint');
      expect(result).toContain('**Score**: 8');
      expect(result).toContain('**Rule**: `no\\-console`');
      expect(result).toContain('**Suggestion**: Remove console statement');
    });

    it('should handle issues without suggestions', async () => {
      const issueWithoutSuggestion = {
        ...mockIssues[2],
        suggestion: undefined,
      };

      const dataWithIssueWithoutSuggestion = {
        ...mockReportData,
        issues: [issueWithoutSuggestion],
      };

      const result = await formatter.format(dataWithIssueWithoutSuggestion, mockTemplate);

      expect(result).toContain('ℹ️ INFO');
      expect(result).not.toContain('**Suggestion**:');
    });

    it('should handle errors gracefully', async () => {
      const problematicData = {
        ...mockReportData,
        metadata: undefined,
      };

      const result = await formatter.format(problematicData, mockTemplate);
      expect(result).toBeDefined();
    });

    it('should maintain proper table formatting', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      // Check that tables are properly formatted
      expect(result).toMatch(/\| Property \| Value \|/);
      expect(result).toMatch(/\|----------\|-------\|/);
      expect(result).toMatch(/\| Tool \| Status \| Issues \| Score \| Time \(ms\) \|/);
    });

    it('should include coverage overview in charts when available', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('### Coverage Overview');
      expect(result).toContain('Lines');
      expect(result).toContain('Functions');
      expect(result).toContain('Branches');
      expect(result).toContain('Statements');
    });
  });
});