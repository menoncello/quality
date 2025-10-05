import {
  IssuePrioritization,
  TriageSuggestion,
  ProjectContext
} from '@dev-quality/types';

import { WorkflowIntegration } from './workflow-integration';

/**
 * Automated triage suggestions engine
 * Generates intelligent recommendations for issue handling
 */
export class TriageEngine {
  private workflowIntegration: WorkflowIntegration;

  constructor(workflowIntegration: WorkflowIntegration) {
    this.workflowIntegration = workflowIntegration;
  }

  /**
   * Generate triage suggestions for prioritized issues
   */
  async generateTriageSuggestions(
    prioritizedIssues: IssuePrioritization[],
    context: ProjectContext
  ): Promise<TriageSuggestion[]> {
    // Apply workflow-specific adjustments
    const workflowAdjustedSuggestions = this.workflowIntegration.generateWorkflowSuggestions(
      prioritizedIssues,
      context
    );

    // Optimize suggestions based on team capacity and constraints
    return this.optimizeSuggestions(workflowAdjustedSuggestions, context);
  }

  /**
   * Optimize triage suggestions based on team constraints
   */
  async optimizeSuggestions(
    suggestions: TriageSuggestion[],
    context: ProjectContext
  ): Promise<TriageSuggestion[]> {
    const optimized = suggestions.map(suggestion => ({ ...suggestion }));

    // Adjust for team capacity
    this.adjustForTeamCapacity(optimized, context);

    // Balance workload across team members
    this.balanceWorkload(optimized, context);

    // Optimize for deadlines and milestones
    this.optimizeForDeadlines(optimized, context);

    // Apply risk-based adjustments
    this.applyRiskAdjustments(optimized, context);

    return optimized;
  }

