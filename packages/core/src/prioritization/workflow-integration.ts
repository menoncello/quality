import {
  IssuePrioritization,
  ProjectContext,
  TeamPreferences,
  SprintContext,
  HistoricalData,
  IssueContext,
  TriageSuggestion
} from '../../../types/src/prioritization';

/**
 * Team workflow integration for issue prioritization
 * Adapts prioritization based on team workflow preferences and current context
 */
export class WorkflowIntegration {
  private teamPreferences: TeamPreferences;
  private historicalData: HistoricalData;

  constructor(teamPreferences: TeamPreferences, historicalData: HistoricalData) {
    this.teamPreferences = teamPreferences;
    this.historicalData = historicalData;
  }

  /**
   * Adjust prioritization based on team workflow
   */
  adaptPrioritizationForWorkflow(
    prioritizations: IssuePrioritization[],
    context: ProjectContext
  ): IssuePrioritization[] {
    switch (context.teamPreferences.workflow) {
      case 'scrum':
        return this.adaptForScrum(prioritizations, context);
      case 'kanban':
        return this.adaptForKanban(prioritizations, context);
      case 'waterfall':
        return this.adaptForWaterfall(prioritizations, context);
      case 'custom':
        return this.adaptForCustom(prioritizations, context);
      default:
        return prioritizations;
    }
  }

  /**
   * Generate workflow-specific triage suggestions
   */
  generateWorkflowSuggestions(
    prioritizations: IssuePrioritization[],
    context: ProjectContext
  ): TriageSuggestion[] {
    const suggestions = prioritizations.map(p => ({ ...p.triageSuggestion }));

    switch (context.teamPreferences.workflow) {
      case 'scrum':
        return this.adjustSuggestionsForScrum(suggestions, context);
      case 'kanban':
        return this.adjustSuggestionsForKanban(suggestions, context);
      case 'waterfall':
        return this.adjustSuggestionsForWaterfall(suggestions, context);
      default:
        return suggestions;
    }
  }

  /**
   * Analyze workflow patterns and provide insights
   */
  async analyzeWorkflowPatterns(context: ProjectContext): Promise<WorkflowAnalysis> {
    const analysis: WorkflowAnalysis = {
      workflow: context.teamPreferences.workflow,
      efficiency: this.calculateWorkflowEfficiency(),
      bottlenecks: this.identifyBottlenecks(),
      recommendations: this.generateWorkflowRecommendations(context),
      metrics: this.calculateWorkflowMetrics()
    };

    return analysis;
  }

  /**
   * Adapt prioritization for Scrum workflow
   */
  private adaptForScrum(
    prioritizations: IssuePrioritization[],
    context: ProjectContext
  ): IssuePrioritization[] {
    if (!context.currentSprint) {
      return prioritizations;
    }

    const adjusted = prioritizations.map(p => ({ ...p }));

    // Prioritize issues that align with sprint goals
    adjusted.forEach(prioritization => {
      const goalAlignment = this.calculateGoalAlignment(prioritization, context.currentSprint!);
      const sprintBonus = goalAlignment * 2; // Max 2 point bonus

      prioritization.finalScore = Math.min(10, prioritization.finalScore + sprintBonus);
      prioritization.scoringFactors.workflowAdjustment = sprintBonus;
    });

    // Adjust for team capacity
    const capacityUtilization = this.calculateCapacityUtilization(context);
    if (capacityUtilization > 0.9) {
      // Team is near capacity, reduce scores of lower priority items
      adjusted.forEach(prioritization => {
        if (prioritization.finalScore < 6) {
          prioritization.finalScore *= 0.8;
        }
      });
    }

    return adjusted;
  }

  /**
   * Adapt prioritization for Kanban workflow
   */
  private adaptForKanban(
    prioritizations: IssuePrioritization[],
    context: ProjectContext
  ): IssuePrioritization[] {
    const adjusted = prioritizations.map(p => ({ ...p }));

    // In Kanban, focus on continuous flow and WIP limits
    adjusted.forEach(prioritization => {
      // Prioritize smaller, quick wins to maintain flow
      const effortBonus = Math.max(0, (8 - prioritization.effort) * 0.3);
      prioritization.finalScore = Math.min(10, prioritization.finalScore + effortBonus);
      prioritization.scoringFactors.workflowAdjustment = effortBonus;

      // Adjust triage for pull-based system
      if (prioritization.finalScore >= 7) {
        prioritization.triageSuggestion.action = 'schedule';
      } else if (prioritization.finalScore >= 4) {
        prioritization.triageSuggestion.action = 'monitor';
      }
    });

    return adjusted;
  }

