import {
  Issue,
  IssueContext,
  IssueClassification,
  TriageSuggestion,
  ScoringFactors,
  PrioritizationConfiguration,
  ProjectContext
} from '../../../types/src/prioritization';

/**
 * Multi-factor scoring algorithm for issue prioritization
 * Implements weighted scoring with dynamic context adjustment
 */
export class ScoringAlgorithm {
  private config: PrioritizationConfiguration;

  constructor(config: PrioritizationConfiguration) {
    this.config = config;
  }

  /**
   * Calculate prioritization score for a single issue
   */
  async calculateScore(
    issue: Issue,
    context: IssueContext,
    classification: IssueClassification,
    projectContext: ProjectContext
  ): Promise<{
    finalScore: number;
    scoringFactors: ScoringFactors;
    triageSuggestion: TriageSuggestion;
  }> {
    const _startTime = Date.now();

    // Calculate base scores
    const severityScore = this.calculateSeverityScore(issue, classification);
    const impactScore = this.calculateImpactScore(issue, context, projectContext);
    const effortScore = this.calculateEffortScore(issue, context, classification);
    const businessValueScore = this.calculateBusinessValueScore(context, projectContext);

    // Apply weights and calculate weighted sum
    const weightedScore =
      (severityScore * this.config.weights.severity) +
      (impactScore * this.config.weights.impact) +
      (effortScore * this.config.weights.effort) +
      (businessValueScore * this.config.weights.businessValue);

    // Apply context-based adjustments
    const contextMultiplier = this.calculateContextMultiplier(context, projectContext);
    const classificationBonus = this.calculateClassificationBonus(classification);
    const workflowAdjustment = this.calculateWorkflowAdjustment(projectContext);

    // Calculate final score (1-10 scale)
    const finalScore = Math.max(1, Math.min(10,
      (weightedScore * contextMultiplier * classificationBonus) + workflowAdjustment
    ));

    // Generate triage suggestion
    const triageSuggestion = this.generateTriageSuggestion(
      issue,
      context,
      classification,
      finalScore,
      projectContext
    );

    const scoringFactors: ScoringFactors = {
      severityWeight: this.config.weights.severity,
      impactWeight: this.config.weights.impact,
      effortWeight: this.config.weights.effort,
      businessValueWeight: this.config.weights.businessValue,
      contextMultiplier,
      classificationBonus,
      workflowAdjustment
    };

    return {
      finalScore: Math.round(finalScore * 10) / 10, // Round to 1 decimal place
      scoringFactors,
      triageSuggestion
    };
  }

  /**
   * Calculate severity score based on issue type and classification
   */
  private calculateSeverityScore(issue: Issue, classification: IssueClassification): number {
    // Base severity from issue type
    const typeSeverity = {
      'error': 8,
      'warning': 5,
      'info': 2
    }[issue.type]  || 5;

    // Adjust based on ML classification severity
    const classificationSeverity = {
      'critical': 10,
      'high': 8,
      'medium': 5,
      'low': 2
    }[classification.severity] ?? 5;

    // Weighted average with classification confidence
    const confidence = classification.confidence;
    return (typeSeverity * (1 - confidence)) + (classificationSeverity * confidence);
  }

  /**
   * Calculate impact score based on context and potential effects
   */
  private calculateImpactScore(
    issue: Issue,
    context: IssueContext,
    projectContext: ProjectContext
  ): number {
    let impact = 5; // Base impact

    // File path impact (critical files have higher impact)
    if (context.filePath.includes('/src/')) impact += 1;
    if (context.filePath.includes('/test/')) impact -= 1;
    if (context.filePath.includes('/config/')) impact += 2;

    // Component criticality impact
    const criticalityImpact = {
      'critical': 3,
      'high': 2,
      'medium': 1,
      'low': 0
    }[context.criticality] ?? 0;
    impact += criticalityImpact;

    // Recent changes impact (issues in recently changed files are more urgent)
    if (context.recentChanges) impact += 1;

    // Business domain impact
    if (context.businessDomain) {
      const businessImpact = projectContext.teamPreferences.priorities;
      // Adjust based on domain mapping to priorities
      if (context.businessDomain.includes('security')) impact += businessImpact.security / 2;
      if (context.businessDomain.includes('performance')) impact += businessImpact.performance / 2;
      if (context.businessDomain.includes('user')) impact += businessImpact.features / 2;
    }

    return Math.max(1, Math.min(10, impact));
  }

