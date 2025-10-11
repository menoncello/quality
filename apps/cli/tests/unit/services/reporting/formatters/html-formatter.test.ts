/**
 * Unit Tests for HTML Formatter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HTMLFormatter } from '../../../../../src/services/reporting/formatters/html-formatter';

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
  format: 'html',
  templateType: 'builtin' as const,
  content: 'test content',
  styles: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    theme: 'light' as const,
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
  },
};

const mockConfiguration = {
  id: 'test-config',
  name: 'Test Configuration',
  templateId: 'test-template',
  format: 'html' as const,
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

describe('HTMLFormatter', () => {
  let formatter: HTMLFormatter;

  beforeEach(() => {
    formatter = new HTMLFormatter();
  });

  describe('format', () => {
    it('should generate valid HTML report', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toStartWith('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('</html>');
    });

    it('should include proper head section', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('<head>');
      expect(result).toContain('<meta charset="UTF-8">');
      expect(result).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
      expect(result).toContain(`<title>${mockReportData.metadata.title}</title>`);
      expect(result).toContain('</head>');
    });

    it('should include CSS styles', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('<style>');
      expect(result).toContain('</style>');
      expect(result).toContain(':root');
      expect(result).toContain('--primary-color: #2563eb');
      expect(result).toContain('--secondary-color: #64748b');
    });

    it('should include Chart.js script', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('<script src="https://cdn.jsdelivr.net/npm/chart.js">');
    });

    it('should include report header', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('<header class="header">');
      expect(result).toContain(`<h1>${mockReportData.metadata.title}</h1>`);
      expect(result).toContain(mockReportData.metadata.description);
      expect(result).toContain(mockAnalysisResult.projectId);
      expect(result).toContain('75/100'); // overall score
      expect(result).toContain('</header>');
    });

    it('should include executive summary section', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('Executive Summary');
      expect(result).toContain(mockExecutiveSummary.overview);
      expect(result).toContain('Key Metrics');
      expect(result).toContain('Priorities');
      expect(result).toContain('Recommendations');
    });

    it('should include metrics section', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('Analysis Metrics');
      expect(result).toContain('Overall Score');
      expect(result).toContain('Total Issues');
      expect(result).toContain('Errors');
      expect(result).toContain('Warnings');
      expect(result).toContain('Fixable Issues');
    });

    it('should include issues section', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('Issues (2)');
      expect(result).toContain('issues-table');
      expect(result).toContain('Unexpected console statement');
      expect(result).toContain('Unused variable');
      expect(result).toContain('severity-error');
      expect(result).toContain('severity-warning');
    });

    it('should include coverage information when available', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('Code Coverage');
      expect(result).toContain('80%'); // lines percentage
      expect(result).toContain('90%'); // functions percentage
    });

    it('should include tool results table', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('Tool Results');
      expect(result).toContain('eslint');
      expect(result).toContain('success');
      expect(result).toContain('<td>80</td>');
    });

    it('should include inline JavaScript', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('<script>');
      expect(result).toContain('Chart(');
      expect(result).toContain('issueCtx');
      expect(result).toContain('toolCtx');
      expect(result).toContain('</script>');
    });

    it('should escape HTML to prevent XSS', async () => {
      const maliciousData = {
        ...mockReportData,
        metadata: {
          ...mockReportData.metadata,
          title: '<script>alert("xss")</script>',
          description: '<img src="x" onerror="alert(\'xss\')">',
        },
        analysisResult: {
          ...mockReportData.analysisResult,
          projectId: '<script>malicious()</script>',
        },
        issues: [
          {
            ...mockIssues[0],
            message: '<script>alert("xss")</script>',
            filePath: '<img src="x" onerror="alert(\'xss\')">',
          },
        ],
      };

      const result = await formatter.format(maliciousData, mockTemplate);

      expect(result).not.toContain('<script>alert("xss")</script>');
      expect(result).not.toContain('<img src="x" onerror="alert(\'xss\')">');
      expect(result).not.toContain('<script>malicious()</script>');
    });

    it('should handle dark theme', async () => {
      const darkTemplate = {
        ...mockTemplate,
        styles: {
          ...mockTemplate.styles,
          theme: 'dark' as const,
        },
      };

      const result = await formatter.format(mockReportData, darkTemplate);

      expect(result).toContain('--background: #1f2937');
      expect(result).toContain('--surface: #374151');
      expect(result).toContain('--text: #f9fafb');
    });

    it('should handle missing executive summary', async () => {
      const dataWithoutSummary = {
        ...mockReportData,
        executiveSummary: undefined,
      };

      const result = await formatter.format(dataWithoutSummary, mockTemplate);

      expect(result).not.toContain('Executive Summary');
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

      expect(result).not.toContain('Code Coverage');
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

      expect(result).toContain('Issues (0)');
      // HTML formatter just shows empty table when no issues
      expect(result).toContain('issues-table');
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

      expect(result).toContain('Custom Section');
    });

    it('should include footer with metadata', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('<footer class="footer">');
      expect(result).toContain('Generated by DevQuality CLI');
      expect(result).toContain(mockReportData.metadata.reportId);
      expect(result).toContain('</footer>');
    });

    it('should support responsive design', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('@media (max-width: 768px)');
      expect(result).toContain('grid-template-columns: 1fr');
    });

    it('should include severity badges with correct styling', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('severity-error');
      expect(result).toContain('severity-warning');
      expect(result).toContain('severity-info');
    });

    it('should include fixable badges', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('fixable-badge');
      expect(result).toContain('Yes');
    });

    it('should include metric cards with styling', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('metric-card');
      expect(result).toContain('metric-value');
      expect(result).toContain('metric-label');
    });

    it('should format dates correctly', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain(new Date(mockReportData.metadata.generatedAt).toLocaleDateString());
      expect(result).toContain(new Date(mockAnalysisResult.timestamp).toLocaleDateString());
    });

    it('should handle trend analysis when available', async () => {
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

      // Add trends section to template
      const templateWithTrends = {
        ...mockTemplate,
        sections: [
          ...mockTemplate.sections,
          { id: 'trends', name: 'Trends', type: 'trends', enabled: true, order: 4 },
        ],
      };

      const dataWithTrends = {
        ...mockReportData,
        trendAnalysis: mockTrendAnalysis,
        historicalData: mockHistoricalData,
      };

      const result = await formatter.format(dataWithTrends, templateWithTrends);

      expect(result).toContain('Trend Analysis');
      expect(result).toContain('15.5');
      expect(result).toContain('improving');
      expect(result).toContain('trendChart');
    });

    it('should handle errors gracefully', async () => {
      // Create data that might cause issues
      const problematicData = {
        ...mockReportData,
        metadata: undefined,
      };

      // Should not throw but should handle gracefully
      const result = await formatter.format(problematicData, mockTemplate);
      expect(result).toBeDefined();
    });

    it('should include accessibility features', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('lang="en"');
      expect(result).toContain('<table class="issues-table">');
      // Tables should have proper structure for screen readers
      expect(result).toContain('<thead>');
      expect(result).toContain('<tbody>');
    });
  });
});