  /**
   * Adapt prioritization for Waterfall workflow
   */
  private adaptForWaterfall(
    prioritizations: IssuePrioritization[],
    context: ProjectContext
  ): IssuePrioritization[] {
    const adjusted = prioritizations.map(p => ({ ...p }));

    // In Waterfall, focus on phase-specific priorities
    adjusted.forEach(prioritization => {
      const phaseAdjustment = this.calculatePhaseAdjustment(prioritization.context);
      prioritization.finalScore = Math.min(10, prioritization.finalScore + phaseAdjustment);
      prioritization.scoringFactors.workflowAdjustment = phaseAdjustment;

      // More conservative triage suggestions
      if (prioritization.finalScore >= 9) {
        prioritization.triageSuggestion.action = 'fix-now';
      } else if (prioritization.finalScore >= 6) {
        prioritization.triageSuggestion.action = 'schedule';
      } else {
        prioritization.triageSuggestion.action = 'monitor';
      }
    });

    return adjusted;
  }

  /**
   * Adapt prioritization for custom workflow
   */
  private adaptForCustom(
    prioritizations: IssuePrioritization[],
    context: ProjectContext
  ): IssuePrioritization[] {
    const adjusted = prioritizations.map(p => ({ ...p }));

    // Apply custom logic based on team priorities
    adjusted.forEach(prioritization => {
      const customAdjustment = this.calculateCustomAdjustment(prioritization, context);
      prioritization.finalScore = Math.min(10, prioritization.finalScore + customAdjustment);
      prioritization.scoringFactors.workflowAdjustment = customAdjustment;
    });

    return adjusted;
  }

  /**
   * Adjust suggestions for Scrum
   */
  private adjustSuggestionsForScrum(
    suggestions: TriageSuggestion[],
    context: ProjectContext
  ): TriageSuggestion[] {
    return suggestions.map(suggestion => {
      const adjusted = { ...suggestion };

      if (context.currentSprint) {
        // Set deadlines relative to sprint end
        if (suggestion.action === 'fix-now' || suggestion.action === 'schedule') {
          const daysUntilSprintEnd = Math.ceil(
            (context.currentSprint!.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilSprintEnd > 0) {
            adjusted.deadline = new Date(Date.now() + Math.min(daysUntilSprintEnd, 7) * 24 * 60 * 60 * 1000);
          }
        }

        // Add sprint context to reasoning
        adjusted.reasoning += ` Consideration for current sprint goals.`;
      }

      return adjusted;
    });
  }

  /**
   * Adjust suggestions for Kanban
   */
  private adjustSuggestionsForKanban(
    suggestions: TriageSuggestion[],
    context: ProjectContext
  ): TriageSuggestion[] {
    return suggestions.map(suggestion => {
      const adjusted = { ...suggestion };

      // In Kanban, focus on pull-based scheduling
      if (suggestion.action === 'fix-now' && suggestion.priority < 8) {
        adjusted.action = 'schedule';
      }

      // Remove fixed deadlines, use relative priority
      adjusted.deadline = undefined;

      adjusted.reasoning += ' Optimized for continuous flow.';

      return adjusted;
    });
  }

  /**
   * Adjust suggestions for Waterfall
   */
  private adjustSuggestionsForWaterfall(
    suggestions: TriageSuggestion[],
    context: ProjectContext
  ): TriageSuggestion[] {
    return suggestions.map(suggestion => {
      const adjusted = { ...suggestion };

      // In Waterfall, be more conservative with actions
      if (suggestion.action === 'fix-now' && suggestion.priority < 9) {
        adjusted.action = 'schedule';
      }

      // Add longer deadlines for planning
      if (adjusted.deadline) {
        adjusted.deadline = new Date(adjusted.deadline.getTime() + 7 * 24 * 60 * 60 * 1000); // Add 1 week
      }

      adjusted.reasoning += ' Aligned with phase-based development approach.';

      return adjusted;
    });
  }

  /**
   * Calculate goal alignment for Scrum
   */
  private calculateGoalAlignment(prioritization: IssuePrioritization, sprint: SprintContext): number {
    if (sprint.goals.length === 0) return 0;

    const contextText = `${prioritization.context.filePath} ${prioritization.context.componentType} ${prioritization.context.businessDomain || ''} ${prioritization.classification.category}`.toLowerCase();

    let alignmentScore = 0;
    for (const goal of sprint.goals) {
      const goalKeywords = goal.toLowerCase().split(' ');
      for (const keyword of goalKeywords) {
        if (contextText.includes(keyword)) {
          alignmentScore += 1;
        }
      }
    }

    return Math.min(1.0, alignmentScore / sprint.goals.length);
  }

  /**
   * Calculate capacity utilization
   */
  private calculateCapacityUtilization(context: ProjectContext): number {
    if (!context.currentSprint) return 0.5;

    return context.currentSprint.currentLoad / context.currentSprint.capacity;
  }

  /**
   * Calculate phase adjustment for Waterfall
   */
  private calculatePhaseAdjustment(context: IssueContext): number {
    // Simplified phase detection based on file paths
    const filePath = context.filePath.toLowerCase();

    if (filePath.includes('design') || filePath.includes('spec')) {
      return 2; // Design phase
    } else if (filePath.includes('implementation') || filePath.includes('src')) {
      return 1; // Implementation phase
    } else if (filePath.includes('test') || filePath.includes('qa')) {
      return 1.5; // Testing phase
    } else if (filePath.includes('deploy') || filePath.includes('release')) {
      return 2; // Deployment phase
    }

    return 0;
  }

  /**
   * Calculate custom adjustment based on team priorities
   */
  private calculateCustomAdjustment(prioritization: IssuePrioritization, context: ProjectContext): number {
    let adjustment = 0;

    // Apply team priority weights
    const priorities = context.teamPreferences.priorities;

    if (prioritization.classification.category === 'performance') {
      adjustment += (priorities.performance - 5) * 0.2;
    }
    if (prioritization.classification.category === 'security') {
      adjustment += (priorities.security - 5) * 0.2;
    }
    if (prioritization.classification.category === 'maintainability') {
      adjustment += (priorities.maintainability - 5) * 0.2;
    }
    if (prioritization.classification.category === 'feature' || prioritization.classification.category === 'documentation') {
      adjustment += (priorities.features - 5) * 0.2;
    }

    return adjustment;
  }

  /**
   * Calculate workflow efficiency
   */
  private calculateWorkflowEfficiency(): number {
    // Simple efficiency calculation based on historical data
    const avgResolutionTime = this.historicalData.performance.bugFixTime;
    const teamVelocity = this.historicalData.teamVelocity;

    // Higher velocity and lower resolution time = higher efficiency
    const velocityScore = Math.min(1.0, teamVelocity / 20); // Normalize to 0-1
    const speedScore = Math.max(0, 1.0 - (avgResolutionTime / 40)); // Inverse, normalize to 0-1

    return (velocityScore + speedScore) / 2;
  }

  /**
   * Identify workflow bottlenecks
   */
  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];

