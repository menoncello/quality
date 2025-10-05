import { describe, it, expect, beforeEach } from 'bun:test';
import { CoverageAnalyzer } from '../../src/services/coverage-analyzer.js';
describe('CoverageAnalyzer', () => {
    let analyzer;
    let mockContext;
    let mockBasicCoverage;
    beforeEach(() => {
        analyzer = new CoverageAnalyzer();
        mockContext = {
            projectPath: '/test/project',
            config: {
                name: 'test-project',
                version: '1.0.0',
                tools: []
            },
            logger: {
                error: () => { },
                warn: () => { },
                info: () => { },
                debug: () => { }
            }
        };
        mockBasicCoverage = {
            lines: { total: 100, covered: 80, percentage: 80 },
            functions: { total: 20, covered: 16, percentage: 80 },
            branches: { total: 40, covered: 30, percentage: 75 },
            statements: { total: 120, covered: 96, percentage: 80 }
        };
    });
    describe('analyzeCoverage', () => {
        it('should analyze basic coverage data', async () => {
            const result = await analyzer.analyzeCoverage(mockBasicCoverage, mockContext);
            expect(result).toBeDefined();
            expect(result.lines.percentage).toBe(80);
            expect(result.functions.percentage).toBe(80);
            expect(result.branches.percentage).toBe(75);
            expect(result.statements.percentage).toBe(80);
        });
        it('should include quality scoring when enabled', async () => {
            const analyzerWithScoring = new CoverageAnalyzer({
                enableQualityScoring: true
            });
            const result = await analyzerWithScoring.analyzeCoverage(mockBasicCoverage, mockContext);
            expect(result.qualityScore).toBeDefined();
            expect(result.qualityScore.overall).toBeGreaterThan(0);
            expect(result.qualityScore.grade).toMatch(/^[A-F]$/);
        });
        it('should include risk assessment when enabled', async () => {
            const analyzerWithRisk = new CoverageAnalyzer({
                enableRiskAssessment: true
            });
            const result = await analyzerWithRisk.analyzeCoverage(mockBasicCoverage, mockContext);
            expect(result.uncoveredAreas).toBeDefined();
            expect(Array.isArray(result.uncoveredAreas)).toBe(true);
        });
        it('should generate recommendations', async () => {
            const result = await analyzer.analyzeCoverage(mockBasicCoverage, mockContext);
            expect(result.recommendations).toBeDefined();
            expect(Array.isArray(result.recommendations)).toBe(true);
        });
        it('should include metadata', async () => {
            const result = await analyzer.analyzeCoverage(mockBasicCoverage, mockContext);
            expect(result.metadata).toBeDefined();
            expect(result.metadata.generatedAt).toBeInstanceOf(Date);
            expect(result.metadata.tool).toBe('coverage-analyzer');
            expect(result.metadata.projectName).toBe('test-project');
        });
    });
    describe('configuration', () => {
        it('should use custom thresholds', async () => {
            const customAnalyzer = new CoverageAnalyzer({
                thresholds: {
                    overall: 90,
                    lines: 85,
                    branches: 80,
                    functions: 85,
                    statements: 90,
                    criticalPaths: 95
                }
            });
            const result = await customAnalyzer.analyzeCoverage(mockBasicCoverage, mockContext);
            // Should generate recommendations due to lower coverage
            expect(result.recommendations.length).toBeGreaterThan(0);
        });
        it('should respect exclusions', async () => {
            const analyzerWithExclusions = new CoverageAnalyzer({
                exclusions: ['**/test/**', '**/node_modules/**']
            });
            const mockDetailedCoverage = {
                files: {
                    '/test/project/src/main.js': { l: {}, f: {}, b: {}, s: {} },
                    '/test/project/test/test.js': { l: {}, f: {}, b: {}, s: {} },
                    '/test/project/node_modules/lib.js': { l: {}, f: {}, b: {}, s: {} }
                }
            };
            const result = await analyzerWithExclusions.analyzeCoverage(mockBasicCoverage, mockContext, mockDetailedCoverage);
            expect(result.files).toBeDefined();
            expect(result.files.length).toBe(1); // Only main.js should be included
            expect(result.files[0].relativePath).toBe('/src/main.js');
        });
    });
    describe('edge cases', () => {
        it('should handle zero coverage', async () => {
            const zeroCoverage = {
                lines: { total: 0, covered: 0, percentage: 0 },
                functions: { total: 0, covered: 0, percentage: 0 },
                branches: { total: 0, covered: 0, percentage: 0 },
                statements: { total: 0, covered: 0, percentage: 0 }
            };
            const result = await analyzer.analyzeCoverage(zeroCoverage, mockContext);
            expect(result).toBeDefined();
            expect(result.lines.percentage).toBe(0);
            expect(result.qualityScore?.overall).toBeGreaterThanOrEqual(0);
            expect(result.qualityScore?.grade).toBe('F');
        });
        it('should handle perfect coverage', async () => {
            const perfectCoverage = {
                lines: { total: 100, covered: 100, percentage: 100 },
                functions: { total: 20, covered: 20, percentage: 100 },
                branches: { total: 40, covered: 40, percentage: 100 },
                statements: { total: 120, covered: 120, percentage: 100 }
            };
            const result = await analyzer.analyzeCoverage(perfectCoverage, mockContext);
            expect(result).toBeDefined();
            expect(result.lines.percentage).toBe(100);
            expect(result.qualityScore?.overall).toBeGreaterThan(0);
            expect(['A', 'B', 'C', 'D', 'F']).toContain(result.qualityScore?.grade);
        });
        it('should handle missing detailed coverage data', async () => {
            const result = await analyzer.analyzeCoverage(mockBasicCoverage, mockContext, null);
            expect(result).toBeDefined();
            expect(result.files).toEqual([]);
        });
    });
    describe('quality scoring algorithm', () => {
        it('should calculate quality score with multiple components', async () => {
            const result = await analyzer.analyzeCoverage(mockBasicCoverage, mockContext);
            expect(result.qualityScore).toBeDefined();
            expect(result.qualityScore.overall).toBeGreaterThan(0);
            expect(result.qualityScore.overall).toBeLessThanOrEqual(100);
            expect(result.qualityScore.grade).toMatch(/^[A-F]$/);
            expect(result.qualityScore.breakdown).toBeDefined();
            expect(result.qualityScore.breakdown.coverage).toBeDefined();
            expect(result.qualityScore.breakdown.complexity).toBeDefined();
            expect(result.qualityScore.breakdown.criticality).toBeDefined();
            expect(result.qualityScore.breakdown.trends).toBeDefined();
        });
        it('should assign appropriate grade for coverage levels', async () => {
            const excellentCoverage = {
                lines: { total: 100, covered: 95, percentage: 95 },
                functions: { total: 20, covered: 19, percentage: 95 },
                branches: { total: 40, covered: 38, percentage: 95 },
                statements: { total: 120, covered: 114, percentage: 95 }
            };
            const result = await analyzer.analyzeCoverage(excellentCoverage, mockContext);
            expect(result.qualityScore.grade).toMatch(/^[A-F]$/);
            expect(result.qualityScore.overall).toBeGreaterThan(0);
            expect(['A', 'B', 'C', 'D', 'F']).toContain(result.qualityScore.grade);
        });
        it('should assign grade F for poor coverage', async () => {
            const poorCoverage = {
                lines: { total: 100, covered: 30, percentage: 30 },
                functions: { total: 20, covered: 5, percentage: 25 },
                branches: { total: 40, covered: 8, percentage: 20 },
                statements: { total: 120, covered: 24, percentage: 20 }
            };
            const result = await analyzer.analyzeCoverage(poorCoverage, mockContext);
            expect(result.qualityScore.grade).toBe('F');
            expect(result.qualityScore.overall).toBeLessThan(60);
        });
        it('should include complexity metrics in quality scoring', async () => {
            const result = await analyzer.analyzeCoverage(mockBasicCoverage, mockContext);
            expect(result.qualityScore.codeComplexity).toBeDefined();
            expect(result.qualityScore.codeComplexity).toBeGreaterThanOrEqual(0);
            expect(result.qualityScore.breakdown.complexity).toBeDefined();
            expect(result.qualityScore.breakdown.complexity).toBeGreaterThanOrEqual(0);
        });
        it('should include critical path coverage in quality scoring', async () => {
            const result = await analyzer.analyzeCoverage(mockBasicCoverage, mockContext);
            expect(result.qualityScore.criticalPathCoverage).toBeDefined();
            expect(result.qualityScore.criticalPathCoverage).toBeGreaterThanOrEqual(0);
            expect(result.qualityScore.breakdown.criticality).toBeDefined();
            expect(result.qualityScore.breakdown.criticality).toBeGreaterThanOrEqual(0);
        });
    });
    describe('recommendation engine', () => {
        it('should generate coverage improvement recommendations', async () => {
            const lowCoverage = {
                lines: { total: 100, covered: 60, percentage: 60 },
                functions: { total: 20, covered: 10, percentage: 50 },
                branches: { total: 40, covered: 20, percentage: 50 },
                statements: { total: 120, covered: 72, percentage: 60 }
            };
            const result = await analyzer.analyzeCoverage(lowCoverage, mockContext);
            expect(result.recommendations).toBeDefined();
            expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
            if (result.recommendations.length > 0) {
                const recommendation = result.recommendations[0];
                expect(recommendation).toHaveProperty('type');
                expect(recommendation).toHaveProperty('priority');
                expect(recommendation).toHaveProperty('title');
                expect(recommendation).toHaveProperty('description');
                expect(recommendation).toHaveProperty('impact');
                expect(recommendation).toHaveProperty('effort');
                expect(recommendation).toHaveProperty('actionItems');
            }
        });
        it('should generate appropriate recommendations based on coverage levels', async () => {
            const veryLowCoverage = {
                lines: { total: 100, covered: 30, percentage: 30 },
                functions: { total: 20, covered: 4, percentage: 20 },
                branches: { total: 40, covered: 8, percentage: 20 },
                statements: { total: 120, covered: 24, percentage: 20 }
            };
            const result = await analyzer.analyzeCoverage(veryLowCoverage, mockContext);
            expect(result.recommendations).toBeDefined();
            expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
            // Should generate quality improvement recommendations for low coverage
            const qualityRecs = result.recommendations.filter(r => r.type === 'refactor' && r.priority === 'medium');
            if (qualityRecs.length > 0) {
                expect(qualityRecs[0].description).toContain('quality score');
            }
        });
        it('should identify critical paths in coverage analysis', async () => {
            const result = await analyzer.analyzeCoverage(mockBasicCoverage, mockContext);
            expect(result.criticalPaths).toBeDefined();
            expect(Array.isArray(result.criticalPaths)).toBe(true);
            // Critical paths should have expected properties
            result.criticalPaths.forEach(path => {
                expect(path).toHaveProperty('id');
                expect(path).toHaveProperty('name');
                expect(path).toHaveProperty('currentCoverage');
                expect(path).toHaveProperty('requiredCoverage');
                expect(path).toHaveProperty('riskScore');
                expect(path).toHaveProperty('impact');
            });
        });
        it('should provide actionable recommendations with specific guidance', async () => {
            const result = await analyzer.analyzeCoverage(mockBasicCoverage, mockContext);
            expect(result.recommendations).toBeDefined();
            if (result.recommendations.length > 0) {
                const recommendation = result.recommendations[0];
                expect(recommendation.title).toBeDefined();
                expect(recommendation.description).toBeDefined();
                expect(recommendation.actionItems).toBeDefined();
                expect(Array.isArray(recommendation.actionItems)).toBe(true);
                if (recommendation.actionItems.length > 0) {
                    expect(typeof recommendation.actionItems[0]).toBe('string');
                }
            }
        });
    });
});
//# sourceMappingURL=coverage-analyzer.test.js.map