import { describe, it, expect, beforeEach } from 'bun:test';
import { IssueClassifier } from '../../src/prioritization/issue-classifier';
import {
  Issue,
  IssueContext,
  IssueClassification,
  IssueTrainingData,
  IssueResolutionOutcome,
  ModelMetrics
} from '@dev-quality/types';

describe('IssueClassifier', () => {
  let classifier: IssueClassifier;
  let mockIssue: Issue;
  let mockContext: IssueContext;

  beforeEach(() => {
    classifier = new IssueClassifier();

    mockIssue = {
      id: 'issue-1',
      type: 'error',
      toolName: 'eslint',
      filePath: '/src/components/UserProfile.tsx',
      lineNumber: 42,
      message: 'Unused variable detected',
      ruleId: 'no-unused-vars',
      fixable: true,
      suggestion: 'Remove unused variable',
      score: 5
    };

    mockContext = {
      projectType: 'frontend',
      filePath: '/src/components/UserProfile.tsx',
      componentType: 'ui-component',
      criticality: 'medium',
      teamWorkflow: 'scrum',
      recentChanges: true,
      businessDomain: 'frontend',
      complexityMetrics: {
        cyclomaticComplexity: 8,
        cognitiveComplexity: 6,
        linesOfCode: 150,
        dependencies: 12
      }
    };
  });

  describe('classifyIssue', () => {
    it('should classify a security issue correctly', async () => {
      const securityIssue: Issue = {
        ...mockIssue,
        filePath: '/src/security/auth.ts',
        message: 'SQL injection vulnerability',
        ruleId: 'security-sql-injection'
      };

      const securityContext: IssueContext = {
        ...mockContext,
        filePath: '/src/security/auth.ts',
        componentType: 'security',
        criticality: 'critical',
        businessDomain: 'security'
      };

      const classification = await classifier.classifyIssue(securityIssue, securityContext);

      expect(classification.category).toBe('security');
      expect(classification.severity).toBe('critical');
      expect(classification.confidence).toBeGreaterThan(0.8);
      expect(classification.features).toBeDefined();
      expect(classification.features.businessCriticality).toBeGreaterThan(0.8);
    });

    it('should classify a performance issue correctly', async () => {
      const performanceIssue: Issue = {
        ...mockIssue,
        filePath: '/src/components/DataTable.tsx',
        message: 'Inefficient rendering detected',
        ruleId: 'react-performance'
      };

      const performanceContext: IssueContext = {
        ...mockContext,
        filePath: '/src/components/DataTable.tsx',
        componentType: 'ui-component',
        businessDomain: 'frontend',
        complexityMetrics: {
          cyclomaticComplexity: 15,
          cognitiveComplexity: 12,
          linesOfCode: 300,
          dependencies: 25
        }
      };

      const classification = await classifier.classifyIssue(performanceIssue, performanceContext);

      expect(classification.category).toBeOneOf(['performance', 'maintainability']);
      expect(classification.features.codeComplexity).toBeGreaterThan(0.5);
      expect(classification.features.userFacingImpact).toBeGreaterThan(0.5);
    });

    it('should classify a documentation issue correctly', async () => {
      const docIssue: Issue = {
        ...mockIssue,
        type: 'info',
        filePath: '/docs/api.md',
        message: 'Missing parameter documentation',
        ruleId: 'jsdoc/require-param'
      };

      const docContext: IssueContext = {
        ...mockContext,
        filePath: '/docs/api.md',
        componentType: 'documentation',
        criticality: 'low',
        businessDomain: 'documentation',
        complexityMetrics: {
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          linesOfCode: 50,
          dependencies: 0
        }
      };

      const classification = await classifier.classifyIssue(docIssue, docContext);

      expect(classification.category).toBe('documentation');
      expect(classification.severity).toBe('low');
      expect(classification.features.codeComplexity).toBeLessThan(0.3);
      expect(classification.features.technicalDebtImpact).toBeLessThan(0.3);
    });

    it('should handle errors gracefully when model is not ready', async () => {
      const faultyClassifier = new IssueClassifier();
      // Simulate model not being ready by making it null
      (faultyClassifier as any).model = null;

      await expect(faultyClassifier.classifyIssue(mockIssue, mockContext)).rejects.toThrow(
        'Classification model not loaded'
      );
    });
  });

  describe('trainModel', () => {
    it('should train model with valid training data', async () => {
      const trainingData: IssueTrainingData[] = [
        {
          issueId: 'issue-1',
          features: {
            codeComplexity: 0.7,
            changeFrequency: 0.8,
            teamImpact: 0.9,
            userFacingImpact: 0.6,
            businessCriticality: 0.8,
            technicalDebtImpact: 0.5
          },
          actualOutcome: {
            resolutionTime: 4,
            effort: 6,
            success: true,
            userFeedback: 4
          },
          context: mockContext,
          timestamp: new Date()
        },
        {
          issueId: 'issue-2',
          features: {
            codeComplexity: 0.3,
            changeFrequency: 0.2,
            teamImpact: 0.4,
            userFacingImpact: 0.7,
            businessCriticality: 0.5,
            technicalDebtImpact: 0.3
          },
          actualOutcome: {
            resolutionTime: 8,
            effort: 3,
            success: true,
            userFeedback: 5
          },
          context: mockContext,
          timestamp: new Date()
        },
        // Add more training data to meet minimum requirements
        ...Array(15).fill(null).map((_, index) => ({
          issueId: `train-extra-${index}`,
          features: {
            codeComplexity: Math.random(),
            changeFrequency: Math.random(),
            teamImpact: Math.random(),
            userFacingImpact: Math.random(),
            businessCriticality: Math.random(),
            technicalDebtImpact: Math.random()
          },
          actualOutcome: {
            resolutionTime: Math.random() * 20,
            effort: Math.random() * 10,
            success: Math.random() > 0.2,
            userFeedback: Math.random() * 5 + 1
          },
          context: mockContext,
          timestamp: new Date()
        }))
      ];

      const metrics = await classifier.trainModel(trainingData);

      expect(metrics).toBeDefined();
      expect(metrics.accuracy).toBeGreaterThan(0);
      expect(metrics.precision).toBeGreaterThan(0);
      expect(metrics.recall).toBeGreaterThan(0);
      expect(metrics.f1Score).toBeGreaterThan(0);
      expect(metrics.trainingDataSize).toBe(trainingData.length);
      expect(metrics.modelVersion).toBeDefined();
      expect(metrics.trainedAt).toBeInstanceOf(Date);
    });

    it('should reject insufficient training data', async () => {
      const insufficientData: IssueTrainingData[] = [
        {
          issueId: 'issue-1',
          features: {
            codeComplexity: 0.5,
            changeFrequency: 0.5,
            teamImpact: 0.5,
            userFacingImpact: 0.5,
            businessCriticality: 0.5,
            technicalDebtImpact: 0.5
          },
          actualOutcome: {
            resolutionTime: 5,
            effort: 5,
            success: true
          },
          context: mockContext,
          timestamp: new Date()
        }
        // Only 1 sample, less than required minimum of 10
      ];

      await expect(classifier.trainModel(insufficientData)).rejects.toThrow(
        'Training data must contain at least 10 samples'
      );
    });

    it('should validate training data structure', async () => {
      const invalidData: IssueTrainingData[] = Array(15).fill(null).map((_, index) => ({
        issueId: index === 5 ? '' : `issue-${index}`, // One missing issueId
        features: index === 10 ? null : { // One missing features
          codeComplexity: 0.5,
          changeFrequency: 0.5,
          teamImpact: 0.5,
          userFacingImpact: 0.5,
          businessCriticality: 0.5,
          technicalDebtImpact: 0.5
        },
        actualOutcome: index === 12 ? null : { // One missing outcome
          resolutionTime: 5,
          effort: 5,
          success: true
        },
        context: mockContext,
        timestamp: new Date()
      }));

      await expect(classifier.trainModel(invalidData)).rejects.toThrow(
        /Invalid training data/
      );
    });

    it('should handle concurrent training attempts', async () => {
      const trainingData: IssueTrainingData[] = Array(15).fill(null).map((_, index) => ({
        issueId: `issue-${index}`,
        features: {
          codeComplexity: 0.5,
          changeFrequency: 0.5,
          teamImpact: 0.5,
          userFacingImpact: 0.5,
          businessCriticality: 0.5,
          technicalDebtImpact: 0.5
        },
        actualOutcome: {
          resolutionTime: 5,
          effort: 5,
          success: true
        },
        context: mockContext,
        timestamp: new Date()
      }));

      // Start first training
      const trainingPromise1 = classifier.trainModel(trainingData);

      // Attempt second training while first is in progress
      await expect(classifier.trainModel(trainingData)).rejects.toThrow(
        'Model training already in progress'
      );

      // First training should complete successfully
      const metrics = await trainingPromise1;
      expect(metrics).toBeDefined();
    });
  });

  describe('feature extraction', () => {
    it('should extract features correctly for high complexity code', async () => {
      const complexContext: IssueContext = {
        ...mockContext,
        complexityMetrics: {
          cyclomaticComplexity: 25,
          cognitiveComplexity: 18,
          linesOfCode: 1000,
          dependencies: 50
        }
      };

      const classification = await classifier.classifyIssue(mockIssue, complexContext);

      expect(classification.features.codeComplexity).toBeGreaterThan(0.8);
      expect(classification.features.technicalDebtImpact).toBeGreaterThan(0.5);
    });

    it('should extract features correctly for user-facing components', async () => {
      const userFacingContext: IssueContext = {
        ...mockContext,
        filePath: '/src/components/UserProfile.tsx',
        componentType: 'ui-component',
        businessDomain: 'user-management'
      };

      const classification = await classifier.classifyIssue(mockIssue, userFacingContext);

      expect(classification.features.userFacingImpact).toBeGreaterThan(0.5);
      expect(classification.features.teamImpact).toBeGreaterThan(0.3);
    });

    it('should handle recent changes correctly', async () => {
      const recentChangesContext: IssueContext = {
        ...mockContext,
        recentChanges: true
      };

      const classification = await classifier.classifyIssue(mockIssue, recentChangesContext);

      expect(classification.features.changeFrequency).toBe(1.0);
    });
  });

  describe('model readiness', () => {
    it('should report model readiness status correctly', () => {
      expect(classifier.isReady()).toBe(true);
    });

    it('should provide model version', () => {
      const version = classifier.getModelVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
    });

    it('should provide model metrics when ready', async () => {
      const metrics = await classifier.getModelMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.accuracy).toBeGreaterThan(0);
      expect(metrics.modelVersion).toBeDefined();
    });
  });

  describe('classification validation', () => {
    it('should validate and correct invalid classification results', async () => {
      // Create a context that might result in edge case classifications
      const edgeCaseContext: IssueContext = {
        ...mockContext,
        criticality: 'medium' as any, // Valid
        businessDomain: undefined
      };

      const classification = await classifier.classifyIssue(mockIssue, edgeCaseContext);

      // Ensure confidence is within bounds
      expect(classification.confidence).toBeGreaterThanOrEqual(0.1);
      expect(classification.confidence).toBeLessThanOrEqual(1.0);

      // Ensure severity is valid
      expect(['low', 'medium', 'high', 'critical']).toContain(classification.severity);

      // Ensure category is valid
      expect(['bug', 'performance', 'security', 'maintainability', 'documentation', 'feature']).toContain(
        classification.category
      );
    });
  });

  describe('error handling', () => {
    it('should handle classification errors gracefully', async () => {
      // Create a context that might cause issues
      const problematicContext: IssueContext = {
        projectType: '',
        filePath: '',
        componentType: '',
        criticality: 'medium',
        teamWorkflow: 'scrum',
        recentChanges: false,
        complexityMetrics: {
          cyclomaticComplexity: -1, // Invalid negative value
          cognitiveComplexity: -1,
          linesOfCode: -1,
          dependencies: -1
        }
      };

      // Should not throw but handle gracefully
      const classification = await classifier.classifyIssue(mockIssue, problematicContext);

      expect(classification).toBeDefined();
      expect(classification.category).toBeOneOf([
        'bug', 'performance', 'security', 'maintainability', 'documentation', 'feature'
      ]);
    });
  });
});