    if (this.historicalData.performance.bugFixTime > 30) {
      bottlenecks.push('Bug resolution time is high');
    }

    if (this.historicalData.performance.reviewTime > 10) {
      bottlenecks.push('Code review process is slow');
    }

    if (this.historicalData.performance.featureImplementationTime > 50) {
      bottlenecks.push('Feature implementation is taking longer than expected');
    }

    if (this.historicalData.bugRate > 0.3) {
      bottlenecks.push('High bug rate affecting productivity');
    }

    return bottlenecks;
  }

  /**
   * Generate workflow recommendations
   */
  private generateWorkflowRecommendations(context: ProjectContext): string[] {
    const recommendations: string[] = [];

    const efficiency = this.calculateWorkflowEfficiency();
    if (efficiency < 0.6) {
      recommendations.push('Consider workflow optimization - current efficiency is below 60%');
    }

    if (this.historicalData.performance.reviewTime > 10) {
      recommendations.push('Implement code review automation or assign dedicated reviewers');
    }

    if (context.teamPreferences.workflow === 'scrum' && !context.currentSprint) {
      recommendations.push('Set up sprint planning to improve prioritization');
    }

    if (context.teamPreferences.workflow === 'kanban' && this.historicalData.teamVelocity < 5) {
      recommendations.push('Consider breaking down larger tasks to improve flow');
    }

    return recommendations;
  }

  /**
   * Calculate workflow metrics
   */
  private calculateWorkflowMetrics(): WorkflowMetrics {
    return {
      averageResolutionTime: this.historicalData.averageResolutionTime,
      teamVelocity: this.historicalData.teamVelocity,
      bugRate: this.historicalData.bugRate,
      efficiency: this.calculateWorkflowEfficiency(),
      throughput: this.historicalData.teamVelocity * (1 - this.historicalData.bugRate),
      qualityScore: 1 - this.historicalData.bugRate
    };
  }

  /**
   * Update team preferences
   */
  updateTeamPreferences(preferences: Partial<TeamPreferences>): void {
    this.teamPreferences = { ...this.teamPreferences, ...preferences };
  }

  /**
   * Update historical data
   */
  updateHistoricalData(data: Partial<HistoricalData>): void {
    this.historicalData = { ...this.historicalData, ...data };
  }

  /**
   * Get current team preferences
   */
  getTeamPreferences(): TeamPreferences {
    return { ...this.teamPreferences };
  }

  /**
   * Get current historical data
   */
  getHistoricalData(): HistoricalData {
    return { ...this.historicalData };
  }
}

/**
 * Workflow analysis results
 */
export interface WorkflowAnalysis {
  workflow: string;
  efficiency: number;
  bottlenecks: string[];
  recommendations: string[];
  metrics: WorkflowMetrics;
}

/**
 * Workflow performance metrics
 */
export interface WorkflowMetrics {
  averageResolutionTime: number;
  teamVelocity: number;
  bugRate: number;
  efficiency: number;
  throughput: number;
  qualityScore: number;
}