  /**
   * Calculate effort score (inverse - lower effort means higher priority score)
   */
  private calculateEffortScore(
    issue: Issue,
    context: IssueContext,
    classification: IssueClassification
  ): number {
    let effort = 5; // Base effort

    // Adjust based on code complexity
    effort += context.complexityMetrics.cyclomaticComplexity / 5;
    effort += context.complexityMetrics.cognitiveComplexity / 10;
    effort += Math.log10(context.complexityMetrics.linesOfCode) / 2;

    // Adjust based on fixability
    if (issue.fixable) effort -= 2;

    // Adjust based on classification (some categories are harder to fix)
    const categoryEffort = {
      'bug': 4,
      'performance': 6,
      'security': 7,
      'maintainability': 5,
      'documentation': 2,
      'feature': 8
    }[classification.category] ?? 5;
    effort = (effort + categoryEffort) / 2;

    return Math.max(1, Math.min(10, effort));
  }

  /**
   * Calculate business value score
   */
  private calculateBusinessValueScore(context: IssueContext, projectContext: ProjectContext): number {
    let businessValue = 5; // Base value

    // Component criticality directly affects business value
    const criticalityValue = {
      'critical': 9,
      'high': 7,
      'medium': 5,
      'low': 3
    }[context.criticality] ?? 5;
    businessValue = (businessValue + criticalityValue) / 2;

    // Adjust based on team priorities
    const priorities = projectContext.teamPreferences.priorities;

    // Map component types to business value based on team priorities
    if (context.componentType.includes('security')) businessValue = (businessValue + priorities.security) / 2;
    if (context.componentType.includes('performance')) businessValue = (businessValue + priorities.performance) / 2;
    if (context.componentType.includes('ui') ?? context.componentType.includes('user')) {
      businessValue = (businessValue + priorities.features) / 2;
    }

    return Math.max(1, Math.min(10, businessValue));
  }

  /**
   * Calculate context multiplier for dynamic adjustment
   */
  private calculateContextMultiplier(context: IssueContext, projectContext: ProjectContext): number {
    let multiplier = 1.0;

    // Adjust for team workflow
    if (projectContext.currentSprint) {
      // Higher multiplier for issues that fit current sprint goals
      const sprintGoals = projectContext.currentSprint.goals;
      const issueRelevance = this.calculateGoalRelevance(context, sprintGoals);
      multiplier += (issueRelevance * 0.3);
    }

    // Adjust for team workload
    if (projectContext.currentSprint) {
      const utilizationRate = projectContext.currentSprint.currentLoad / projectContext.currentSprint.capacity;
      if (utilizationRate > 0.9) multiplier *= 0.8; // Reduce priority if team is overloaded
      else if (utilizationRate < 0.5) multiplier *= 1.2; // Increase priority if team has capacity
    }

    // Adjust for recent changes (issues in active areas get boost)
    if (context.recentChanges) multiplier *= 1.1;

    return Math.max(0.5, Math.min(2.0, multiplier));
  }

  /**
   * Calculate classification bonus based on ML confidence and category
   */
  private calculateClassificationBonus(classification: IssueClassification): number {
    let bonus = 1.0;

    // Confidence bonus
    const confidenceBonus = classification.confidence * 0.2;
    bonus += confidenceBonus;

    // Category-specific bonuses
    const categoryBonuses = {
      'security': 1.3,
      'performance': 1.2,
      'bug': 1.1,
      'maintainability': 1.0,
      'documentation': 0.9,
      'feature': 1.0
    };
    bonus *= categoryBonuses[classification.category]  || 1.0;

    return Math.max(0.8, Math.min(1.5, bonus));
  }

  /**
   * Calculate workflow adjustment based on team preferences
   */
  private calculateWorkflowAdjustment(projectContext: ProjectContext): number {
    const workflow = projectContext.teamPreferences.workflow;

    switch (workflow) {
      case 'scrum':
        // In scrum, prioritize based on sprint goals
        return 0; // Handled in context multiplier
      case 'kanban':
        // In kanban, continuous flow - small adjustments based on WIP limits
        return 0.1;
      case 'waterfall':
        // In waterfall, phase-specific priorities
        return -0.1;
      default:
        return 0;
    }
  }

  /**
   * Generate automated triage suggestion
   */
  private generateTriageSuggestion(
    issue: Issue,
    context: IssueContext,
    classification: IssueClassification,
    finalScore: number,
    projectContext: ProjectContext
  ): TriageSuggestion {
    // Determine action based on score and context
    let action: TriageSuggestion['action'];
    const estimatedEffort = this.estimateEffort(issue, context, classification);

    if (finalScore >= 8) {
      action = 'fix-now';
    } else if (finalScore >= 6) {
      action = 'schedule';
    } else if (finalScore >= 4) {
      action = 'delegate';
    } else if (finalScore >= 2) {
      action = 'monitor';
    } else {
      action = 'ignore';
    }

    // Set priority
    const priority = Math.round(finalScore);

    // Determine assignee if applicable
    let assignee: string | undefined;
    if (action === 'delegate'  || action === 'schedule') {
      assignee = this.suggestAssignee(issue, context, projectContext);
    }

    // Set deadline if urgent
    let deadline: Date | undefined;
    if (action === 'fix-now'  || (action === 'schedule' && finalScore >= 7)) {
      deadline = this.calculateDeadline(finalScore, projectContext);
    }

    // Generate reasoning
    const reasoning = this.generateReasoning(
      issue,
      context,
      classification,
      finalScore,
      action
    );

    // Calculate confidence in suggestion
    const confidence = this.calculateSuggestionConfidence(
      classification.confidence,
      context,
      finalScore
    );

    return {
      action,
      priority,
      estimatedEffort,
      assignee,
      deadline,
      reasoning,
      confidence
    };
  }

