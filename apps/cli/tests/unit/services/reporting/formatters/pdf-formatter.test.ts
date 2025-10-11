/**
 * Unit Tests for PDF Formatter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PDFFormatter } from '../../../../../src/services/reporting/formatters/pdf-formatter';

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
  format: 'pdf',
  templateType: 'builtin' as const,
  content: 'test content',
};

const mockConfiguration = {
  id: 'test-config',
  name: 'Test Configuration',
  templateId: 'test-template',
  format: 'pdf' as const,
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

describe('PDFFormatter', () => {
  let formatter: PDFFormatter;

  beforeEach(() => {
    formatter = new PDFFormatter();
  });

  describe('format', () => {
    it('should generate HTML optimized for PDF conversion', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toStartWith('<!-- PDF Generation Notice -->');
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
    });

    it('should include PDF generation notice', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('<!-- PDF Generation Notice -->');
      expect(result).toContain('<!-- This HTML would be converted to PDF using Puppeteer or similar -->');
      expect(result).toContain('<!-- In production, implement actual PDF generation -->');
    });

    it('should include proper CSS for PDF printing', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('@page {');
      expect(result).toContain('size: A4;');
      expect(result).toContain('margin: 1cm;');
    });

    it('should include print-specific CSS', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('@media print {');
      expect(result).toContain('.no-print {');
      expect(result).toContain('display: none;');
      expect(result).toContain('-webkit-print-color-adjust: exact;');
    });

    it('should include page break CSS classes', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('.page-break {');
      expect(result).toContain('page-break-before: always;');
      expect(result).toContain('.avoid-page-break {');
      expect(result).toContain('page-break-inside: avoid;');
    });

    it('should include report header', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('<div class="header">');
      expect(result).toContain('<h1>Test Report</h1>');
      expect(result).toContain('Test Description');
      expect(result).toContain('test-project');
      expect(result).toContain('75/100');
      expect(result).toContain('test-report-1');
    });

    it('should include metadata table', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('<table class="meta-table">');
      expect(result).toContain('<td>Project ID</td>');
      expect(result).toContain('<td>test-project</td>');
      expect(result).toContain('<td>Overall Score</td>');
      expect(result).toContain('<td>75/100</td>');
    });

    it('should include executive summary section', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('Executive Summary');
      expect(result).toContain('Key Metrics');
      expect(result).toContain('Priorities');
      expect(result).toContain('Recommendations');
      expect(result).toContain(mockExecutiveSummary.overview);
    });

    it('should include metrics section with grid layout', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('Analysis Metrics');
      expect(result).toContain('<div class="metrics-grid">');
      expect(result).toContain('<div class="metric-box">');
      expect(result).toContain('<div class="metric-value">');
      expect(result).toContain('<div class="metric-label">');
    });

    it('should include tool results table', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('Tool Results');
      expect(result).toContain('<table class="tool-results-table">');
      expect(result).toContain('<thead>');
      expect(result).toContain('<th>Tool</th>');
      expect(result).toContain('<th>Status</th>');
      expect(result).toContain('<th>Issues</th>');
      expect(result).toContain('<th>Score</th>');
      expect(result).toContain('<th>Time (ms)</th>');
      expect(result).toContain('eslint');
    });

    it('should include coverage information when available', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('Code Coverage');
      expect(result).toContain('80%');
      expect(result).toContain('90%');
    });

    it('should include issues section with table', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('Issues (2 of 2)');
      expect(result).toContain('<table class="issues-table">');
      expect(result).toContain('<th>Severity</th>');
      expect(result).toContain('<th>Tool</th>');
      expect(result).toContain('<th>File</th>');
      expect(result).toContain('<th>Line</th>');
      expect(result).toContain('<th>Message</th>');
      expect(result).toContain('Unexpected console statement');
    });

    it('should include severity styling for PDF', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('severity-error');
      expect(result).toContain('severity-warning');
      expect(result).toContain('severity-info');
    });

    it('should include status styling for tools', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('status-success');
      expect(result).toContain('status-error');
      expect(result).toContain('status-warning');
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

      expect(result).toContain('Issues');
      expect(result).toContain('<strong>No issues found!</strong> Great job maintaining code quality.');
    });

    it('should limit issues for PDF readability', async () => {
      // Create many issues to test limiting
      const manyIssues = Array.from({ length: 150 }, (_, i) => ({
        id: `issue-${i}`,
        type: i % 3 === 0 ? 'error' : i % 2 === 0 ? 'warning' : 'info',
        toolName: 'eslint',
        filePath: `src/test${i}.js`,
        lineNumber: i + 1,
        message: `Issue ${i}`,
        fixable: true,
        score: i % 10,
      }));

      const dataWithManyIssues = {
        ...mockReportData,
        issues: manyIssues,
        metrics: {
          ...mockMetrics,
          totalIssues: 150,
        },
      };

      const result = await formatter.format(dataWithManyIssues, mockTemplate);

      expect(result).toContain('Issues (100 of 150)');
      expect(result).toContain('Note: Showing first 100 issues. Total issues: 150');
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

    it('should include trend analysis section when available', async () => {
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
      expect(result).toContain('15.5%');
      expect(result).toContain('improving');
      expect(result).toContain('Historical Data');
      expect(result).toContain('Trend chart would be rendered here');
    });

    it('should include visual analytics with chart placeholders', async () => {
      // Add charts section to template to test visual analytics
      const templateWithCharts = {
        ...mockTemplate,
        sections: [
          ...mockTemplate.sections,
          { id: 'charts', name: 'Charts', type: 'charts', enabled: true, order: 4 },
        ],
      };

      const result = await formatter.format(mockReportData, templateWithCharts);

      expect(result).toContain('Visual Analytics');
      expect(result).toContain('Issue Distribution');
      expect(result).toContain('Tool Performance');
      expect(result).toContain('chart would be rendered here');
    });

    it('should include proper footer', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('<div class="footer">');
      expect(result).toContain('Generated by DevQuality CLI');
      expect(result).toContain('Report ID: test-report-1');
    });

    it('should include appropriate page breaks for sections', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      // Issues section should have page break for better formatting
      expect(result).toContain('page-break');
    });

    it('should use appropriate font sizes for PDF', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('font-size: 12px');
      expect(result).toContain('font-size: 24px');
      expect(result).toContain('font-size: 18px');
      expect(result).toContain('font-size: 14px');
    });

    it('should use appropriate styling for summary boxes', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('summary-box');
      expect(result).toContain('background-color: #f0f9ff');
      expect(result).toContain('border: 1px solid #bae6fd');
    });

    it('should handle errors gracefully', async () => {
      const problematicData = {
        ...mockReportData,
        metadata: undefined,
      };

      await expect(formatter.format(problematicData, mockTemplate)).resolves.toBeDefined();
    });

    it('should format dates correctly for PDF', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain(new Date(mockReportData.metadata.generatedAt).toLocaleString());
      expect(result).toContain(new Date(mockAnalysisResult.timestamp).toLocaleDateString());
    });

    it('should include proper table styling', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      expect(result).toContain('border-collapse: collapse');
      expect(result).toContain('border: 1px solid #ddd');
      expect(result).toContain('padding: 8px');
      expect(result).toContain('background-color: #f5f5f5');
    });

    it('should be optimized for black and white printing', async () => {
      const result = await formatter.format(mockReportData, mockTemplate);

      // Should use appropriate contrast for printing
      expect(result).toContain('color: #333');
      expect(result).toContain('background: white');
    });
  });
});