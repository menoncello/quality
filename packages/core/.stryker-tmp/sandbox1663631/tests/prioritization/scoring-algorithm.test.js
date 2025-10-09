import { describe, it, expect, beforeEach } from 'bun:test';
import { ScoringAlgorithm } from '../../src/prioritization/scoring-algorithm';
describe('ScoringAlgorithm', () => {
    let scoringAlgorithm;
    let mockConfig;
    let mockProjectContext;
    beforeEach(() => {
        mockConfig = {
            algorithm: 'weighted',
            weights: {
                severity: 0.3,
                impact: 0.25,
                effort: 0.2,
                businessValue: 0.25
            },
            mlSettings: {
                enabled: true,
                confidenceThreshold: 0.7,
                retrainingThreshold: 100
            },
            rules: {
                enabled: true,
                autoOptimize: false,
                conflictResolution: 'highest-weight'
            },
            caching: {
                enabled: true,
                ttl: 3600,
                maxSize: 100
            }
        };
        mockProjectContext = {
            projectConfiguration: {
                name: 'Test Project',
                version: '1.0.0',
                description: 'Test project',
                type: 'frontend',
                frameworks: ['react'],
                tools: [],
                paths: {
                    source: 'src',
                    tests: 'tests',
                    config: 'config',
                    output: 'dist'
                },
                settings: {
                    verbose: false,
                    quiet: false,
                    json: false,
                    cache: true
                }
            },
            teamPreferences: {
                workflow: 'scrum',
                priorities: {
                    performance: 7,
                    security: 9,
                    maintainability: 6,
                    features: 8
                },
                workingHours: {
                    start: '09:00',
                    end: '17:00',
                    timezone: 'UTC'
                },
                sprintDuration: 14
            },
            historicalData: {
                averageResolutionTime: 8,
                commonIssueTypes: ['bug', 'performance'],
                teamVelocity: 12,
                bugRate: 0.15,
                performance: {
                    bugFixTime: 6,
                    featureImplementationTime: 12,
                    reviewTime: 2
                }
            }
        };
        scoringAlgorithm = new ScoringAlgorithm(mockConfig);
    });
    describe('calculateScore', () => {
        it('should calculate high score for critical security issue', async () => {
            const issue = {
                id: 'issue-1',
                type: 'error',
                toolName: 'eslint',
                filePath: '/src/security/auth.ts',
                lineNumber: 42,
                message: 'Security vulnerability detected',
                ruleId: 'security-vuln',
                fixable: true,
                suggestion: 'Fix the vulnerability',
                score: 5
            };
            const context = {
                projectType: 'frontend',
                filePath: '/src/security/auth.ts',
                componentType: 'security',
                criticality: 'critical',
                teamWorkflow: 'scrum',
                recentChanges: true,
                businessDomain: 'security',
                complexityMetrics: {
                    cyclomaticComplexity: 8,
                    cognitiveComplexity: 6,
                    linesOfCode: 150,
                    dependencies: 12
                }
            };
            const classification = {
                category: 'security',
                severity: 'critical',
                confidence: 0.9,
                features: {
                    codeComplexity: 0.6,
                    changeFrequency: 1.0,
                    teamImpact: 1.0,
                    userFacingImpact: 0.7,
                    businessCriticality: 1.0,
                    technicalDebtImpact: 0.4
                }
            };
            const result = await scoringAlgorithm.calculateScore(issue, context, classification, mockProjectContext);
            expect(result.finalScore).toBeGreaterThanOrEqual(8);
            expect(result.triageSuggestion.action).toBe('fix-now');
            expect(result.triageSuggestion.priority).toBeGreaterThanOrEqual(8);
        });
        it('should calculate low score for minor documentation issue', async () => {
            const issue = {
                id: 'issue-2',
                type: 'info',
                toolName: 'eslint',
                filePath: '/docs/readme.md',
                lineNumber: 10,
                message: 'Documentation improvement suggested',
                ruleId: 'docs-style',
                fixable: true,
                suggestion: 'Improve documentation',
                score: 2
            };
            const context = {
                projectType: 'frontend',
                filePath: '/docs/readme.md',
                componentType: 'documentation',
                criticality: 'low',
                teamWorkflow: 'scrum',
                recentChanges: false,
                businessDomain: 'documentation',
                complexityMetrics: {
                    cyclomaticComplexity: 1,
                    cognitiveComplexity: 1,
                    linesOfCode: 50,
                    dependencies: 0
                }
            };
            const classification = {
                category: 'documentation',
                severity: 'low',
                confidence: 0.8,
                features: {
                    codeComplexity: 0.1,
                    changeFrequency: 0.0,
                    teamImpact: 0.2,
                    userFacingImpact: 0.4,
                    businessCriticality: 0.2,
                    technicalDebtImpact: 0.1
                }
            };
            const result = await scoringAlgorithm.calculateScore(issue, context, classification, mockProjectContext);
            expect(result.finalScore).toBeLessThan(5);
            expect(result.triageSuggestion.action).toBeOneOf(['monitor', 'ignore']);
        });
        it('should generate appropriate triage suggestions', async () => {
            const issue = {
                id: 'issue-3',
                type: 'warning',
                toolName: 'eslint',
                filePath: '/src/components/Button.tsx',
                lineNumber: 25,
                message: 'Performance optimization available',
                ruleId: 'perf-optimization',
                fixable: true,
                suggestion: 'Optimize component rendering',
                score: 4
            };
            const context = {
                projectType: 'frontend',
                filePath: '/src/components/Button.tsx',
                componentType: 'ui-component',
                criticality: 'medium',
                teamWorkflow: 'scrum',
                recentChanges: false,
                businessDomain: 'frontend',
                complexityMetrics: {
                    cyclomaticComplexity: 5,
                    cognitiveComplexity: 4,
                    linesOfCode: 80,
                    dependencies: 6
                }
            };
            const classification = {
                category: 'performance',
                severity: 'medium',
                confidence: 0.7,
                features: {
                    codeComplexity: 0.4,
                    changeFrequency: 0.2,
                    teamImpact: 0.6,
                    userFacingImpact: 0.8,
                    businessCriticality: 0.6,
                    technicalDebtImpact: 0.3
                }
            };
            const result = await scoringAlgorithm.calculateScore(issue, context, classification, mockProjectContext);
            expect(result.triageSuggestion).toBeDefined();
            expect(result.triageSuggestion.priority).toBeGreaterThan(0);
            expect(result.triageSuggestion.priority).toBeLessThanOrEqual(10);
            expect(result.triageSuggestion.estimatedEffort).toBeGreaterThan(0);
            expect(result.triageSuggestion.confidence).toBeGreaterThan(0);
            expect(result.triageSuggestion.reasoning).toBeDefined();
            expect(result.triageSuggestion.reasoning.length).toBeGreaterThan(0);
        });
    });
    describe('severity score calculation', () => {
        it('should give higher scores for more severe issues', async () => {
            const baseIssue = {
                id: 'issue-base',
                type: 'error',
                toolName: 'test',
                filePath: '/src/test.ts',
                lineNumber: 1,
                message: 'Test issue',
                fixable: true,
                score: 5
            };
            const baseContext = {
                projectType: 'frontend',
                filePath: '/src/test.ts',
                componentType: 'component',
                criticality: 'medium',
                teamWorkflow: 'scrum',
                recentChanges: false,
                complexityMetrics: {
                    cyclomaticComplexity: 3,
                    cognitiveComplexity: 2,
                    linesOfCode: 50,
                    dependencies: 3
                }
            };
            const criticalClassification = {
                category: 'security',
                severity: 'critical',
                confidence: 0.9,
                features: {
                    codeComplexity: 0.3,
                    changeFrequency: 0.2,
                    teamImpact: 0.5,
                    userFacingImpact: 0.5,
                    businessCriticality: 0.5,
                    technicalDebtImpact: 0.2
                }
            };
            const lowClassification = {
                category: 'documentation',
                severity: 'low',
                confidence: 0.9,
                features: {
                    codeComplexity: 0.1,
                    changeFrequency: 0.1,
                    teamImpact: 0.2,
                    userFacingImpact: 0.2,
                    businessCriticality: 0.1,
                    technicalDebtImpact: 0.1
                }
            };
            const criticalResult = await scoringAlgorithm.calculateScore(baseIssue, baseContext, criticalClassification, mockProjectContext);
            const lowResult = await scoringAlgorithm.calculateScore(baseIssue, baseContext, lowClassification, mockProjectContext);
            expect(criticalResult.finalScore).toBeGreaterThan(lowResult.finalScore);
        });
    });
    describe('configuration updates', () => {
        it('should update configuration correctly', () => {
            const newConfig = {
                weights: {
                    severity: 0.5,
                    impact: 0.2,
                    effort: 0.15,
                    businessValue: 0.15
                }
            };
            scoringAlgorithm.updateConfiguration(newConfig);
            const updatedConfig = scoringAlgorithm.getConfiguration();
            expect(updatedConfig.weights.severity).toBe(0.5);
            expect(updatedConfig.weights.impact).toBe(0.2);
        });
        it('should maintain configuration immutability', () => {
            const originalConfig = scoringAlgorithm.getConfiguration();
            const originalSeverity = originalConfig.weights.severity;
            scoringAlgorithm.updateConfiguration({ weights: { severity: 0.99 } });
            // Original config should not be mutated
            expect(originalConfig.weights.severity).toBe(originalSeverity);
            // But the updated config should reflect the change
            expect(scoringAlgorithm.getConfiguration().weights.severity).toBe(0.99);
        });
    });
    describe('edge cases', () => {
        it('should handle fixable vs non-fixable issues correctly', async () => {
            const baseIssue = {
                id: 'issue-fixable',
                type: 'warning',
                toolName: 'test',
                filePath: '/src/test.ts',
                lineNumber: 1,
                message: 'Test issue',
                fixable: true,
                score: 5
            };
            const nonFixableIssue = {
                ...baseIssue,
                id: 'issue-non-fixable',
                fixable: false
            };
            const context = {
                projectType: 'frontend',
                filePath: '/src/test.ts',
                componentType: 'component',
                criticality: 'medium',
                teamWorkflow: 'scrum',
                recentChanges: false,
                complexityMetrics: {
                    cyclomaticComplexity: 3,
                    cognitiveComplexity: 2,
                    linesOfCode: 50,
                    dependencies: 3
                }
            };
            const classification = {
                category: 'maintainability',
                severity: 'medium',
                confidence: 0.7,
                features: {
                    codeComplexity: 0.3,
                    changeFrequency: 0.2,
                    teamImpact: 0.5,
                    userFacingImpact: 0.4,
                    businessCriticality: 0.4,
                    technicalDebtImpact: 0.3
                }
            };
            const fixableResult = await scoringAlgorithm.calculateScore(baseIssue, context, classification, mockProjectContext);
            const nonFixableResult = await scoringAlgorithm.calculateScore(nonFixableIssue, context, classification, mockProjectContext);
            expect(fixableResult.finalScore).toBeGreaterThan(nonFixableResult.finalScore - 1); // Allow small variance
            expect(fixableResult.triageSuggestion.estimatedEffort).toBeLessThanOrEqual(nonFixableResult.triageSuggestion.estimatedEffort);
        });
        it('should handle extreme complexity values', async () => {
            const issue = {
                id: 'issue-complex',
                type: 'error',
                toolName: 'test',
                filePath: '/src/complex.ts',
                lineNumber: 1,
                message: 'Complex issue',
                fixable: false,
                score: 8
            };
            const context = {
                projectType: 'frontend',
                filePath: '/src/complex.ts',
                componentType: 'component',
                criticality: 'high',
                teamWorkflow: 'scrum',
                recentChanges: false,
                complexityMetrics: {
                    cyclomaticComplexity: 50, // Very high complexity
                    cognitiveComplexity: 30,
                    linesOfCode: 2000,
                    dependencies: 100
                }
            };
            const classification = {
                category: 'maintainability',
                severity: 'high',
                confidence: 0.8,
                features: {
                    codeComplexity: 1.0,
                    changeFrequency: 0.1,
                    teamImpact: 0.7,
                    userFacingImpact: 0.6,
                    businessCriticality: 0.7,
                    technicalDebtImpact: 0.9
                }
            };
            const result = await scoringAlgorithm.calculateScore(issue, context, classification, mockProjectContext);
            expect(result.finalScore).toBeGreaterThan(0);
            expect(result.finalScore).toBeLessThanOrEqual(10);
            expect(result.triageSuggestion.estimatedEffort).toBeGreaterThan(5); // Should be high effort
        });
    });
});
//# sourceMappingURL=scoring-algorithm.test.js.map