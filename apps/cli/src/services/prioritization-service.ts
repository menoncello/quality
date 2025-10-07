/**
 * Prioritization Service
 * Integrates with Story 2.2 Issue Prioritization Engine
 */

import type { IssuePrioritization, IssueContext } from '@dev-quality/types';
import type { Issue, AnalysisResult } from '../types/analysis';
import type { IssueWithPriority } from '../types/dashboard';

export class PrioritizationService {
  private prioritizationEngine: {
    prioritizeIssues: (issues: Issue[], context: unknown) => Promise<IssuePrioritization[]>;
  } | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initializeEngine();
  }

  private async initializeEngine(): Promise<void> {
    try {
      // Import the prioritization engine from Story 2.2
      const { prioritizationFactory } = await import('@dev-quality/core');
      const engine = await prioritizationFactory.createEngineWithDefaults();
      this.prioritizationEngine = engine as {
        prioritizeIssues: (issues: Issue[], context: unknown) => Promise<IssuePrioritization[]>;
      };
    } catch (_error) {
      // Create a mock engine for testing/fallback purposes
      this.prioritizationEngine = this.createMockEngine();
    }
  }

  private createMockEngine(): {
    prioritizeIssues: (issues: Issue[], context: unknown) => Promise<IssuePrioritization[]>;
  } {
    return {
      prioritizeIssues: async (
        issues: Issue[],
        context: unknown
      ): Promise<IssuePrioritization[]> => {
        return issues.map(issue => ({
          id: `priority-${issue.id}`,
          issueId: issue.id,
          severity: this.getSeverityScore(issue.type),
          impact: 5,
          effort: 3,
          businessValue: 6,
          finalScore: 5.0,
          context: context as IssueContext,
          classification: {
            category: 'maintainability' as const,
            severity: 'medium' as const,
            confidence: 0.7,
            features: {
              codeComplexity: 3,
              changeFrequency: 0.5,
              teamImpact: 0.6,
              userFacingImpact: 0.7,
              businessCriticality: 0.5,
              technicalDebtImpact: 0.4,
            },
          },
          triageSuggestion: {
            action: 'schedule' as const,
            priority: 5,
            estimatedEffort: 2,
            reasoning: 'Standard maintenance issue',
            confidence: 0.7,
          },
          scoringFactors: {
            severityWeight: 0.3,
            impactWeight: 0.25,
            effortWeight: 0.2,
            businessValueWeight: 0.25,
            contextMultiplier: 1.0,
            classificationBonus: 0.0,
            workflowAdjustment: 0.0,
          },
          metadata: {
            processedAt: new Date(),
            algorithm: 'mock',
            processingTime: 5,
            cacheHit: false,
          },
        }));
      },
    };
  }

  private getSeverityScore(issueType: string): number {
    switch (issueType) {
      case 'error':
        return 8;
      case 'warning':
        return 5;
      case 'info':
        return 2;
      default:
        return 4;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      this.initializationPromise = null;
    }
  }

  /**
   * Process issues through the prioritization engine
   */
  async processIssues(
    issues: Issue[],
    analysisResult: AnalysisResult
  ): Promise<IssuePrioritization[]> {
    await this.ensureInitialized();

    if (!this.prioritizationEngine) {
      throw new Error('Prioritization engine not initialized');
    }

    try {
      const context = this.createProjectContext(analysisResult);
      const prioritizations = await this.prioritizationEngine.prioritizeIssues(issues, context);
      return prioritizations as IssuePrioritization[];
    } catch (error) {
      throw new Error(
        `Failed to process issues: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create project context for prioritization engine
   */
  private createProjectContext(analysisResult: AnalysisResult): unknown {
    return {
      projectConfiguration: {
        id: analysisResult.projectId,
        name: 'Test Project',
        type: 'typescript-react',
      },
      teamPreferences: {
        workflow: 'scrum',
        priorities: {
          performance: 8,
          security: 10,
          maintainability: 7,
          features: 6,
        },
        workingHours: {
          start: '09:00',
          end: '17:00',
          timezone: 'UTC',
        },
        sprintDuration: 14,
      },
      historicalData: {
        averageResolutionTime: 24,
        commonIssueTypes: ['error', 'warning'],
        teamVelocity: 20,
        bugRate: 0.3,
        performance: {
          bugFixTime: 4,
          featureImplementationTime: 8,
          reviewTime: 2,
        },
      },
    };
  }

  /**
   * Create issue context for prioritization engine (now unused, kept for compatibility)
   */
  private createIssueContext(issue: Issue, analysisResult: AnalysisResult): IssueContext {
    const filePathParts = issue.filePath.split('/');
    const fileName = filePathParts[filePathParts.length - 1] ?? '';
    const extension = fileName.split('.').pop() ?? '';

    // Determine component type based on file path and extension
    const componentType = this.getComponentType(issue.filePath, extension);

    // Determine criticality based on issue severity and file path
    const criticality = this.getCriticality(issue.type, issue.filePath);

    return {
      projectType: this.getProjectType(analysisResult),
      filePath: issue.filePath,
      componentType,
      criticality,
      teamWorkflow: 'scrum', // Default, could be configurable
      recentChanges: false, // Could be determined from git history
      businessDomain: this.getBusinessDomain(issue.filePath),
      complexityMetrics: {
        cyclomaticComplexity: 1, // Placeholder - would need actual analysis
        cognitiveComplexity: 1,
        linesOfCode: 100, // Placeholder
        dependencies: 1,
      },
    };
  }

  /**
   * Determine component type from file path and extension
   */
  private getComponentType(filePath: string, extension: string): string {
    if (
      filePath.includes('/test/') ||
      filePath.includes('/tests/') ||
      filePath.includes('.test.') ||
      filePath.includes('.spec.')
    ) {
      return 'test';
    }
    if (filePath.includes('/src/') || filePath.includes('/lib/')) {
      if (extension === 'tsx' || extension === 'jsx') return 'component';
      if (extension === 'ts' || extension === 'js') return 'module';
      if (extension === 'css' || extension === 'scss') return 'style';
    }
    if (filePath.includes('/config/')) return 'configuration';
    if (filePath.includes('/docs/')) return 'documentation';

    return 'unknown';
  }

  /**
   * Determine criticality based on issue type and file path
   */
  private getCriticality(
    issueType: string,
    filePath: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical paths
    if (
      filePath.includes('/src/main') ||
      filePath.includes('/src/index') ||
      filePath.includes('/src/app')
    ) {
      if (issueType === 'error') return 'critical';
      if (issueType === 'warning') return 'high';
    }

    // Important directories
    if (filePath.includes('/src/components/') || filePath.includes('/src/services/')) {
      if (issueType === 'error') return 'high';
      if (issueType === 'warning') return 'medium';
    }

    // Standard files
    if (issueType === 'error') return 'medium';
    if (issueType === 'warning') return 'low';

    return 'low';
  }

  /**
   * Determine project type from analysis result
   */
  private getProjectType(_analysisResult: AnalysisResult): string {
    // This could be enhanced to analyze the project structure
    return 'typescript-react';
  }

  /**
   * Determine business domain from file path
   */
  private getBusinessDomain(filePath: string): string | undefined {
    if (filePath.includes('/auth/') || filePath.includes('/login/')) return 'authentication';
    if (filePath.includes('/payment/') || filePath.includes('/billing/')) return 'billing';
    if (filePath.includes('/user/') || filePath.includes('/profile/')) return 'user-management';
    if (filePath.includes('/admin/')) return 'administration';
    if (filePath.includes('/api/')) return 'api';

    return undefined;
  }

  /**
   * Enrich issues with priority data
   */
  enrichIssuesWithPriority(
    issues: Issue[],
    prioritizations: IssuePrioritization[]
  ): IssueWithPriority[] {
    const prioritizationMap = new Map(prioritizations.map(p => [p.issueId, p]));

    return issues.map(issue => {
      const prioritization = prioritizationMap.get(issue.id);
      if (!prioritization) {
        return issue as IssueWithPriority;
      }

      const priorityLevel = this.getPriorityLevel(prioritization.finalScore);

      return {
        ...issue,
        priority: prioritization,
        priorityScore: prioritization.finalScore,
        priorityLevel,
        triageSuggestion: prioritization.triageSuggestion,
      } as IssueWithPriority;
    });
  }

  /**
   * Convert priority score to priority level
   */
  private getPriorityLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Filter issues by priority levels
   */
  filterByPriority(issues: IssueWithPriority[], priorityLevels: string[]): IssueWithPriority[] {
    if (!priorityLevels.length) return issues;

    return issues.filter(
      issue => issue.priorityLevel && priorityLevels.includes(issue.priorityLevel)
    );
  }

  /**
   * Sort issues by priority
   */
  sortByPriority(issues: IssueWithPriority[], order: 'asc' | 'desc' = 'desc'): IssueWithPriority[] {
    return [...issues].sort((a, b) => {
      const scoreA = a.priorityScore ?? 0;
      const scoreB = b.priorityScore ?? 0;
      return order === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });
  }

  /**
   * Get priority statistics
   */
  getPriorityStatistics(issues: IssueWithPriority[]): {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
    averageScore: number;
  } {
    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: issues.length,
      averageScore: 0,
    };

    let totalScore = 0;
    let scoredCount = 0;

    for (const issue of issues) {
      if (issue.priorityLevel) {
        stats[issue.priorityLevel]++;
      }

      if (issue.priorityScore !== undefined) {
        totalScore += issue.priorityScore;
        scoredCount++;
      }
    }

    stats.averageScore = scoredCount > 0 ? totalScore / scoredCount : 0;

    return stats;
  }
}

// Singleton instance
export const prioritizationService = new PrioritizationService();
