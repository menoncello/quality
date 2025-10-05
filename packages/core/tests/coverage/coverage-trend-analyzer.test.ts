import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { CoverageTrendAnalyzer } from '../../src/services/coverage-trend-analyzer.js';
import type { AnalysisContext, CoverageData } from '../../src/plugins/analysis-plugin.js';
import { unlink } from 'fs/promises';
import { join } from 'path';

describe('CoverageTrendAnalyzer', () => {
  let analyzer: CoverageTrendAnalyzer;
  let mockContext: AnalysisContext;

  beforeEach(() => {
    analyzer = new CoverageTrendAnalyzer();

    mockContext = {
      projectPath: '/test/project',
      config: {
        name: 'test-project',
        version: '1.0.0',
        tools: []
      },
      logger: {
        error: () => {},
        warn: () => {},
        info: () => {},
        debug: () => {}
      }
    } as AnalysisContext;
  });

  afterEach(async () => {
    // Clean up test history file
    try {
      const historyPath = join(mockContext.projectPath, '.dev-quality', 'coverage-history.json');
      await unlink(historyPath);
    } catch {
      // File might not exist, ignore
    }
  });

  describe('trend analysis', () => {
    it('should analyze coverage trends and return trend data', async () => {
      const mockCoverageData: CoverageData = {
        lines: { total: 100, covered: 80, percentage: 80 },
        functions: { total: 20, covered: 16, percentage: 80 },
        branches: { total: 40, covered: 30, percentage: 75 },
        statements: { total: 120, covered: 96, percentage: 80 }
      };

      const mockEnhancedCoverage = {
        ...mockCoverageData,
        files: [],
        criticalPaths: [],
        qualityScore: {
          overall: 80,
          lineCoverage: 80,
          branchCoverage: 75,
          functionCoverage: 80,
          statementCoverage: 80,
          criticalPathCoverage: 90,
          testComplexity: 85,
          testMaintainability: 85,
          codeComplexity: 15,
          riskLevel: 'low' as const,
          grade: 'B' as const,
          breakdown: {
            coverage: 80,
            complexity: 85,
            criticality: 90,
            trends: 75
          }
        },
        uncoveredAreas: [],
        recommendations: [],
        metadata: {
          generatedAt: new Date(),
          tool: 'coverage-analyzer',
          projectName: 'test-project',
          version: '1.0.0'
        }
      };

      const trends = await analyzer.analyzeTrends(mockContext, mockEnhancedCoverage);

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);

      // Verify trend structure
      const trend = trends[0];
      expect(trend.timestamp).toBeInstanceOf(Date);
      expect(trend.overallCoverage).toBe(80);
      expect(trend.lineCoverage).toBe(80);
      expect(trend.branchCoverage).toBe(75);
      expect(trend.functionCoverage).toBe(80);
      expect(trend.statementCoverage).toBe(80);
    });

    it('should handle multiple trend analyses over time', async () => {
      const mockCoverageData1: CoverageData = {
        lines: { total: 100, covered: 75, percentage: 75 },
        functions: { total: 20, covered: 15, percentage: 75 },
        branches: { total: 40, covered: 30, percentage: 75 },
        statements: { total: 120, covered: 90, percentage: 75 }
      };

      const mockEnhancedCoverage1 = {
        ...mockCoverageData1,
        files: [],
        criticalPaths: [],
        qualityScore: {
          overall: 75,
          lineCoverage: 75,
          branchCoverage: 75,
          functionCoverage: 75,
          statementCoverage: 75,
          criticalPathCoverage: 85,
          testComplexity: 80,
          testMaintainability: 80,
          codeComplexity: 20,
          riskLevel: 'medium' as const,
          grade: 'C' as const,
          breakdown: {
            coverage: 75,
            complexity: 80,
            criticality: 85,
            trends: 70
          }
        },
        uncoveredAreas: [],
        recommendations: [],
        metadata: {
          generatedAt: new Date(),
          tool: 'coverage-analyzer',
          projectName: 'test-project',
          version: '1.0.0'
        }
      };

      const mockCoverageData2: CoverageData = {
        lines: { total: 100, covered: 85, percentage: 85 },
        functions: { total: 20, covered: 17, percentage: 85 },
        branches: { total: 40, covered: 34, percentage: 85 },
        statements: { total: 120, covered: 102, percentage: 85 }
      };

      const mockEnhancedCoverage2 = {
        ...mockCoverageData2,
        files: [],
        criticalPaths: [],
        qualityScore: {
          overall: 85,
          lineCoverage: 85,
          branchCoverage: 85,
          functionCoverage: 85,
          statementCoverage: 85,
          criticalPathCoverage: 90,
          testComplexity: 85,
          testMaintainability: 85,
          codeComplexity: 15,
          riskLevel: 'low' as const,
          grade: 'B' as const,
          breakdown: {
            coverage: 85,
            complexity: 85,
            criticality: 90,
            trends: 80
          }
        },
        uncoveredAreas: [],
        recommendations: [],
        metadata: {
          generatedAt: new Date(),
          tool: 'coverage-analyzer',
          projectName: 'test-project',
          version: '1.0.0'
        }
      };

      // First analysis
      await analyzer.analyzeTrends(mockContext, mockEnhancedCoverage1);

      // Wait a moment to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second analysis
      const trends = await analyzer.analyzeTrends(mockContext, mockEnhancedCoverage2);

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThanOrEqual(1);

      // Should have trend data showing changes
      const latestTrend = trends[trends.length - 1];
      expect(latestTrend.overallChange).toBeDefined();
      expect(latestTrend.lineChange).toBeDefined();
      expect(latestTrend.branchChange).toBeDefined();
      expect(latestTrend.functionChange).toBeDefined();
      expect(latestTrend.statementChange).toBeDefined();
    });

    it('should handle errors gracefully and return current trend', async () => {
      const invalidContext = {
        ...mockContext,
        projectPath: '/invalid/path/that/does/not/exist'
      } as AnalysisContext;

      const mockEnhancedCoverage = {
        lines: { total: 100, covered: 80, percentage: 80 },
        functions: { total: 20, covered: 16, percentage: 80 },
        branches: { total: 40, covered: 30, percentage: 75 },
        statements: { total: 120, covered: 96, percentage: 80 },
        files: [],
        criticalPaths: [],
        qualityScore: {
          overall: 80,
          lineCoverage: 80,
          branchCoverage: 75,
          functionCoverage: 80,
          statementCoverage: 80,
          criticalPathCoverage: 90,
          testComplexity: 85,
          testMaintainability: 85,
          codeComplexity: 15,
          riskLevel: 'low' as const,
          grade: 'B' as const,
          breakdown: {
            coverage: 80,
            complexity: 85,
            criticality: 90,
            trends: 75
          }
        },
        uncoveredAreas: [],
        recommendations: [],
        metadata: {
          generatedAt: new Date(),
          tool: 'coverage-analyzer',
          projectName: 'test-project',
          version: '1.0.0'
        }
      };

      // Should handle errors gracefully and still return trend data
      const trends = await analyzer.analyzeTrends(invalidContext, mockEnhancedCoverage);

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBe(1); // Should return current trend even on error
    });
  });
});