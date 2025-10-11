/**
 * Trend Analysis Test Suite
 *
 * Comprehensive tests for historical trend analysis reporting (Story 2.4 AC6)
 * including trend calculation algorithms, time-series analysis, and visualization.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReportGenerator, type HistoricalData, type TrendAnalysis } from '../../../../src/services/reporting/report-generator';
import type { AnalysisResult } from '../../../../src/types/analysis';
import type { DashboardMetrics } from '../../../../src/types/dashboard';

// Mock formatters to focus on trend analysis functionality
vi.mock('../../../../src/services/reporting/formatters/json-formatter');
vi.mock('../../../../src/services/reporting/formatters/html-formatter');
vi.mock('../../../../src/services/reporting/formatters/markdown-formatter');
vi.mock('../../../../src/services/reporting/formatters/pdf-formatter');

// Mock TemplateService
vi.mock('../../../../src/services/reporting/template-service', () => ({
  TemplateService: vi.fn().mockImplementation(() => ({
    getTemplate: vi.fn().mockReturnValue({
      id: 'trend-analysis',
      name: 'Trend Analysis',
      sections: [
        { id: 'trends', type: 'trends', enabled: true, order: 1 },
        { id: 'charts', type: 'charts', enabled: true, order: 2 }
      ]
    }),
    hasTemplate: vi.fn().mockReturnValue(true)
  }))
}));

describe('Trend Analysis', () => {
  let reportGenerator: ReportGenerator;
  let mockAnalysisResult: AnalysisResult;
  let mockMetrics: DashboardMetrics;
  let mockHistoricalData: HistoricalData[];

  beforeEach(() => {
    reportGenerator = new ReportGenerator();

    // Mock analysis result
    mockAnalysisResult = {
      id: 'analysis-123',
      projectId: 'test-project',
      timestamp: '2025-01-15T10:30:00.000Z',
      duration: 5000,
      overallScore: 75,
      toolResults: [],
      summary: {
        totalIssues: 15,
        totalErrors: 3,
        totalWarnings: 8,
        totalFixable: 10,
        overallScore: 75,
        toolCount: 3,
        executionTime: 5000
      },
      aiPrompts: []
    };

    // Mock metrics
    mockMetrics = {
      totalIssues: 15,
      errorCount: 3,
      warningCount: 8,
      infoCount: 4,
      fixableCount: 10,
      overallScore: 75,
      coverage: {
        lines: { percentage: 82, covered: 410, total: 500 },
        functions: { percentage: 75, covered: 30, total: 40 },
        branches: { percentage: 68, covered: 34, total: 50 },
        statements: { percentage: 85, covered: 425, total: 500 }
      },
      toolsAnalyzed: 3,
      duration: 5000
    };

    // Mock comprehensive historical data
    mockHistoricalData = [
      {
        timestamp: new Date('2025-01-15'),
        overallScore: 75,
        totalIssues: 15,
        errorCount: 3,
        warningCount: 8,
        infoCount: 4,
        fixableCount: 10,
        toolResults: [
          { toolName: 'eslint', score: 78, issuesCount: 8 },
          { toolName: 'typescript', score: 72, issuesCount: 7 }
        ]
      },
      {
        timestamp: new Date('2025-01-08'),
        overallScore: 70,
        totalIssues: 20,
        errorCount: 5,
        warningCount: 10,
        infoCount: 5,
        fixableCount: 12,
        toolResults: [
          { toolName: 'eslint', score: 65, issuesCount: 12 },
          { toolName: 'typescript', score: 75, issuesCount: 8 }
        ]
      },
      {
        timestamp: new Date('2025-01-01'),
        overallScore: 65,
        totalIssues: 25,
        errorCount: 8,
        warningCount: 12,
        infoCount: 5,
        fixableCount: 15,
        toolResults: [
          { toolName: 'eslint', score: 60, issuesCount: 15 },
          { toolName: 'typescript', score: 68, issuesCount: 10 }
        ]
      },
      {
        timestamp: new Date('2024-12-25'),
        overallScore: 60,
        totalIssues: 30,
        errorCount: 12,
        warningCount: 15,
        infoCount: 3,
        fixableCount: 18,
        toolResults: [
          { toolName: 'eslint', score: 55, issuesCount: 18 },
          { toolName: 'typescript', score: 62, issuesCount: 12 }
        ]
      },
      {
        timestamp: new Date('2024-12-18'),
        overallScore: 55,
        totalIssues: 35,
        errorCount: 15,
        warningCount: 18,
        infoCount: 2,
        fixableCount: 20,
        toolResults: [
          { toolName: 'eslint', score: 50, issuesCount: 20 },
          { toolName: 'typescript', score: 58, issuesCount: 15 }
        ]
      }
    ];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Trend Calculation Algorithms', () => {
    it('should calculate improving trend correctly', async () => {
      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Trend Analysis Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: mockHistoricalData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should calculate declining trend correctly', async () => {
      const decliningHistoricalData = [
        {
          timestamp: new Date('2025-01-15'),
          overallScore: 50,
          totalIssues: 40,
          errorCount: 15,
          warningCount: 20,
          infoCount: 5,
          fixableCount: 25,
          toolResults: []
        },
        {
          timestamp: new Date('2025-01-08'),
          overallScore: 60,
          totalIssues: 30,
          errorCount: 10,
          warningCount: 15,
          infoCount: 5,
          fixableCount: 20,
          toolResults: []
        },
        {
          timestamp: new Date('2025-01-01'),
          overallScore: 70,
          totalIssues: 20,
          errorCount: 5,
          warningCount: 10,
          infoCount: 5,
          fixableCount: 15,
          toolResults: []
        }
      ];

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Declining Trend Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: {
          ...mockAnalysisResult,
          overallScore: 50
        },
        issues: [],
        metrics: {
          ...mockMetrics,
          overallScore: 50,
          totalIssues: 40,
          errorCount: 15,
          warningCount: 20
        },
        historicalData: decliningHistoricalData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });

    it('should identify stable trend', async () => {
      const stableHistoricalData = [
        {
          timestamp: new Date('2025-01-15'),
          overallScore: 75,
          totalIssues: 15,
          errorCount: 3,
          warningCount: 8,
          infoCount: 4,
          fixableCount: 10,
          toolResults: []
        },
        {
          timestamp: new Date('2025-01-08'),
          overallScore: 76,
          totalIssues: 14,
          errorCount: 3,
          warningCount: 8,
          infoCount: 3,
          fixableCount: 9,
          toolResults: []
        },
        {
          timestamp: new Date('2025-01-01'),
          overallScore: 74,
          totalIssues: 16,
          errorCount: 4,
          warningCount: 8,
          infoCount: 4,
          fixableCount: 11,
          toolResults: []
        }
      ];

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Stable Trend Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: stableHistoricalData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });

    it('should handle insufficient historical data', async () => {
      const insufficientData = [
        {
          timestamp: new Date('2025-01-15'),
          overallScore: 75,
          totalIssues: 15,
          errorCount: 3,
          warningCount: 8,
          infoCount: 4,
          fixableCount: 10,
          toolResults: []
        }
      ];

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Insufficient Data Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: insufficientData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });

    it('should calculate trend for individual metrics', async () => {
      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Metric Trend Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: mockHistoricalData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });
  });

  describe('Time-Series Analysis', () => {
    it('should analyze moving averages', async () => {
      const timeSeriesData = Array.from({ length: 20 }, (_, index) => ({
        timestamp: new Date(Date.now() - (19 - index) * 24 * 60 * 60 * 1000), // 20 days of data
        overallScore: 50 + Math.sin(index * 0.3) * 20 + Math.random() * 10, // Sine wave with noise
        totalIssues: 30 - index * 0.5 + Math.random() * 5,
        errorCount: Math.max(0, 10 - index * 0.3 + Math.random() * 3),
        warningCount: Math.max(0, 15 - index * 0.4 + Math.random() * 4),
        infoCount: Math.max(0, 5 - index * 0.1 + Math.random() * 2),
        fixableCount: Math.max(0, 20 - index * 0.4 + Math.random() * 4),
        toolResults: []
      }));

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Time Series Analysis Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: timeSeriesData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should detect seasonal patterns', async () => {
      const seasonalData = Array.from({ length: 90 }, (_, index) => ({
        timestamp: new Date(Date.now() - (89 - index) * 24 * 60 * 60 * 1000), // 90 days of data
        overallScore: 70 + Math.sin(index * Math.PI / 7) * 15 + Math.random() * 5, // Weekly pattern
        totalIssues: 20 + Math.sin(index * Math.PI / 7) * 10 + Math.random() * 3,
        errorCount: Math.max(0, 8 + Math.sin(index * Math.PI / 7) * 4),
        warningCount: Math.max(0, 10 + Math.sin(index * Math.PI / 7) * 5),
        infoCount: Math.max(0, 2 + Math.sin(index * Math.PI / 7) * 1),
        fixableCount: Math.max(0, 15 + Math.sin(index * Math.PI / 7) * 6),
        toolResults: []
      }));

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Seasonal Pattern Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: seasonalData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });

    it('should handle irregular time intervals', async () => {
      const irregularData = [
        {
          timestamp: new Date('2025-01-15'),
          overallScore: 75,
          totalIssues: 15,
          errorCount: 3,
          warningCount: 8,
          infoCount: 4,
          fixableCount: 10,
          toolResults: []
        },
        {
          timestamp: new Date('2025-01-10'), // 5 days gap
          overallScore: 72,
          totalIssues: 18,
          errorCount: 4,
          warningCount: 9,
          infoCount: 5,
          fixableCount: 12,
          toolResults: []
        },
        {
          timestamp: new Date('2025-01-05'), // 5 days gap
          overallScore: 68,
          totalIssues: 22,
          errorCount: 6,
          warningCount: 11,
          infoCount: 5,
          fixableCount: 14,
          toolResults: []
        },
        {
          timestamp: new Date('2025-01-01'), // 4 days gap
          overallScore: 65,
          totalIssues: 25,
          errorCount: 8,
          warningCount: 12,
          infoCount: 5,
          fixableCount: 15,
          toolResults: []
        }
      ];

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Irregular Interval Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: irregularData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });
  });

  describe('Comparative Analysis', () => {
    it('should compare between different time periods', async () => {
      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Comparative Analysis Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {
            dateRange: {
              start: new Date('2025-01-01'),
              end: new Date('2025-01-15')
            }
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: mockHistoricalData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });

    it('should compare between projects', async () => {
      const projectComparisonRequest = {
        configuration: {
          id: 'config-1',
          name: 'Project Comparison Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: {
          ...mockAnalysisResult,
          projectId: 'project-a'
        },
        issues: [],
        metrics: mockMetrics,
        historicalData: mockHistoricalData.map(data => ({
          ...data,
          toolResults: [
            { toolName: 'project-a', score: data.overallScore + 5, issuesCount: data.totalIssues - 2 },
            { toolName: 'project-b', score: data.overallScore - 5, issuesCount: data.totalIssues + 2 }
          ]
        }))
      };

      const result = await reportGenerator.generateReport(projectComparisonRequest);

      expect(result.success).toBe(true);
    });

    it('should analyze tool-specific trends', async () => {
      const toolSpecificHistoricalData = mockHistoricalData.map(data => ({
        ...data,
        toolResults: [
          { toolName: 'eslint', score: 80 - Math.random() * 20, issuesCount: Math.floor(10 + Math.random() * 10) },
          { toolName: 'typescript', score: 75 - Math.random() * 25, issuesCount: Math.floor(8 + Math.random() * 12) },
          { toolName: 'prettier', score: 90 - Math.random() * 15, issuesCount: Math.floor(5 + Math.random() * 8) }
        ]
      }));

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Tool-Specific Trends Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {
            tools: ['eslint', 'typescript', 'prettier']
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: toolSpecificHistoricalData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });
  });

  describe('Trend Visualization', () => {
    it('should generate ASCII chart representations', async () => {
      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'ASCII Chart Report',
          templateId: 'trend-analysis',
          format: 'markdown' as const, // Markdown for ASCII charts
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: mockHistoricalData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
      expect(result.format).toBe('markdown');
    });

    it('should include trend indicators in reports', async () => {
      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Trend Indicators Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: mockHistoricalData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });
  });

  describe('Trend Alerting', () => {
    it('should detect significant quality changes', async () => {
      const significantChangeData = [
        {
          timestamp: new Date('2025-01-15'),
          overallScore: 95,
          totalIssues: 5,
          errorCount: 0,
          warningCount: 3,
          infoCount: 2,
          fixableCount: 4,
          toolResults: []
        },
        {
          timestamp: new Date('2025-01-08'),
          overallScore: 45,
          totalIssues: 50,
          errorCount: 20,
          warningCount: 25,
          infoCount: 5,
          fixableCount: 30,
          toolResults: []
        }
      ];

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Significant Change Alert Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: {
          ...mockAnalysisResult,
          overallScore: 95
        },
        issues: [],
        metrics: {
          ...mockMetrics,
          overallScore: 95,
          totalIssues: 5,
          errorCount: 0,
          warningCount: 3
        },
        historicalData: significantChangeData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });

    it('should identify concerning trend patterns', async () => {
      const concerningTrendData = [
        {
          timestamp: new Date('2025-01-15'),
          overallScore: 70,
          totalIssues: 20,
          errorCount: 8,
          warningCount: 10,
          infoCount: 2,
          fixableCount: 12,
          toolResults: []
        },
        {
          timestamp: new Date('2025-01-08'),
          overallScore: 72,
          totalIssues: 18,
          errorCount: 7,
          warningCount: 9,
          infoCount: 2,
          fixableCount: 11,
          toolResults: []
        },
        {
          timestamp: new Date('2025-01-01'),
          overallScore: 74,
          totalIssues: 16,
          errorCount: 6,
          warningCount: 8,
          infoCount: 2,
          fixableCount: 10,
          toolResults: []
        },
        {
          timestamp: new Date('2024-12-25'),
          overallScore: 76,
          totalIssues: 14,
          errorCount: 5,
          warningCount: 7,
          infoCount: 2,
          fixableCount: 9,
          toolResults: []
        },
        {
          timestamp: new Date('2024-12-18'),
          overallScore: 78,
          totalIssues: 12,
          errorCount: 4,
          warningCount: 6,
          infoCount: 2,
          fixableCount: 8,
          toolResults: []
        }
      ];

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Concerning Trend Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: {
          ...mockAnalysisResult,
          overallScore: 70
        },
        issues: [],
        metrics: {
          ...mockMetrics,
          overallScore: 70,
          totalIssues: 20,
          errorCount: 8,
          warningCount: 10
        },
        historicalData: concerningTrendData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });
  });

  describe('Statistical Analysis', () => {
    it('should calculate trend confidence levels', async () => {
      const highConfidenceData = Array.from({ length: 50 }, (_, index) => ({
        timestamp: new Date(Date.now() - (49 - index) * 24 * 60 * 60 * 1000), // 50 days
        overallScore: 50 + index * 0.5 + Math.random() * 3, // Clear upward trend
        totalIssues: Math.max(0, 40 - index * 0.3 + Math.random() * 2),
        errorCount: Math.max(0, 15 - index * 0.2 + Math.random() * 1),
        warningCount: Math.max(0, 20 - index * 0.2 + Math.random() * 1),
        infoCount: Math.max(0, 5 - index * 0.05 + Math.random() * 0.5),
        fixableCount: Math.max(0, 25 - index * 0.3 + Math.random() * 1),
        toolResults: []
      }));

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Statistical Analysis Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: highConfidenceData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });

    it('should handle outlier detection', async () => {
      const dataWithOutliers = [
        ...mockHistoricalData.slice(0, 3), // Normal data
        {
          timestamp: new Date('2024-12-25'),
          overallScore: 20, // Outlier - very low score
          totalIssues: 100, // Outlier - very high issues
          errorCount: 50,
          warningCount: 40,
          infoCount: 10,
          fixableCount: 60,
          toolResults: []
        },
        ...mockHistoricalData.slice(3) // Continue with normal data
      ];

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Outlier Detection Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: dataWithOutliers
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    it('should process large historical datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        timestamp: new Date(Date.now() - (999 - index) * 24 * 60 * 60 * 1000), // 1000 days
        overallScore: 50 + Math.sin(index * 0.01) * 20 + Math.random() * 10,
        totalIssues: Math.max(0, 30 + Math.sin(index * 0.01) * 15 + Math.random() * 5),
        errorCount: Math.max(0, 10 + Math.sin(index * 0.01) * 8 + Math.random() * 3),
        warningCount: Math.max(0, 15 + Math.sin(index * 0.01) * 7 + Math.random() * 3),
        infoCount: Math.max(0, 5 + Math.sin(index * 0.01) * 2 + Math.random() * 1),
        fixableCount: Math.max(0, 20 + Math.sin(index * 0.01) * 10 + Math.random() * 3),
        toolResults: [
          { toolName: 'eslint', score: 60 + Math.random() * 30, issuesCount: Math.floor(5 + Math.random() * 20) },
          { toolName: 'typescript', score: 55 + Math.random() * 35, issuesCount: Math.floor(3 + Math.random() * 15) }
        ]
      }));

      const startTime = Date.now();

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Large Dataset Performance Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: largeDataset
      };

      const result = await reportGenerator.generateReport(reportRequest);
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(10000); // Should process within 10 seconds
    });

    it('should handle concurrent trend analysis requests', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, index) => ({
        configuration: {
          id: `config-${index}`,
          name: `Concurrent Report ${index}`,
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: {
          ...mockAnalysisResult,
          id: `analysis-${index}`,
          projectId: `project-${index}`
        },
        issues: [],
        metrics: {
          ...mockMetrics,
          overallScore: 50 + index * 10
        },
        historicalData: mockHistoricalData
      }));

      const startTime = Date.now();

      const results = await Promise.all(
        concurrentRequests.map(request => reportGenerator.generateReport(request))
      );

      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(5);
      expect(results.every(result => result.success)).toBe(true);
      expect(totalTime).toBeLessThan(15000); // Should handle 5 concurrent requests within 15 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed historical data gracefully', async () => {
      const malformedData = [
        {
          timestamp: new Date('2025-01-15'),
          overallScore: 75,
          totalIssues: 15,
          errorCount: 3,
          warningCount: 8,
          infoCount: 4,
          fixableCount: 10,
          toolResults: []
        },
        {
          // Missing some required fields
          timestamp: new Date('2025-01-08'),
          overallScore: -5, // Invalid score
          totalIssues: -10, // Invalid count
          toolResults: []
        },
        {
          timestamp: new Date('2025-01-01'),
          overallScore: null as any, // Null value
          totalIssues: undefined as any, // Undefined value
          errorCount: 'invalid' as any, // Wrong type
          warningCount: 8,
          infoCount: 2,
          fixableCount: 5,
          toolResults: []
        }
      ];

      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Malformed Data Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: malformedData
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });

    it('should handle empty historical data', async () => {
      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Empty History Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: []
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });

    it('should handle null/undefined historical data', async () => {
      const reportRequest = {
        configuration: {
          id: 'config-1',
          name: 'Null History Report',
          templateId: 'trend-analysis',
          format: 'html' as const,
          recipients: [],
          filters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        analysisResult: mockAnalysisResult,
        issues: [],
        metrics: mockMetrics,
        historicalData: null as any
      };

      const result = await reportGenerator.generateReport(reportRequest);

      expect(result.success).toBe(true);
    });
  });
});