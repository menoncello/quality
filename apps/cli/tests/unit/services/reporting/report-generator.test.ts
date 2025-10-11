/**
 * Unit Tests for Report Generator Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AnalysisResult, Issue } from '../../../../src/types/analysis';
import type { DashboardMetrics } from '../../../../src/types/dashboard';
import { ReportGenerator } from '../../../../src/services/reporting/report-generator';

// Mock data for testing
const mockAnalysisResult: AnalysisResult = {
  id: 'test-analysis-1',
  projectId: 'test-project',
  timestamp: '2023-10-09T10:00:00.000Z',
  duration: 5000,
  overallScore: 75,
  toolResults: [
    {
      toolName: 'eslint',
      executionTime: 2000,
      status: 'success',
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
      metrics: {
        issuesCount: 5,
        errorsCount: 1,
        warningsCount: 3,
        infoCount: 1,
        fixableCount: 2,
        score: 80,
        coverage: {
          lines: { total: 100, covered: 80, percentage: 80 },
          functions: { total: 20, covered: 18, percentage: 90 },
          branches: { total: 50, covered: 35, percentage: 70 },
          statements: { total: 120, covered: 96, percentage: 80 },
        },
      },
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

const mockIssues: Issue[] = [
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

const mockMetrics: DashboardMetrics = {
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
  toolResults: [
    {
      toolName: 'eslint',
      status: 'success',
      executionTime: 2000,
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
      metrics: {
        issuesCount: 5,
        errorsCount: 1,
        warningsCount: 3,
        infoCount: 1,
        fixableCount: 2,
        score: 80,
      },
    },
  ],
};

const mockReportConfiguration = {
  id: 'test-config-1',
  name: 'Test Report',
  description: 'Test report configuration',
  templateId: 'executive-summary',
  format: 'html' as const,
  schedule: undefined,
  recipients: [],
  filters: {},
  createdAt: new Date('2023-10-09T10:00:00.000Z'),
  updatedAt: new Date('2023-10-09T10:00:00.000Z'),
  isActive: true,
};

describe('ReportGenerator', () => {
  let reportGenerator: ReportGenerator;

  beforeEach(() => {
    reportGenerator = new ReportGenerator();
  });

  describe('constructor', () => {
    it('should initialize with built-in templates', () => {
      const templates = reportGenerator.getAvailableTemplates();

      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);

      const templateIds = templates.map(t => t.id);
      expect(templateIds).toContain('executive-summary');
      expect(templateIds).toContain('technical-report');
      expect(templateIds).toContain('detailed-analysis');
    });

    it('should support all required formats', () => {
      const formats = reportGenerator.getSupportedFormats();

      expect(formats).toEqual(['json', 'html', 'markdown', 'pdf']);
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return all available templates', () => {
      const templates = reportGenerator.getAvailableTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('sections');
        expect(template).toHaveProperty('templateType');
        expect(template).toHaveProperty('format');
      });
    });

    it('should include executive summary template', () => {
      const templates = reportGenerator.getAvailableTemplates();
      const executiveTemplate = templates.find(t => t.id === 'executive-summary');

      expect(executiveTemplate).toBeDefined();
      expect(executiveTemplate?.name).toBe('Executive Summary');
      expect(executiveTemplate?.format).toBe('html');
      expect(executiveTemplate?.templateType).toBe('builtin');
    });

    it('should include technical report template', () => {
      const templates = reportGenerator.getAvailableTemplates();
      const technicalTemplate = templates.find(t => t.id === 'technical-report');

      expect(technicalTemplate).toBeDefined();
      expect(technicalTemplate?.name).toBe('Technical Report');
      expect(technicalTemplate?.format).toBe('markdown');
      expect(technicalTemplate?.templateType).toBe('builtin');
    });

    it('should include detailed analysis template', () => {
      const templates = reportGenerator.getAvailableTemplates();
      const detailedTemplate = templates.find(t => t.id === 'detailed-analysis');

      expect(detailedTemplate).toBeDefined();
      expect(detailedTemplate?.name).toBe('Detailed Analysis');
      expect(detailedTemplate?.format).toBe('pdf');
      expect(detailedTemplate?.templateType).toBe('builtin');
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', () => {
      const template = reportGenerator.getTemplate('executive-summary');

      expect(template).toBeDefined();
      expect(template?.id).toBe('executive-summary');
      expect(template?.name).toBe('Executive Summary');
    });

    it('should return undefined for non-existent template', () => {
      const template = reportGenerator.getTemplate('non-existent');

      expect(template).toBeUndefined();
    });
  });

  describe('addTemplate', () => {
    it('should add custom template', () => {
      // Create a fresh report generator instance to avoid test interference
      const freshReportGenerator = new ReportGenerator();

      const customTemplate = {
        name: 'Custom Template',
        description: 'A custom template',
        sections: [
          { id: 'summary', name: 'Summary', type: 'summary' as const, enabled: true, order: 1 },
        ],
        format: 'html' as const,
        templateType: 'custom' as const,
        content: '<h1>{{title}}</h1>',
        author: 'Test Author' as const,
        version: '1.0.0' as const,
        tags: ['test'] as const,
        category: 'custom' as const,
        variables: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      freshReportGenerator.addTemplate(customTemplate);

      // Get all templates and find the one we just added
      const templates = freshReportGenerator.getAvailableTemplates();
      const retrievedTemplate = templates.find(t => t.name === 'Custom Template');

      expect(retrievedTemplate).toBeDefined();
      expect(retrievedTemplate?.name).toBe('Custom Template');
      expect(retrievedTemplate?.templateType).toBe('custom');
    });

    it('should override existing template with same ID', () => {
      // Create a fresh report generator instance to avoid test interference
      const freshReportGenerator = new ReportGenerator();

      const customTemplate = {
        id: 'executive-summary', // Same ID as built-in
        name: 'Custom Executive Summary',
        sections: [
          { id: 'custom-section', name: 'Custom Section', type: 'summary' as const, enabled: true, order: 1 },
        ],
        format: 'html' as const,
        templateType: 'custom' as const,
        content: '<h1>Custom</h1>',
        author: 'Test Author' as const,
        version: '1.0.0' as const,
        tags: ['test'] as const,
        category: 'custom' as const,
        variables: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      freshReportGenerator.addTemplate(customTemplate);

      const retrievedTemplate = freshReportGenerator.getTemplate('executive-summary');
      expect(retrievedTemplate?.name).toBe('Custom Executive Summary');
      expect(retrievedTemplate?.templateType).toBe('custom');
    });
  });

  describe('generateReport', () => {
    const mockProgressCallback = vi.fn();

    beforeEach(() => {
      mockProgressCallback.mockClear();
    });

    it('should generate report successfully', async () => {
      const request = {
        configuration: mockReportConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
        onProgress: mockProgressCallback,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.success).toBe(true);
      expect(result.reportId).toBeDefined();
      expect(result.configurationId).toBe(mockReportConfiguration.id);
      expect(result.outputPath).toBeDefined();
      expect(result.format).toBe(mockReportConfiguration.format);
      expect(result.size).toBeGreaterThan(0);
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
      expect(result.metadata).toBeDefined();
    });

    it('should call progress callback', async () => {
      const request = {
        configuration: mockReportConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
        onProgress: mockProgressCallback,
      };

      await reportGenerator.generateReport(request);

      expect(mockProgressCallback).toHaveBeenCalled();

      // Check that progress was reported
      const progressCalls = mockProgressCallback.mock.calls;
      expect(progressCalls.length).toBeGreaterThan(0);

      // Check final progress call shows completion
      const finalProgress = progressCalls[progressCalls.length - 1][0];
      expect(finalProgress.percentage).toBe(100);
      expect(finalProgress.currentStep).toBe('Complete');
    });

    it('should handle missing progress callback', async () => {
      const request = {
        configuration: mockReportConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.success).toBe(true);
    });

    it('should validate configuration', async () => {
      const invalidConfiguration = {
        ...mockReportConfiguration,
        name: '', // Invalid empty name
      };

      const request = {
        configuration: invalidConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Report name is required');
    });

    it('should validate template exists', async () => {
      const invalidConfiguration = {
        ...mockReportConfiguration,
        templateId: 'non-existent-template',
      };

      const request = {
        configuration: invalidConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template not found');
    });

    it('should validate format', async () => {
      const invalidConfiguration = {
        ...mockReportConfiguration,
        format: 'invalid-format' as any,
      };

      const request = {
        configuration: invalidConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid format');
    });

    it('should apply filters to issues', async () => {
      const configurationWithFilters = {
        ...mockReportConfiguration,
        filters: {
          severity: ['error'] as const,
          fixableOnly: true,
        },
      };

      const request = {
        configuration: configurationWithFilters,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.success).toBe(true);
      // The report should be generated with filtered issues
      expect(result.outputPath).toBeDefined();
    });

    it('should generate executive summary when enabled', async () => {
      const executiveConfiguration = {
        ...mockReportConfiguration,
        templateId: 'executive-summary',
      };

      const request = {
        configuration: executiveConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.success).toBe(true);
      // Executive summary generation should not cause errors
      expect(result.error).toBeUndefined();
    });

    it('should handle different formats', async () => {
      const formats: Array<'json' | 'html' | 'markdown' | 'pdf'> = ['json', 'html', 'markdown', 'pdf'];

      for (const format of formats) {
        const configuration = {
          ...mockReportConfiguration,
          format,
        };

        const request = {
          configuration,
          analysisResult: mockAnalysisResult,
          issues: mockIssues,
          metrics: mockMetrics,
        };

        const result = await reportGenerator.generateReport(request);

        expect(result.success).toBe(true);
        expect(result.format).toBe(format);
        expect(result.outputPath).toBeDefined();
      }
    });

    it('should handle historical data for trend analysis', async () => {
      const historicalData = [
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

      const request = {
        configuration: mockReportConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
        historicalData,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.success).toBe(true);
      // Historical data should not cause errors
      expect(result.error).toBeUndefined();
    });

    it('should handle empty issues array', async () => {
      const request = {
        configuration: mockReportConfiguration,
        analysisResult: mockAnalysisResult,
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

      const result = await reportGenerator.generateReport(request);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should generate unique report IDs', async () => {
      const request = {
        configuration: mockReportConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result1 = await reportGenerator.generateReport(request);
      const result2 = await reportGenerator.generateReport(request);

      expect(result1.reportId).not.toBe(result2.reportId);
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should include metadata in result', async () => {
      const request = {
        configuration: mockReportConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.title).toBe(mockReportConfiguration.name);
      expect(result.metadata.description).toBe(mockReportConfiguration.description);
      expect(result.metadata.version).toBe('1.0.0');
    });

    it('should handle formatter errors gracefully', async () => {
      // Create a configuration that might cause formatter issues
      const problematicConfiguration = {
        ...mockReportConfiguration,
        format: 'pdf' as const, // PDF formatter has HTML conversion complexity
      };

      const request = {
        configuration: problematicConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result = await reportGenerator.generateReport(request);

      // Should still succeed even with complex format
      expect(result.success).toBe(true);
    });

    it('should measure execution time', async () => {
      const request = {
        configuration: mockReportConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.duration).toBeGreaterThan(0);
      expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should create output directory if it doesn\'t exist', async () => {
      const request = {
        configuration: mockReportConfiguration,
        analysisResult: mockAnalysisResult,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.success).toBe(true);
      expect(result.outputPath).toBeDefined();
      // Path should include reports directory
      expect(result.outputPath).toContain('/reports/');
    });
  });

  describe('getSupportedFormats', () => {
    it('should return all supported formats', () => {
      const formats = reportGenerator.getSupportedFormats();

      expect(formats).toContain('json');
      expect(formats).toContain('html');
      expect(formats).toContain('markdown');
      expect(formats).toContain('pdf');
      expect(formats).toHaveLength(4);
    });
  });

  describe('error handling', () => {
    it('should handle missing analysis result gracefully', async () => {
      const request = {
        configuration: mockReportConfiguration,
        analysisResult: null as any,
        issues: mockIssues,
        metrics: mockMetrics,
      };

      const result = await reportGenerator.generateReport(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle corrupted issues data gracefully', async () => {
      const corruptedIssues = [
        null,
        undefined,
        { invalid: 'issue' },
        ...mockIssues,
      ] as any[];

      const request = {
        configuration: mockReportConfiguration,
        analysisResult: mockAnalysisResult,
        issues: corruptedIssues,
        metrics: mockMetrics,
      };

      // Should not crash, but may have filtering issues
      const result = await reportGenerator.generateReport(request);

      // The exact behavior depends on implementation, but shouldn't crash
      expect(result).toBeDefined();
    });
  });
});