  /**
   * Generate triage rule recommendations
   */
  async generateTriageRules(
    historicalData: IssuePrioritization[],
    context: ProjectContext
  ): Promise<TriageRuleRecommendation[]> {
    const recommendations: TriageRuleRecommendation[] = [];

    // Analyze patterns in historical data
    const patterns = this.analyzeTriagePatterns(historicalData);

    // Generate rule suggestions based on patterns
    for (const pattern of patterns) {
      const recommendation = this.createRuleFromPattern(pattern, context);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  /**
   * Track triage effectiveness and provide feedback
   */
  async trackTriageEffectiveness(
    suggestions: TriageSuggestion[],
    outcomes: TriageOutcome[]
  ): Promise<TriageEffectivenessReport> {
    const report: TriageEffectivenessReport = {
      totalSuggestions: suggestions.length,
      acceptedCount: 0,
      rejectedCount: 0,
      modifiedCount: 0,
      averageAccuracy: 0,
      confidenceDistribution: this.calculateConfidenceDistribution(suggestions),
      actionDistribution: this.calculateActionDistribution(suggestions),
      recommendations: []
    };

    let totalAccuracy = 0;
    let validOutcomes = 0;

    for (let i = 0; i < suggestions.length; i++) {
      const _suggestion = suggestions[i];
      const outcome = outcomes[i];

      if (outcome) {
        if (outcome.action === 'accepted') {
          report.acceptedCount++;
        } else if (outcome.action === 'rejected') {
          report.rejectedCount++;
        } else if (outcome.action === 'modified') {
          report.modifiedCount++;
        }

        if (outcome.accuracy !== undefined) {
          totalAccuracy += outcome.accuracy;
          validOutcomes++;
        }
      }
    }

    report.averageAccuracy = validOutcomes > 0 ? totalAccuracy / validOutcomes : 0;

    // Generate recommendations based on effectiveness
    report.recommendations = this.generateEffectivenessRecommendations(report);

    return report;
  }

  /**
   * Generate base triage suggestion for a single issue
   */
  private generateBaseTriageSuggestion(issue: IssuePrioritization): TriageSuggestion {
    const { finalScore } = issue;

    // Determine action based on score and context
    let action: TriageSuggestion['action'];
    const estimatedEffort = this.estimateEffort(issue);

    if (finalScore >= 9) {
      action = 'fix-now';
    } else if (finalScore >= 7) {
      action = 'schedule';
    } else if (finalScore >= 5) {
      action = 'delegate';
    } else if (finalScore >= 3) {
      action = 'monitor';
    } else {
      action = 'ignore';
    }

    // Suggest assignee based on expertise
    const assignee = this.suggestAssignee(issue);

    // Calculate deadline based on priority
    const deadline = this.calculateDeadline(finalScore);

    // Generate reasoning
    const reasoning = this.generateReasoning(issue);

    // Calculate confidence
    const confidence = this.calculateConfidence(issue);

    return {
      action,
      priority: Math.round(finalScore),
      estimatedEffort,
      assignee,
      deadline,
      reasoning,
      confidence
    };
  }

  /**
   * Estimate effort in hours
   */
  private estimateEffort(issue: IssuePrioritization): number {
    let effort = 1; // Base effort

    // Base effort on complexity metrics
    effort += issue.context.complexityMetrics.cyclomaticComplexity * 0.3;
    effort += issue.context.complexityMetrics.cognitiveComplexity * 0.2;
    effort += Math.log10(issue.context.complexityMetrics.linesOfCode + 1) * 0.5;

    // Adjust for issue type
    const effortMultipliers = {
      'bug': 1.0,
      'performance': 1.5,
      'security': 2.0,
      'maintainability': 1.2,
      'documentation': 0.5,
      'feature': 2.5
    };
    effort *= effortMultipliers[issue.classification.category as keyof typeof effortMultipliers] || 1.0;

    // Adjust for severity
    if (issue.classification.severity === 'critical') effort *= 1.5;
    else if (issue.classification.severity === 'high') effort *= 1.2;

    return Math.max(0.5, Math.round(effort * 10) / 10);
  }

  /**
   * Suggest assignee based on issue characteristics
   */
  private suggestAssignee(issue: IssuePrioritization): string | undefined {
    const { classification, context } = issue;

    // Suggest based on category
    if (classification.category === 'security') return 'security-team';
    if (classification.category === 'performance') return 'performance-team';
    if (classification.category === 'documentation') return 'technical-writers';

    // Suggest based on component
    if (context.componentType.includes('ui')  || context.componentType.includes('frontend')) {
      return 'frontend-team';
    }
    if (context.componentType.includes('api') ?? context.componentType.includes('backend')) {
      return 'backend-team';
    }
    if (context.componentType.includes('test')) {
      return 'qa-team';
    }

    // Suggest based on criticality
    if (context.criticality === 'critical') return 'senior-developers';
    if (context.criticality === 'high') return 'experienced-developers';

    return undefined;
  }

  /**
   * Calculate deadline based on priority
   */
  private calculateDeadline(finalScore: number): Date | undefined {
    if (finalScore < 5) return undefined; // No deadline for low priority items

    const now = new Date();
    let daysToAdd = 1;

    if (finalScore >= 9) daysToAdd = 1;      // Critical: 1 day
    else if (finalScore >= 8) daysToAdd = 2;  // High: 2 days
    else if (finalScore >= 7) daysToAdd = 3;  // Medium-High: 3 days
    else if (finalScore >= 6) daysToAdd = 5;  // Medium: 5 days
    else if (finalScore >= 5) daysToAdd = 7;  // Medium-Low: 1 week

    return new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
  }

  /**
   * Generate reasoning for triage suggestion
   */
  private generateReasoning(issue: IssuePrioritization): string {
    const reasons = [];

    // Score-based reasoning
    if (issue.finalScore >= 8) {
      reasons.push(`High priority score (${issue.finalScore}/10)`);
    }

    // Classification-based reasoning
    if (issue.classification.severity === 'critical') {
      reasons.push('Critical severity classification');
    }
    if (issue.classification.category === 'security') {
      reasons.push('Security-related issue');
    }

    // Context-based reasoning
    if (issue.context.criticality === 'critical') {
      reasons.push('Located in critical component');
    }
    if (issue.context.recentChanges) {
      reasons.push('Located in recently modified code');
    }

    // Effort-based reasoning
    if (issue.effort <= 3) {
      reasons.push('Low effort required');
    }

    // Business impact reasoning
    if (issue.businessValue >= 8) {
      reasons.push('High business value');
    }

    return `${reasons.join('. ')  }.`;
  }

  /**
   * Calculate confidence in triage suggestion
   */
  private calculateConfidence(issue: IssuePrioritization): number {
    let confidence = issue.classification.confidence * 0.6; // Base confidence from ML

    // Increase confidence for clear-cut cases
    if (issue.finalScore >= 9 || issue.finalScore <= 2) confidence += 0.2;
    if (issue.context.criticality === 'critical') confidence += 0.1;
    if (issue.classification.confidence > 0.9) confidence += 0.1;

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Adjust suggestions for team capacity
   */
  private adjustForTeamCapacity(suggestions: TriageSuggestion[], context: ProjectContext): void {
    if (!context.currentSprint) return;

    const utilizationRate = context.currentSprint.currentLoad / context.currentSprint.capacity;

    if (utilizationRate > 0.9) {
      // Team is overloaded, reduce urgency of medium priority items
      suggestions.forEach(suggestion => {
        if (suggestion.priority >= 5 && suggestion.priority <= 7) {
          if (suggestion.action === 'fix-now') {
            suggestion.action = 'schedule';
          } else if (suggestion.action === 'schedule') {
            suggestion.action = 'delegate';
          }
        }
      });
    } else if (utilizationRate < 0.5) {
      // Team has capacity, increase urgency slightly
      suggestions.forEach(suggestion => {
        if (suggestion.priority >= 6 && suggestion.action === 'delegate') {
          suggestion.action = 'schedule';
        }
      });
    }
  }

  /**
   * Balance workload across team members
   */
  private balanceWorkload(suggestions: TriageSuggestion[], _context: ProjectContext): void {
    // Simple workload balancing - in a real implementation, this would track actual team member workload
    const teamMembers = ['frontend-team', 'backend-team', 'qa-team', 'security-team'];
    const workloadDistribution = new Map<string, number>();

    // Initialize workload
    teamMembers.forEach(member => workloadDistribution.set(member, 0));

    // Distribute assignments
    suggestions.forEach(suggestion => {
      if (suggestion.assignee && workloadDistribution.has(suggestion.assignee)) {
        const currentWorkload = workloadDistribution.get(suggestion.assignee);

        // If team member is overloaded, suggest alternative
        if ((currentWorkload as any) > 10) { // Arbitrary threshold
          const alternatives = teamMembers.filter(m => m !== suggestion.assignee);
          const leastLoaded = alternatives.reduce((min, member) =>
            (workloadDistribution.get(member)  ?? 0) < (workloadDistribution.get(min) ?? 0) ? member : min
          );
          suggestion.assignee = leastLoaded;
        }

        // Update workload
        workloadDistribution.set(suggestion.assignee, (currentWorkload as any) + suggestion.estimatedEffort);
      }
    });
  }

  /**
   * Optimize suggestions for deadlines and milestones
   */
  private optimizeForDeadlines(suggestions: TriageSuggestion[], context: ProjectContext): void {
    if (!context.currentSprint) return;

    const daysUntilSprintEnd = Math.ceil(
      ((context.currentSprint as any).endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    suggestions.forEach(suggestion => {
      if (suggestion.deadline && suggestion.deadline > (context.currentSprint as any).endDate) {
        // Move deadline before sprint end if it's currently after
        suggestion.deadline = new Date((context.currentSprint as any).endDate);
      }

      // Adjust reasoning for sprint context
      if (daysUntilSprintEnd <= 3 && suggestion.priority >= 7) {
        suggestion.reasoning += ' Urgent due to approaching sprint deadline.';
      }
    });
  }

  /**
   * Apply risk-based adjustments
   */
  private applyRiskAdjustments(suggestions: TriageSuggestion[], _context: ProjectContext): void {
    suggestions.forEach(suggestion => {
      // High priority security items should always be addressed immediately
      if (suggestion.priority >= 8 && suggestion.reasoning.includes('Security')) {
        suggestion.action = 'fix-now';
        suggestion.confidence = Math.min(0.95, suggestion.confidence + 0.2);
      }

      // Low confidence suggestions should be reviewed
      if (suggestion.confidence < 0.5) {
        suggestion.reasoning += ' Low confidence - manual review recommended.';
      }
    });
  }

  /**
   * Analyze triage patterns in historical data
   */
  private analyzeTriagePatterns(historicalData: IssuePrioritization[]): TriagePattern[] {
    const patterns: TriagePattern[] = [];

    // Analyze common patterns
    const securityIssues = historicalData.filter(i => i.classification.category === 'security');
    const performanceIssues = historicalData.filter(i => i.classification.category === 'performance');
    const criticalIssues = historicalData.filter(i => i.classification.severity === 'critical');

    if (securityIssues.length > 0) {
      patterns.push({
        type: 'security',
        frequency: securityIssues.length / historicalData.length,
        averageScore: securityIssues.reduce((sum, i) => sum + i.finalScore, 0) / securityIssues.length,
        commonAction: 'fix-now',
        confidence: 0.8
      });
    }

    if (performanceIssues.length > 0) {
      patterns.push({
        type: 'performance',
        frequency: performanceIssues.length / historicalData.length,
        averageScore: performanceIssues.reduce((sum, i) => sum + i.finalScore, 0) / performanceIssues.length,
        commonAction: 'schedule',
        confidence: 0.7
      });
    }

    if (criticalIssues.length > 0) {
      patterns.push({
        type: 'critical',
        frequency: criticalIssues.length / historicalData.length,
        averageScore: criticalIssues.reduce((sum, i) => sum + i.finalScore, 0) / criticalIssues.length,
        commonAction: 'fix-now',
        confidence: 0.9
      });
    }

    return patterns;
  }

  /**
   * Create triage rule from pattern
   */
  private createRuleFromPattern(pattern: TriagePattern, _context: ProjectContext): TriageRuleRecommendation | null {
    if (pattern.confidence < 0.7) return null;

    return {
      name: `Auto-generated ${pattern.type} rule`,
      description: `Rule for ${pattern.type} issues based on historical patterns`,
      conditions: [
        {
          field: 'classification.category',
          operator: 'equals',
          value: pattern.type,
          caseSensitive: false
        }
      ],
      actions: [
        {
          type: 'customAction',
          parameters: {
            triageAction: pattern.commonAction,
            reasoning: `Auto-suggested based on ${pattern.frequency.toFixed(1)}% frequency and average score of ${pattern.averageScore.toFixed(1)}`
          }
        }
      ],
      confidence: pattern.confidence
    };
  }

  /**
   * Calculate confidence distribution
   */
  private calculateConfidenceDistribution(suggestions: TriageSuggestion[]): Record<string, number> {
    const distribution = {
      'high (>0.8)': 0,
      'medium (0.5-0.8)': 0,
      'low (<0.5)': 0
    };

    suggestions.forEach(suggestion => {
      if (suggestion.confidence > 0.8) {
        distribution['high (>0.8)']++;
      } else if (suggestion.confidence >= 0.5) {
        distribution['medium (0.5-0.8)']++;
      } else {
        distribution['low (<0.5)']++;
      }
    });

    return distribution;
  }

  /**
   * Calculate action distribution
   */
  private calculateActionDistribution(suggestions: TriageSuggestion[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    suggestions.forEach(suggestion => {
      distribution[suggestion.action] = (distribution[suggestion.action]  || 0) + 1;
    });

    return distribution;
  }

  /**
   * Generate effectiveness recommendations
   */
  private generateEffectivenessRecommendations(report: TriageEffectivenessReport): string[] {
    const recommendations: string[] = [];

    if (report.averageAccuracy < 0.7) {
      recommendations.push('Consider improving ML model accuracy - current accuracy is below 70%');
    }

    if (report.rejectedCount / report.totalSuggestions > 0.3) {
      recommendations.push('High rejection rate - review triage criteria and team preferences');
    }

    const lowConfidenceCount = report.confidenceDistribution['low (<0.5)']  || 0;
    if (lowConfidenceCount / report.totalSuggestions > 0.2) {
      recommendations.push('Many low-confidence suggestions - gather more training data or adjust confidence thresholds');
    }

    return recommendations;
  }
}

/**
 * Triage rule recommendation
 */
export interface TriageRuleRecommendation {
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: string | number | boolean;
    caseSensitive?: boolean;
  }>;
  actions: Array<{
    type: string;
    parameters: Record<string, unknown>;
  }>;
  confidence: number;
}

/**
 * Triage pattern from historical analysis
 */
interface TriagePattern {
  type: string;
  frequency: number;
  averageScore: number;
  commonAction: string;
  confidence: number;
}

/**
 * Triage outcome for tracking effectiveness
 */
export interface TriageOutcome {
  action: 'accepted' | 'rejected' | 'modified';
  accuracy?: number;
  feedback?: string;
  timestamp: Date;
}

/**
 * Triage effectiveness report
 */
export interface TriageEffectivenessReport {
  totalSuggestions: number;
  acceptedCount: number;
  rejectedCount: number;
  modifiedCount: number;
  averageAccuracy: number;
  confidenceDistribution: Record<string, number>;
  actionDistribution: Record<string, number>;
  recommendations: string[];
}