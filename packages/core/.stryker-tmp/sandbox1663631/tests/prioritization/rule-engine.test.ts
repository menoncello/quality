import { describe, it, expect, beforeEach } from 'bun:test';
import { RuleEngine } from '../../src/prioritization/rule-engine';
import {
  Issue,
  IssuePrioritization,
  PrioritizationRule
} from '@dev-quality/types';

describe('RuleEngine', () => {
  let ruleEngine: RuleEngine;
  let mockIssue: Issue;
  let mockPrioritization: IssuePrioritization;

  beforeEach(() => {
    ruleEngine = new RuleEngine('highest-weight');

    mockIssue = {
      id: 'issue-1',
      type: 'error',
      toolName: 'eslint',
      filePath: '/src/security/auth.ts',
      lineNumber: 42,
      message: 'Security vulnerability detected',
      ruleId: 'security-vuln',
      fixable: true,
      suggestion: 'Fix the vulnerability',
      score: 8
    };

    mockPrioritization = {
      id: 'pri-1',
      issueId: 'issue-1',
      severity: 9,
      impact: 8,
      effort: 6,
      businessValue: 9,
      finalScore: 8.5,
      context: {
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
      },
      classification: {
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
      },
      triageSuggestion: {
        action: 'fix-now',
        priority: 9,
        estimatedEffort: 4,
        reasoning: 'Critical security issue requiring immediate attention',
        confidence: 0.9
      },
      scoringFactors: {
        severityWeight: 0.3,
        impactWeight: 0.25,
        effortWeight: 0.2,
        businessValueWeight: 0.25,
        contextMultiplier: 1.2,
        classificationBonus: 1.3,
        workflowAdjustment: 0.1
      },
      metadata: {
        processedAt: new Date(),
        algorithm: 'hybrid',
        modelVersion: '2.2.abc123',
        processingTime: 150,
        cacheHit: false
      }
    };
  });

  describe('applyRules', () => {
    it('should apply matching rules to issue prioritization', async () => {
      const securityRule: PrioritizationRule = {
        id: 'security-priority',
        name: 'Security Issues Priority',
        description: 'Boost priority for security-related issues',
        conditions: [
          {
            field: 'classification.category',
            operator: 'equals',
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
          createdBy: 'system',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [securityRule], [mockPrioritization]);

      expect(results).toHaveLength(1);
      expect(results[0].finalScore).toBeLessThanOrEqual(10); // Should be capped at 10
      expect(results[0].metadata).toBeDefined();
    });

    it('should not apply disabled rules', async () => {
      const disabledRule: PrioritizationRule = {
        id: 'disabled-rule',
        name: 'Disabled Rule',
        description: 'This rule should not be applied',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 5 }
          }
        ],
        weight: 1.0,
        enabled: false, // Disabled
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [disabledRule], [mockPrioritization]);

      expect(results[0].finalScore).toBe(mockPrioritization.finalScore); // Should be unchanged
    });

    it('should handle multiple matching rules', async () => {
      const rule1: PrioritizationRule = {
        id: 'rule-1',
        name: 'Rule 1',
        description: 'First rule',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 1 }
          }
        ],
        weight: 0.5,
        enabled: true,
        priority: 2,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const rule2: PrioritizationRule = {
        id: 'rule-2',
        name: 'Rule 2',
        description: 'Second rule',
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
            parameters: { adjustment: 1.5 }
          }
        ],
        weight: 0.8,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [rule1, rule2], [mockPrioritization]);

      expect(results[0].finalScore).toBeGreaterThan(mockPrioritization.finalScore);
      // Both rules should apply, with higher weight rule having more influence
    });

    it('should handle no matching rules', async () => {
      const nonMatchingRule: PrioritizationRule = {
        id: 'non-matching',
        name: 'Non Matching Rule',
        description: 'Should not match the issue',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'warning' // Issue is 'error', not 'warning'
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 10 }
          }
        ],
        weight: 1.0,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [nonMatchingRule], [mockPrioritization]);

      expect(results[0].finalScore).toBe(mockPrioritization.finalScore); // Should be unchanged
    });
  });

  describe('validateRule', () => {
    it('should validate a correct rule', async () => {
      const validRule: PrioritizationRule = {
        id: 'valid-rule',
        name: 'Valid Rule',
        description: 'A properly structured rule',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 2 }
          }
        ],
        weight: 0.7,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const result = await ruleEngine.validateRule(validRule);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      const invalidRule: Partial<PrioritizationRule> = {
        name: 'Invalid Rule',
        // Missing id
        description: 'Rule with missing fields',
        conditions: [],
        actions: [],
        weight: 0.5,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const result = await ruleEngine.validateRule(invalidRule as PrioritizationRule);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const missingIdError = result.errors.find(e => e.code === 'MISSING_ID');
      expect(missingIdError).toBeDefined();

      const missingConditionsError = result.errors.find(e => e.code === 'MISSING_CONDITIONS');
      expect(missingConditionsError).toBeDefined();

      const missingActionsError = result.errors.find(e => e.code === 'MISSING_ACTIONS');
      expect(missingActionsError).toBeDefined();
    });

    it('should validate condition operators', async () => {
      const invalidRule: PrioritizationRule = {
        id: 'invalid-operator',
        name: 'Invalid Operator Rule',
        description: 'Rule with invalid operator',
        conditions: [
          {
            field: 'type',
            operator: 'invalid-operator' as unknown,
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 1 }
          }
        ],
        weight: 0.5,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const result = await ruleEngine.validateRule(invalidRule);

      expect(result.valid).toBe(false);
      const operatorError = result.errors.find(e => e.code === 'INVALID_OPERATOR');
      expect(operatorError).toBeDefined();
    });

    it('should validate weight range', async () => {
      const invalidRule: PrioritizationRule = {
        id: 'invalid-weight',
        name: 'Invalid Weight Rule',
        description: 'Rule with invalid weight',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 1 }
          }
        ],
        weight: 1.5, // Invalid: should be 0-1
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const result = await ruleEngine.validateRule(invalidRule);

      expect(result.valid).toBe(false);
      const weightError = result.errors.find(e => e.code === 'INVALID_WEIGHT');
      expect(weightError).toBeDefined();
    });

    it('should generate warnings for potential issues', async () => {
      const warningRule: PrioritizationRule = {
        id: 'warning-rule',
        name: 'Warning Rule',
        description: 'Rule that generates warnings',
        conditions: Array(10).fill(null).map((_, index) => ({
          field: 'test',
          operator: 'equals' as const,
          value: `value-${index}`
        })),
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 1 }
          }
        ],
        weight: 0.05, // Very low weight
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const result = await ruleEngine.validateRule(warningRule);

      // Rule should be valid but generate warnings
      expect(result.warnings.length).toBeGreaterThan(0);

      const lowWeightWarning = result.warnings.find(w => w.code === 'LOW_WEIGHT');
      expect(lowWeightWarning).toBeDefined();

      const complexRuleWarning = result.warnings.find(w => w.code === 'COMPLEX_RULE');
      expect(complexRuleWarning).toBeDefined();
    });
  });

  describe('condition matching', () => {
    it('should match equals condition correctly', async () => {
      const rule: PrioritizationRule = {
        id: 'equals-rule',
        name: 'Equals Rule',
        description: 'Test equals operator',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 1 }
          }
        ],
        weight: 0.5,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [rule], [mockPrioritization]);

      expect(results[0].finalScore).toBeGreaterThan(mockPrioritization.finalScore);
    });

    it('should match contains condition correctly', async () => {
      const rule: PrioritizationRule = {
        id: 'contains-rule',
        name: 'Contains Rule',
        description: 'Test contains operator',
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
            parameters: { adjustment: 1 }
          }
        ],
        weight: 0.5,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [rule], [mockPrioritization]);

      expect(results[0].finalScore).toBeGreaterThan(mockPrioritization.finalScore);
    });

    it('should match numeric conditions correctly', async () => {
      const numericRule: PrioritizationRule = {
        id: 'numeric-rule',
        name: 'Numeric Rule',
        description: 'Test numeric operators',
        conditions: [
          {
            field: 'score',
            operator: 'gte',
            value: 5
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
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [numericRule], [mockPrioritization]);

      expect(results[0].finalScore).toBeGreaterThan(mockPrioritization.finalScore);
    });

    it('should handle regex conditions', async () => {
      const regexRule: PrioritizationRule = {
        id: 'regex-rule',
        name: 'Regex Rule',
        description: 'Test regex operator',
        conditions: [
          {
            field: 'filePath',
            operator: 'regex',
            value: '/src/.*\\.ts$',
            caseSensitive: false
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 0.3 }
          }
        ],
        weight: 0.5,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [regexRule], [mockPrioritization]);

      expect(results[0].finalScore).toBeGreaterThan(mockPrioritization.finalScore);
    });
  });

  describe('rule actions', () => {
    it('should apply adjustScore action correctly', async () => {
      const rule: PrioritizationRule = {
        id: 'adjust-score-rule',
        name: 'Adjust Score Rule',
        description: 'Test adjust score action',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: -2 }
          }
        ],
        weight: 0.5,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [rule], [mockPrioritization]);

      expect(results[0].finalScore).toBeLessThan(mockPrioritization.finalScore);
    });

    it('should apply setPriority action correctly', async () => {
      const rule: PrioritizationRule = {
        id: 'set-priority-rule',
        name: 'Set Priority Rule',
        description: 'Test set priority action',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'setPriority',
            parameters: { priority: 3 }
          }
        ],
        weight: 0.5,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [rule], [mockPrioritization]);

      expect(results[0].finalScore).toBe(3);
    });

    it('should apply skipTriage action correctly', async () => {
      const rule: PrioritizationRule = {
        id: 'skip-triage-rule',
        name: 'Skip Triage Rule',
        description: 'Test skip triage action',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'skipTriage',
            parameters: {}
          }
        ],
        weight: 0.5,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [rule], [mockPrioritization]);

      expect(results[0].triageSuggestion.action).toBe('ignore');
      expect(results[0].triageSuggestion.reasoning).toContain('Skipped by rule');
    });
  });

  describe('conflict resolution strategies', () => {
    it('should use highest-weight strategy by default', async () => {
      const ruleEngine = new RuleEngine('highest-weight');

      const lowWeightRule: PrioritizationRule = {
        id: 'low-weight',
        name: 'Low Weight Rule',
        description: 'Lower priority rule',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 1 }
          }
        ],
        weight: 0.3,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const highWeightRule: PrioritizationRule = {
        id: 'high-weight',
        name: 'High Weight Rule',
        description: 'Higher priority rule',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 2 }
          }
        ],
        weight: 0.8,
        enabled: true,
        priority: 2,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const results = await ruleEngine.applyRules([mockIssue], [lowWeightRule, highWeightRule], [mockPrioritization]);

      // High weight rule should have more influence, but capped at 10
      expect(results[0].finalScore).toBeLessThanOrEqual(10);
    });
  });

  describe('rule import/export', () => {
    it('should export rules to JSON', () => {
      const rule: PrioritizationRule = {
        id: 'export-test',
        name: 'Export Test Rule',
        description: 'Rule for testing export',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'error'
          }
        ],
        actions: [
          {
            type: 'adjustScore',
            parameters: { adjustment: 1 }
          }
        ],
        weight: 0.5,
        enabled: true,
        priority: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          version: '1.0.0',
          applicationCount: 0
        }
      };

      const exportedJson = ruleEngine.exportRules([rule]);

      expect(exportedJson).toBeDefined();
      expect(typeof exportedJson).toBe('string');

      const parsed = JSON.parse(exportedJson);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('export-test');
    });

    it('should import rules from JSON', async () => {
      const rulesJson = JSON.stringify([
        {
          id: 'import-test',
          name: 'Import Test Rule',
          description: 'Rule for testing import',
          conditions: [
            {
              field: 'type',
              operator: 'equals',
              value: 'error'
            }
          ],
          actions: [
            {
              type: 'adjustScore',
              parameters: { adjustment: 1 }
            }
          ],
          weight: 0.5,
          enabled: true,
          priority: 1,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'test-user',
            version: '1.0.0',
            applicationCount: 0
          }
        }
      ]);

      const importedRules = ruleEngine.importRules(rulesJson);

      expect(importedRules).toHaveLength(1);
      expect(importedRules[0].id).toBe('import-test');
    });

    it('should reject invalid JSON during import', () => {
      const invalidJson = '{ invalid json }';

      expect(() => {
        ruleEngine.importRules(invalidJson);
      }).toThrow('Failed to import rules');
    });
  });
});