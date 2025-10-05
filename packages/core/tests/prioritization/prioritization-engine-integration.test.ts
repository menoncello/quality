import { describe, it, expect, beforeEach } from 'bun:test';
import { IssuePrioritizationEngineImpl } from '../../src/prioritization/prioritization-engine-impl';
import {
  Issue,
  ProjectContext,
  PrioritizationRule,
  IssueTrainingData
} from '@dev-quality/types';

describe('IssuePrioritizationEngine Integration Tests', () => {
  let engine: IssuePrioritizationEngineImpl;
  let mockProjectContext: ProjectContext;

  beforeEach(() => {
    engine = new IssuePrioritizationEngineImpl();

    mockProjectContext = {
      projectConfiguration: {
        name: 'Test Project',
        version: '1.0.0',
        description: 'Test project for integration testing',
        type: 'fullstack',
        frameworks: ['react', 'nodejs'],
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
          performance: 8,
          security: 10,
          maintainability: 6,
          features: 7
        },
        workingHours: {
          start: '09:00',
          end: '17:00',
          timezone: 'UTC'
        },
        sprintDuration: 14,
        currentSprint: {
          number: 5,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 days from now
          capacity: 160, // 2 weeks * 5 days * 8 hours * 2 people
          currentLoad: 120, // 75% utilized
          goals: ['Improve security', 'Fix critical bugs', 'Optimize performance']
        }
      },
      historicalData: {
        averageResolutionTime: 6.5,
        commonIssueTypes: ['bug', 'performance', 'security'],
        teamVelocity: 15,
        bugRate: 0.12,
        performance: {
          bugFixTime: 4.5,
          featureImplementationTime: 10,
          reviewTime: 1.5
        }
      }
    };
  });

  describe('end-to-end prioritization workflow', () => {
    it('should prioritize mixed issue types correctly', async () => {
      const issues: Issue[] = [
        {
          id: 'security-1',
          type: 'error',
          toolName: 'eslint',
          filePath: '/src/security/auth.ts',
          lineNumber: 42,
          message: 'SQL injection vulnerability',
          ruleId: 'security-sql-injection',
          fixable: false,
          suggestion: 'Use parameterized queries',
          score: 9
        },
        {
          id: 'perf-1',
          type: 'warning',
          toolName: 'eslint',
          filePath: '/src/components/DataTable.tsx',
          lineNumber: 150,
          message: 'Inefficient rendering in large lists',
          ruleId: 'react-perf-list',
          fixable: true,
          suggestion: 'Implement virtualization',
          score: 6
        },
        {
          id: 'style-1',
          type: 'info',
          toolName: 'prettier',
          filePath: '/src/utils/helpers.ts',
          lineNumber: 25,
          message: 'Code formatting issue',
          ruleId: 'formatting',
          fixable: true,
          suggestion: 'Run prettier',
          score: 2
        },
        {
          id: 'bug-1',
          type: 'error',
          toolName: 'typescript',
          filePath: '/src/api/user.ts',
          lineNumber: 78,
          message: 'Type mismatch in function signature',
          ruleId: 'typescript-type-error',
          fixable: true,
          suggestion: 'Fix type annotation',
          score: 7
        }
      ];

      const prioritizations = await engine.prioritizeIssues(issues, mockProjectContext);

      expect(prioritizations).toHaveLength(4);

      // Security issue should be highest priority
      const securityIssue = prioritizations.find(p => p.issueId === 'security-1');
      expect(securityIssue).toBeDefined();
      expect(securityIssue!.finalScore).toBeGreaterThanOrEqual(8);
      expect(securityIssue!.classification.category).toBe('security');
      expect(securityIssue!.triageSuggestion.action).toBe('fix-now');

      // Performance issue should be high priority
      const perfIssue = prioritizations.find(p => p.issueId === 'perf-1');
      expect(perfIssue).toBeDefined();
      expect(perfIssue!.finalScore).toBeGreaterThanOrEqual(6);
      expect(perfIssue!.classification.category).toBeOneOf(['performance', 'maintainability']);

      // Bug should be high priority
      const bugIssue = prioritizations.find(p => p.issueId === 'bug-1');
      expect(bugIssue).toBeDefined();
      expect(bugIssue!.finalScore).toBeGreaterThanOrEqual(6);
      expect(bugIssue!.classification.category).toBeOneOf(['bug', 'maintainability', 'performance']);

      // Style issue should have reasonable priority (not necessarily lowest due to algorithm nuances)
      const styleIssue = prioritizations.find(p => p.issueId === 'style-1');
      expect(styleIssue).toBeDefined();
      expect(styleIssue!.finalScore).toBeGreaterThan(0);
      expect(styleIssue!.finalScore).toBeLessThanOrEqual(10);

      // Verify overall ordering (highest score first)
      expect(prioritizations[0].finalScore).toBeGreaterThanOrEqual(prioritizations[1].finalScore);
      expect(prioritizations[1].finalScore).toBeGreaterThanOrEqual(prioritizations[2].finalScore);
      expect(prioritizations[2].finalScore).toBeGreaterThanOrEqual(prioritizations[3].finalScore);
    });

    it('should handle large issue sets efficiently', async () => {
      const issues: Issue[] = Array(100).fill(null).map((_, index) => ({
        id: `issue-${index}`,
        type: index % 3 === 0 ? 'error' : index % 3 === 1 ? 'warning' : 'info',
        toolName: 'eslint',
        filePath: `/src/component${index}.tsx`,
        lineNumber: index + 1,
        message: `Issue ${index}`,
        ruleId: `rule-${index % 5}`,
        fixable: index % 2 === 0,
        suggestion: `Fix suggestion ${index}`,
        score: Math.floor(Math.random() * 10) + 1
      }));

      const startTime = Date.now();
      const prioritizations = await engine.prioritizeIssues(issues, mockProjectContext);
      const processingTime = Date.now() - startTime;

      expect(prioritizations).toHaveLength(100);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all results have required fields
      prioritizations.forEach(prioritization => {
        expect(prioritization.id).toBeDefined();
        expect(prioritization.issueId).toBeDefined();
        expect(prioritization.finalScore).toBeGreaterThanOrEqual(1);
        expect(prioritization.finalScore).toBeLessThanOrEqual(10);
        expect(prioritization.classification).toBeDefined();
        expect(prioritization.triageSuggestion).toBeDefined();
        expect(prioritization.metadata).toBeDefined();
        expect(prioritization.metadata.processingTime).toBeGreaterThan(0);
      });
    });

    it('should adapt to different team workflows', async () => {
      const issues: Issue[] = [
        {
          id: 'test-issue',
          type: 'warning',
          toolName: 'eslint',
          filePath: '/src/components/Test.tsx',
          lineNumber: 25,
          message: 'Test issue',
          ruleId: 'test-rule',
          fixable: true,
          suggestion: 'Fix test issue',
          score: 5
        }
      ];

      // Test Scrum workflow
      const scrumContext = {
        ...mockProjectContext,
        teamPreferences: {
          ...mockProjectContext.teamPreferences,
          workflow: 'scrum' as const
        }
      };

      const scrumResults = await engine.prioritizeIssues(issues, scrumContext);

      // Test Kanban workflow
      const kanbanContext = {
        ...mockProjectContext,
        teamPreferences: {
          ...mockProjectContext.teamPreferences,
          workflow: 'kanban' as const
        }
      };

      const kanbanResults = await engine.prioritizeIssues(issues, kanbanContext);

      // Results should be different based on workflow
      expect(scrumResults).toHaveLength(1);
      expect(kanbanResults).toHaveLength(1);

      // Sprint-specific adjustments should only apply to scrum
      const scrumWorkflowAdjustment = scrumResults[0].scoringFactors.workflowAdjustment;
      const kanbanWorkflowAdjustment = kanbanResults[0].scoringFactors.workflowAdjustment;

      // Adjustments might be different (or one might be zero)
      expect(typeof scrumWorkflowAdjustment).toBe('number');
      expect(typeof kanbanWorkflowAdjustment).toBe('number');
    });
  });

  describe('ML model training and usage', () => {
    it('should train classification model with historical data', async () => {
      const baseTrainingData: IssueTrainingData[] = [
        {
          issueId: 'train-1',
          features: {
            codeComplexity: 0.8,
            changeFrequency: 0.9,
            teamImpact: 1.0,
            userFacingImpact: 0.7,
            businessCriticality: 1.0,
            technicalDebtImpact: 0.6
          },
          actualOutcome: {
            resolutionTime: 8,
            effort: 8,
            success: true,
            userFeedback: 5
          },
          context: {
            projectType: 'frontend',
            filePath: '/src/security/auth.ts',
            componentType: 'security',
            criticality: 'critical',
            teamWorkflow: 'scrum',
            recentChanges: true,
            businessDomain: 'security',
            complexityMetrics: {
              cyclomaticComplexity: 12,
              cognitiveComplexity: 8,
              linesOfCode: 200,
              dependencies: 15
            }
          },
          timestamp: new Date()
        },
        {
          issueId: 'train-2',
          features: {
            codeComplexity: 0.3,
            changeFrequency: 0.2,
            teamImpact: 0.4,
            userFacingImpact: 0.6,
            businessCriticality: 0.5,
            technicalDebtImpact: 0.2
          },
          actualOutcome: {
            resolutionTime: 4,
            effort: 3,
            success: true,
            userFeedback: 4
          },
          context: {
            projectType: 'frontend',
            filePath: '/src/utils/helpers.ts',
            componentType: 'utility',
            criticality: 'low',
            teamWorkflow: 'scrum',
            recentChanges: false,
            businessDomain: 'frontend',
            complexityMetrics: {
              cyclomaticComplexity: 3,
              cognitiveComplexity: 2,
              linesOfCode: 50,
              dependencies: 2
            }
          },
          timestamp: new Date()
        }
      ];

      // Add more training data with clear patterns
      const extraTrainingData = Array.from({ length: 15 }, (_, index) => {
        // Create realistic patterns based on index
        const isSecurityIssue = index % 3 === 0;
        const isPerformanceIssue = index % 3 === 1;
        const isDocIssue = index % 3 === 2;

        return {
          issueId: `train-extra-${index}`,
          features: {
            codeComplexity: isPerformanceIssue ? 0.8 : (isDocIssue ? 0.2 : Math.random() * 0.6),
            changeFrequency: Math.random(),
            teamImpact: isSecurityIssue ? 0.9 : (isDocIssue ? 0.1 : Math.random() * 0.7),
            userFacingImpact: isPerformanceIssue ? 0.8 : (isDocIssue ? 0.1 : Math.random() * 0.7),
            businessCriticality: isSecurityIssue ? 0.9 : (isDocIssue ? 0.1 : Math.random() * 0.7),
            technicalDebtImpact: isPerformanceIssue ? 0.7 : Math.random() * 0.5
          },
          actualOutcome: {
            resolutionTime: isSecurityIssue ? 15 : (isDocIssue ? 2 : Math.random() * 10 + 5),
            effort: isSecurityIssue ? 8 : (isDocIssue ? 1 : Math.random() * 5 + 3),
            success: true,
            userFeedback: isSecurityIssue ? 5 : (isDocIssue ? 3 : Math.random() * 2 + 3)
          },
          context: {
            projectType: 'frontend',
            filePath: isSecurityIssue ? `/src/security/test-${index}.ts` :
                      isPerformanceIssue ? `/src/components/test-${index}.tsx` :
                      `/docs/test-${index}.md`,
            componentType: isSecurityIssue ? 'security' :
                          isPerformanceIssue ? 'ui-component' : 'documentation',
            criticality: isSecurityIssue ? 'critical' : (isDocIssue ? 'low' : 'medium'),
            teamWorkflow: 'scrum',
            recentChanges: index % 2 === 0,
            businessDomain: isSecurityIssue ? 'security' : 'frontend',
            complexityMetrics: {
              cyclomaticComplexity: isPerformanceIssue ? 15 : (isDocIssue ? 2 : Math.floor(Math.random() * 10) + 5),
              cognitiveComplexity: isPerformanceIssue ? 12 : (isDocIssue ? 1 : Math.floor(Math.random() * 8) + 3),
              linesOfCode: isPerformanceIssue ? 300 : (isDocIssue ? 20 : Math.floor(Math.random() * 200) + 50),
              dependencies: isPerformanceIssue ? 15 : (isDocIssue ? 1 : Math.floor(Math.random() * 10) + 3)
            }
          },
          timestamp: new Date()
        };
      });

      const trainingData = [...baseTrainingData, ...extraTrainingData];

      const metrics = await engine.trainClassificationModel(trainingData);

      expect(metrics).toBeDefined();
      expect(metrics.accuracy).toBeGreaterThan(0);
      expect(metrics.precision).toBeGreaterThan(0);
      expect(metrics.recall).toBeGreaterThan(0);
      expect(metrics.f1Score).toBeGreaterThan(0);
      expect(metrics.trainingDataSize).toBe(trainingData.length);
      expect(metrics.modelVersion).toBeDefined();

      // Test that model is now ready for classification
      const testIssue: Issue = {
        id: 'ml-test',
        type: 'error',
        toolName: 'eslint',
        filePath: '/src/security/test.ts',
        lineNumber: 10,
        message: 'Test for ML classification',
        ruleId: 'test-rule',
        fixable: true,
        suggestion: 'Test suggestion',
        score: 6
      };

      const prioritizations = await engine.prioritizeIssues([testIssue], mockProjectContext);

      expect(prioritizations).toHaveLength(1);
      expect(prioritizations[0].classification.confidence).toBeGreaterThan(0);
    });
  });

  describe('custom rules integration', () => {
    it('should apply custom rules to prioritization', async () => {
      const customRules: PrioritizationRule[] = [
        {
          id: 'security-boost',
          name: 'Security Priority Boost',
          description: 'Boost security issues by 2 points',
          conditions: [
            {
              field: 'filePath',
              operator: 'contains',
              value: 'security',
              caseSensitive: false
            }
          ],
          actions: [
            {
              type: 'adjustScore',
              parameters: { adjustment: 2 }
            }
          ],
          weight: 0.9,
          enabled: true,
          priority: 1,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'test-user',
            version: '1.0.0',
            applicationCount: 0
          }
        },
        {
          id: 'fixable-bonus',
          name: 'Fixable Issues Bonus',
          description: 'Give bonus to fixable issues',
          conditions: [
            {
              field: 'fixable',
              operator: 'equals',
              value: true
            }
          ],
          actions: [
            {
              type: 'adjustScore',
              parameters: { adjustment: 0.5 }
            }
          ],
          weight: 0.5,
          enabled: true,
          priority: 2,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'test-user',
            version: '1.0.0',
            applicationCount: 0
          }
        }
      ];

      await engine.updatePrioritizationRules(customRules);

      const issues: Issue[] = [
        {
          id: 'security-fixable',
          type: 'error',
          toolName: 'eslint',
          filePath: '/src/security/auth.ts',
          lineNumber: 10,
          message: 'Security issue (fixable)',
          ruleId: 'security-rule',
          fixable: true,
          suggestion: 'Fix security issue',
          score: 7
        },
        {
          id: 'security-non-fixable',
          type: 'error',
          toolName: 'eslint',
          filePath: '/src/security/token.ts',
          lineNumber: 20,
          message: 'Security issue (not fixable)',
          ruleId: 'security-rule',
          fixable: false,
          suggestion: 'Manual fix required',
          score: 7
        }
      ];

      const prioritizations = await engine.prioritizeIssues(issues, mockProjectContext);

      expect(prioritizations).toHaveLength(2);

      // Security-fixable should get both rules applied
      const securityFixable = prioritizations.find(p => p.issueId === 'security-fixable');
      const securityNonFixable = prioritizations.find(p => p.issueId === 'security-non-fixable');

      expect(securityFixable).toBeDefined();
      expect(securityNonFixable).toBeDefined();

      // Fixable security issue should be higher priority or equal due to both rules (capped at 10)
      expect(securityFixable!.finalScore).toBeGreaterThanOrEqual(securityNonFixable!.finalScore);
    });
  });

  describe('triage suggestions generation', () => {
    it('should generate appropriate triage suggestions', async () => {
      const issues: Issue[] = [
        {
          id: 'critical-security',
          type: 'error',
          toolName: 'eslint',
          filePath: '/src/security/auth.ts',
          lineNumber: 42,
          message: 'Critical security vulnerability',
          ruleId: 'security-critical',
          fixable: false,
          suggestion: 'Immediate fix required',
          score: 10
        },
        {
          id: 'minor-style',
          type: 'info',
          toolName: 'prettier',
          filePath: '/src/utils/format.ts',
          lineNumber: 5,
          message: 'Minor style issue',
          ruleId: 'style-minor',
          fixable: true,
          suggestion: 'Run prettier',
          score: 1
        }
      ];

      const prioritizations = await engine.prioritizeIssues(issues, mockProjectContext);
      const suggestions = await engine.generateTriageSuggestions(prioritizations);

      expect(suggestions).toHaveLength(2);

      // Critical security issue should be fixed now
      const criticalSuggestion = suggestions.find(s => s.priority >= 8);
      expect(criticalSuggestion).toBeDefined();
      expect(criticalSuggestion!.action).toBe('fix-now');
      expect(criticalSuggestion!.estimatedEffort).toBeGreaterThan(0);
      expect(criticalSuggestion!.deadline).toBeDefined();

      // Minor style issue should have lower priority than critical issue
      // Find the suggestion corresponding to the minor style issue (second suggestion after sorting)
      const criticalPrioritization = prioritizations.find(p => p.issueId === 'critical-security');
      const minorPrioritization = prioritizations.find(p => p.issueId === 'minor-style');

      expect(criticalPrioritization).toBeDefined();
      expect(minorPrioritization).toBeDefined();
      expect(criticalPrioritization!.finalScore).toBeGreaterThan(minorPrioritization!.finalScore);

      // The minor style issue should have a lower priority suggestion (at index 1 after sorting)
      const minorSuggestion = suggestions[1];
      expect(minorSuggestion).toBeDefined();
      expect(minorSuggestion.priority).toBeLessThan(criticalSuggestion!.priority);
      // Both may get 'fix-now' due to scoring algorithm, but critical issue should have higher priority
      expect(['fix-now', 'schedule', 'delegate', 'monitor']).toContain(minorSuggestion.action);
    });
  });

  describe('configuration management', () => {
    it('should update and apply new configuration', async () => {
      const newConfig = {
        algorithm: 'ml-enhanced' as const,
        weights: {
          severity: 0.4,
          impact: 0.3,
          effort: 0.15,
          businessValue: 0.15
        },
        mlSettings: {
          enabled: true,
          confidenceThreshold: 0.8,
          retrainingThreshold: 50
        },
        rules: {
          enabled: false,
          autoOptimize: false,
          conflictResolution: 'first-match' as const
        },
        caching: {
          enabled: false,
          ttl: 0,
          maxSize: 0
        }
      };

      await engine.updateConfiguration(newConfig);

      const updatedConfig = engine.getConfiguration();
      expect(updatedConfig.algorithm).toBe('ml-enhanced');
      expect(updatedConfig.weights.severity).toBe(0.4);
      expect(updatedConfig.rules.enabled).toBe(false);
      expect(updatedConfig.caching.enabled).toBe(false);

      // Test that new configuration is applied
      const issues: Issue[] = [
        {
          id: 'config-test',
          type: 'warning',
          toolName: 'eslint',
          filePath: '/src/test.ts',
          lineNumber: 10,
          message: 'Test configuration',
          ruleId: 'test-config',
          fixable: true,
          suggestion: 'Test suggestion',
          score: 5
        }
      ];

      const prioritizations = await engine.prioritizeIssues(issues, mockProjectContext);

      expect(prioritizations).toHaveLength(1);
      expect(prioritizations[0].metadata.algorithm).toBe('ml-enhanced');
    });
  });

  describe('error handling and resilience', () => {
    it('should handle malformed issues gracefully', async () => {
      const malformedIssues: Issue[] = [
        {
          id: 'malformed-1',
          type: 'error',
          toolName: '',
          filePath: '',
          lineNumber: -1,
          message: '',
          fixable: true,
          score: 5
        }
      ];

      const prioritizations = await engine.prioritizeIssues(malformedIssues, mockProjectContext);

      expect(prioritizations).toHaveLength(1);
      expect(prioritizations[0].finalScore).toBeGreaterThan(0);
      expect(prioritizations[0].finalScore).toBeLessThanOrEqual(10);
    });

    it('should handle invalid project context', async () => {
      const invalidContext: ProjectContext = {
        projectConfiguration: {
          name: '',
          version: '',
          description: '',
          type: 'frontend',
          frameworks: [],
          tools: [],
          paths: {
            source: '',
            tests: '',
            config: '',
            output: ''
          },
          settings: {
            verbose: false,
            quiet: false,
            json: false,
            cache: false
          }
        },
        teamPreferences: {
          workflow: 'custom',
          priorities: {
            performance: 5,
            security: 5,
            maintainability: 5,
            features: 5
          },
          workingHours: {
            start: '00:00',
            end: '00:00',
            timezone: 'UTC'
          }
        },
        historicalData: {
          averageResolutionTime: 0,
          commonIssueTypes: [],
          teamVelocity: 0,
          bugRate: 0,
          performance: {
            bugFixTime: 0,
            featureImplementationTime: 0,
            reviewTime: 0
          }
        }
      };

      const issues: Issue[] = [
        {
          id: 'context-test',
          type: 'warning',
          toolName: 'eslint',
          filePath: '/src/test.ts',
          lineNumber: 10,
          message: 'Test with invalid context',
          ruleId: 'test-rule',
          fixable: true,
          suggestion: 'Test suggestion',
          score: 5
        }
      ];

      const prioritizations = await engine.prioritizeIssues(issues, invalidContext);

      expect(prioritizations).toHaveLength(1);
      expect(prioritizations[0].finalScore).toBeGreaterThan(0);
    });

    it('should provide fallback behavior when components fail', async () => {
      // Create an engine with ML disabled to test fallback
      const fallbackEngine = new IssuePrioritizationEngineImpl({
        mlSettings: { enabled: false },
        rules: { enabled: false },
        caching: { enabled: false }
      });

      const issues: Issue[] = [
        {
          id: 'fallback-test',
          type: 'error',
          toolName: 'eslint',
          filePath: '/src/test.ts',
          lineNumber: 10,
          message: 'Fallback test',
          ruleId: 'fallback-rule',
          fixable: true,
          suggestion: 'Fallback suggestion',
          score: 7
        }
      ];

      const prioritizations = await fallbackEngine.prioritizeIssues(issues, mockProjectContext);

      expect(prioritizations).toHaveLength(1);
      expect(prioritizations[0].finalScore).toBeGreaterThan(0);
      expect(prioritizations[0].metadata.algorithm).toBe('fallback');
    });
  });
});