  /**
   * Estimate effort in hours for fixing an issue
   */
  private estimateEffort(issue: Issue, context: IssueContext, classification: IssueClassification): number {
    let effort = 1; // Base effort in hours

    // Complexity-based effort estimation
    effort += context.complexityMetrics.cyclomaticComplexity * 0.5;
    effort += context.complexityMetrics.linesOfCode * 0.01;

    // Fixable issues are faster
    if (issue.fixable) effort *= 0.7;

    // Category-based effort multipliers
    const categoryMultipliers = {
      'bug': 1.0,
      'performance': 1.5,
      'security': 2.0,
      'maintainability': 1.2,
      'documentation': 0.5,
      'feature': 2.5
    };
    effort *= categoryMultipliers[classification.category]  || 1.0;

    return Math.max(0.5, Math.round(effort * 10) / 10); // Round to 0.1 hours
  }

  /**
   * Suggest assignee based on expertise and workload
   */
  private suggestAssignee(issue: Issue, context: IssueContext, _projectContext: ProjectContext): string | undefined {
    // This would integrate with team management system
    // For now, return a placeholder
    if (context.componentType.includes('security')) return 'security-team';
    if (context.componentType.includes('performance')) return 'performance-team';
    if (context.componentType.includes('ui')) return 'frontend-team';
    return 'development-team';
  }

  /**
   * Calculate deadline based on priority and team context
   */
  private calculateDeadline(finalScore: number, projectContext: ProjectContext): Date {
    const now = new Date();
    let daysToAdd = 1;

    if (finalScore >= 9) daysToAdd = 1;
    else if (finalScore >= 7) daysToAdd = 3;
    else if (finalScore >= 5) daysToAdd = 7;
    else daysToAdd = 14;

    // Adjust for team workflow
    if (projectContext.currentSprint) {
      const sprintEnd = projectContext.currentSprint.endDate;
      const suggestedDeadline = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      return suggestedDeadline > sprintEnd ? sprintEnd : suggestedDeadline;
    }

    return new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
  }

  /**
   * Generate reasoning for triage suggestion
   */
  private generateReasoning(
    issue: Issue,
    context: IssueContext,
    classification: IssueClassification,
    finalScore: number,
    _action: TriageSuggestion['action']
  ): string {
    const reasons = [];

    if (finalScore >= 8) {
      reasons.push(`High priority score (${finalScore}/10)`);
    }

    if (classification.severity === 'critical') {
      reasons.push('Critical severity classification');
    }

    if (context.criticality === 'critical') {
      reasons.push('Located in critical component');
    }

    if (issue.fixable) {
      reasons.push('Issue is automatically fixable');
    }

    if (context.recentChanges) {
      reasons.push('Located in recently modified code');
    }

    return `${reasons.join('. ')  }.`;
  }

  /**
   * Calculate confidence in triage suggestion
   */
  private calculateSuggestionConfidence(
    classificationConfidence: number,
    context: IssueContext,
    finalScore: number
  ): number {
    let confidence = classificationConfidence * 0.6; // Base confidence from ML

    // Increase confidence for clear-cut cases
    if (finalScore >= 8 || finalScore <= 2) confidence += 0.2;
    if (context.criticality === 'critical') confidence += 0.1;
    if (context.recentChanges) confidence += 0.1;

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Calculate relevance of issue to sprint goals
   */
  private calculateGoalRelevance(context: IssueContext, sprintGoals: string[]): number {
    if (sprintGoals.length === 0) return 0.5;

    // Simple keyword matching for relevance
    const contextText = `${context.filePath} ${context.componentType} ${context.businessDomain ?? ''}`.toLowerCase();

    let relevanceScore = 0;
    for (const goal of sprintGoals) {
      const goalKeywords = goal.toLowerCase().split(' ');
      for (const keyword of goalKeywords) {
        if (contextText.includes(keyword)) {
          relevanceScore += 1;
        }
      }
    }

    return Math.min(1.0, relevanceScore / sprintGoals.length);
  }

  /**
   * Update algorithm configuration
   */
  updateConfiguration(config: Partial<PrioritizationConfiguration>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): PrioritizationConfiguration {
    return { ...this.config };
  }
}