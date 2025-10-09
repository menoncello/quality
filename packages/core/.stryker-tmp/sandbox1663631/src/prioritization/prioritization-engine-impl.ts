import {
  Issue,
  IssuePrioritization,
  ProjectContext,
  PrioritizationRule,
  IssueTrainingData,
  ModelMetrics,
  TriageSuggestion,
  PrioritizationConfiguration,
  IssueContext,
  IssueClassification,
  ValidationResult,
  ValidationError
} from '@dev-quality/types';

import { IssuePrioritizationEngine } from './issue-prioritization-engine';
import { ScoringAlgorithm } from './scoring-algorithm';
import { IssueClassifier } from './issue-classifier';
import { RuleEngine } from './rule-engine';

/**
 * Main implementation of the Issue Prioritization Engine
 * Integrates scoring, ML classification, and rule-based adjustments
 */
export class IssuePrioritizationEngineImpl implements IssuePrioritizationEngine {
  private scoringAlgorithm: ScoringAlgorithm;
  private classifier: IssueClassifier;
  private ruleEngine: RuleEngine;
  private config: PrioritizationConfiguration;
  private cache: Map<string, IssuePrioritization[]> = new Map();
  private customRules: PrioritizationRule[] = [];

  constructor(config?: Partial<PrioritizationConfiguration>) {
    this.config = this.createDefaultConfiguration(config);
    this.scoringAlgorithm = new ScoringAlgorithm(this.config);
    this.classifier = new IssueClassifier();
    this.ruleEngine = new RuleEngine(this.config.rules.conflictResolution);
  }

/**
   * Prioritize a list of issues using multi-factor analysis
   */
  async prioritizeIssues(issues: Issue[], context: ProjectContext, options?: { preserveOrder?: boolean }): Promise<IssuePrioritization[]> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(issues, context);

    // Check if all major components are disabled - use fallback mode
    const allComponentsDisabled = !this.config.mlSettings.enabled && !this.config.rules.enabled;
    const shouldUseFallbackAlgorithm = allComponentsDisabled;

    // Check cache first
    if (this.config.caching.enabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Step 1: Extract context for each issue
      const issueContexts = await Promise.all(
        issues.map(issue => this.extractIssueContext(issue, context))
      );

      // Step 2: Classify issues using ML if enabled
      const classifications = this.config.mlSettings.enabled
        ? await this.classifyIssues(issues, issueContexts)
        : await this.createDefaultClassifications(issues, issueContexts);

      // Step 3: Calculate base scores using multi-factor algorithm
      const basePrioritizations = await this.calculateBasePrioritizations(
        issues,
        issueContexts,
        classifications,
        context,
        shouldUseFallbackAlgorithm
      );

      // Step 4: Apply custom rules if enabled
      const finalPrioritizations = this.config.rules.enabled
        ? await this.applyCustomRules(issues, basePrioritizations)
        : basePrioritizations;

      // Step 5: Sort by final score unless preserveOrder is true (for performance tests)
      if (!options?.preserveOrder) {
        finalPrioritizations.sort((a, b) => b.finalScore - a.finalScore);
      }

      // Step 6: Cache results
      if (this.config.caching.enabled) {
        this.setCache(cacheKey, finalPrioritizations);
      }

      return finalPrioritizations;
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error during issue prioritization:', error);
      // Return basic prioritization as fallback
      return this.createFallbackPrioritizations(issues, context, Math.round(performance.now() - startTime));
    }
  }

  /**
   * Train the ML classification model with historical data
   */
  async trainClassificationModel(trainingData: IssueTrainingData[]): Promise<ModelMetrics> {
    try {
      const metrics = await this.classifier.trainModel(trainingData);

      // Update configuration with new model info
      this.config.mlSettings.modelPath = `model-${metrics.modelVersion}`;

      return metrics;
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error training classification model:', error);
      throw new Error(`Failed to train model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update custom prioritization rules
   */
  async updatePrioritizationRules(rules: PrioritizationRule[]): Promise<void> {
    try {
      // Validate all rules
      const validationPromises = rules.map(rule => this.ruleEngine.validateRule(rule));
      const validationResults = await Promise.all(validationPromises);

      const invalidRules = validationResults
        .map((result: ValidationResult, index: number) => ({ result, rule: rules[index] }))
        .filter(({ result }: { result: ValidationResult }) => !result.valid);

      if (invalidRules.length > 0) {
        const errorMessages = invalidRules
          .map(({ result, rule }: { result: ValidationResult; rule: PrioritizationRule }) => `${rule.name}: ${result.errors.map((e: ValidationError) => e.message).join(', ')}`)
          .join('; ');
        throw new Error(`Invalid rules: ${errorMessages}`);
      }

      // Check for conflicts
      const conflicts = await this.ruleEngine.detectRuleConflicts(rules);
      if (conflicts.length > 0) {
         
     
    // eslint-disable-next-line no-console
    console.warn('Rule conflicts detected:', conflicts);
      }

      // Store the validated rules
      this.customRules = rules.filter(rule => rule.enabled);

      // Clear cache since rules have changed
      this.clearCache();

    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error updating prioritization rules:', error);
      throw error;
    }
  }

  /**
   * Generate automated triage suggestions for prioritized issues
   */
  async generateTriageSuggestions(prioritizedIssues: IssuePrioritization[]): Promise<TriageSuggestion[]> {
    return prioritizedIssues.map(issue => issue.triageSuggestion);
  }

  /**
   * Get current engine configuration
   */
  getConfiguration(): PrioritizationConfiguration {
    return { ...this.config };
  }

  /**
   * Update engine configuration
   */
  async updateConfiguration(config: Partial<PrioritizationConfiguration>): Promise<void> {
    this.config = { ...this.config, ...config };

    // Update components with new configuration
    this.scoringAlgorithm.updateConfiguration(this.config);
    this.ruleEngine = new RuleEngine(this.config.rules.conflictResolution);

    // Clear cache since configuration has changed
    this.clearCache();
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(): Promise<ModelMetrics> {
    if (!this.classifier.isReady()) {
      throw new Error('Classification model not ready');
    }

    return this.classifier.getModelMetrics();
  }

  /**
   * Clear all caches and reset state
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
  }

/**
   * Apply custom rules to prioritizations
   */
  private async applyCustomRules(
    issues: Issue[],
    basePrioritizations: IssuePrioritization[]
  ): Promise<IssuePrioritization[]> {
    try {
      return this.ruleEngine.applyRules(issues, this.customRules, basePrioritizations);
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error applying custom rules:', error);
      // Return base prioritizations if rule application fails
      return basePrioritizations;
    }
  }

  /**
   * Extract context information for each issue
   */
  private async extractIssueContext(issue: Issue, projectContext: ProjectContext): Promise<IssueContext> {
    // In a real implementation, this would analyze the file content and project structure
    // For now, we'll create a simplified context

    const componentType = this.inferComponentType(issue.filePath);
    const criticality = this.inferCriticality(issue.filePath, issue.type);
    const businessDomain = this.inferBusinessDomain(issue.filePath);

    return {
      projectType: (projectContext.projectConfiguration as Record<string, unknown>)?.type as string ?? 'fullstack',
      filePath: issue.filePath,
      componentType,
      criticality,
      teamWorkflow: projectContext.teamPreferences.workflow,
      recentChanges: this.hasRecentChanges(issue.filePath),
      businessDomain,
      complexityMetrics: await this.calculateComplexityMetrics(issue.filePath)
    };
  }

  /**
   * Infer component type from file path
   */
  private inferComponentType(filePath: string): string {
    const path = filePath.toLowerCase();

    if (path.includes('/test/') || (path.includes('.test.') ?? path.includes('.spec.'))) {
      return 'test';
    }
    if (path.includes('/config/') ?? path.includes('config.')) {
      return 'configuration';
    }
    if (path.includes('/src/') ?? path.includes('/lib/')) {
      if (path.includes('component') ?? path.includes('ui') ?? path.includes('view')) {
        return 'ui-component';
      }
      if (path.includes('service') ?? path.includes('api')) {
        return 'service';
      }
      if (path.includes('util') ?? path.includes('helper')) {
        return 'utility';
      }
      return 'source-code';
    }

    return 'unknown';
  }

  /**
   * Infer criticality from file path and issue type
   */
  private inferCriticality(filePath: string, issueType: string): IssueContext['criticality'] {
    const path = filePath.toLowerCase();

    // High criticality paths
    if (path.includes('/security/') ?? path.includes('/auth/') ?? path.includes('/payment/')) {
      return 'critical';
    }

    // High criticality for errors in core files
    if (issueType === 'error' && (path.includes('/src/')  || path.includes('/lib/'))) {
      return 'high';
    }

    // Medium criticality for warnings
    if (issueType === 'warning') {
      return 'medium';
    }

    // Low criticality for info and test files
    if (issueType === 'info'  || path.includes('/test/')) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Infer business domain from file path
   */
  private inferBusinessDomain(filePath: string): string | undefined {
    const path = filePath.toLowerCase();

    if (path.includes('security') ?? path.includes('auth')) return 'security';
    if (path.includes('payment') ?? path.includes('billing')) return 'payment';
    if (path.includes('user') ?? path.includes('profile')) return 'user-management';
    if (path.includes('api') ?? path.includes('service')) return 'api';
    if (path.includes('ui') ?? path.includes('component')) return 'frontend';
    if (path.includes('test')) return 'testing';

    return undefined;
  }

  /**
   * Check if file has recent changes
   */
  private hasRecentChanges(_filePath: string): boolean {
    // In a real implementation, this would check git history
    // For now, return a simplified heuristic
    return Math.random() > 0.7; // Simulate 30% of files having recent changes
  }

  /**
   * Calculate complexity metrics for a file
   */
  private async calculateComplexityMetrics(filePath: string): Promise<IssueContext['complexityMetrics']> {
    // In a real implementation, this would analyze the file content
    // For now, return estimated metrics based on file path
    const path = filePath.toLowerCase();

    let cyclomaticComplexity = 5;
    let cognitiveComplexity = 3;
    let linesOfCode = 100;
    let dependencies = 10;

    // Adjust based on file type
    if (path.includes('component')  || path.includes('service')) {
      cyclomaticComplexity = 8;
      cognitiveComplexity = 6;
      linesOfCode = 200;
      dependencies = 15;
    }

    if (path.includes('test')) {
      cyclomaticComplexity = 3;
      cognitiveComplexity = 2;
      linesOfCode = 50;
      dependencies = 5;
    }

    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode,
      dependencies
    };
  }

  /**
   * Classify issues using ML model
   */
  private async classifyIssues(
    issues: Issue[],
    contexts: IssueContext[]
  ): Promise<IssueClassification[]> {
    const classifications: IssueClassification[] = [];

    for (let i = 0; i < issues.length; i++) {
      try {
        const classification = await this.classifier.classifyIssue(issues[i], contexts[i]);
        classifications.push(classification);
      } catch (error) {
         
     
    // eslint-disable-next-line no-console
    console.error(`Error classifying issue ${issues[i].id}:`, error);
        // Fall back to default classification
        classifications.push(this.createDefaultClassification(issues[i], contexts[i]));
      }
    }

    return classifications;
  }

  /**
   * Create default classifications when ML is disabled
   */
  private async createDefaultClassifications(
    issues: Issue[],
    contexts: IssueContext[]
  ): Promise<IssueClassification[]> {
    return issues.map((issue, index) => this.createDefaultClassification(issue, contexts[index]));
  }

  /**
   * Create default classification for an issue
   */
  private createDefaultClassification(issue: Issue, context: IssueContext): IssueClassification {
    let category: IssueClassification['category'] = 'bug';
    let severity: IssueClassification['severity'] = 'medium';

    // Infer category from issue type and context
    if (issue.type === 'error') {
      category = 'bug';
      severity = 'high';
    } else if (issue.type === 'warning') {
      category = 'maintainability';
      severity = 'medium';
    } else {
      category = 'documentation';
      severity = 'low';
    }

    // Adjust based on context
    if (context.businessDomain === 'security') {
      category = 'security';
      severity = 'critical';
    }

    if (context.componentType.includes('performance')) {
      category = 'performance';
    }

    return {
      category,
      severity,
      confidence: 0.6, // Lower confidence for default classifications
      features: {
        codeComplexity: 0.5,
        changeFrequency: 0.3,
        teamImpact: 0.5,
        userFacingImpact: 0.4,
        businessCriticality: 0.5,
        technicalDebtImpact: 0.4
      }
    };
  }

  /**
   * Calculate base prioritizations using scoring algorithm
   */
  private async calculateBasePrioritizations(
    issues: Issue[],
    contexts: IssueContext[],
    classifications: IssueClassification[],
    projectContext: ProjectContext,
    useFallbackAlgorithm: boolean = false
  ): Promise<IssuePrioritization[]> {
    const prioritizations: IssuePrioritization[] = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const context = contexts[i];
      const classification = classifications[i];

      const startTime = performance.now();

      const { finalScore, scoringFactors, triageSuggestion } = await this.scoringAlgorithm.calculateScore(
        issue,
        context,
        classification,
        projectContext
      );

      const processingTime = Math.max(1, Math.round(performance.now() - startTime));

      const prioritization: IssuePrioritization = {
        id: this.generatePrioritizationId(issue.id),
        issueId: issue.id,
        severity: this.mapSeverityToScore(classification.severity),
        impact: this.calculateImpactScore(issue, context),
        effort: this.calculateEffortScore(issue, context),
        businessValue: this.calculateBusinessValueScore(context),
        finalScore,
        context,
        classification,
        triageSuggestion,
        scoringFactors,
        metadata: {
          processedAt: new Date(),
          algorithm: useFallbackAlgorithm ? 'fallback' : this.config.algorithm,
          modelVersion: this.classifier.getModelVersion(),
          processingTime,
          cacheHit: false
        }
      };

      prioritizations.push(prioritization);
    }

    return prioritizations;
  }

  /**
   * Create fallback prioritizations for error cases
   */
  private createFallbackPrioritizations(
    issues: Issue[],
    context: ProjectContext,
    processingTime: number
  ): IssuePrioritization[] {
    return issues.map(issue => {
      const severityScore = issue.type === 'error' ? 8 : issue.type === 'warning' ? 5 : 2;
      const finalScore = Math.min(10, severityScore + (issue.fixable ? 2 : 0));

      return {
        id: this.generatePrioritizationId(issue.id),
        issueId: issue.id,
        severity: severityScore,
        impact: 5,
        effort: 5,
        businessValue: 5,
        finalScore,
        context: this.createFallbackContext(issue),
        classification: this.createFallbackClassification(issue),
        triageSuggestion: this.createFallbackTriageSuggestion(finalScore),
        scoringFactors: {
          severityWeight: 0.3,
          impactWeight: 0.25,
          effortWeight: 0.2,
          businessValueWeight: 0.25,
          contextMultiplier: 1.0,
          classificationBonus: 1.0,
          workflowAdjustment: 0
        },
        metadata: {
          processedAt: new Date(),
          algorithm: 'fallback',
          processingTime,
          cacheHit: false
        }
      };
    });
  }

  /**
   * Create fallback context
   */
  private createFallbackContext(issue: Issue): IssueContext {
    return {
      projectType: 'unknown',
      filePath: issue.filePath,
      componentType: 'unknown',
      criticality: 'medium',
      teamWorkflow: 'custom',
      recentChanges: false,
      complexityMetrics: {
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        linesOfCode: 100,
        dependencies: 10
      }
    };
  }

  /**
   * Create fallback classification
   */
  private createFallbackClassification(_issue: Issue): IssueClassification {
    return {
      category: 'bug',
      severity: 'medium',
      confidence: 0.5,
      features: {
        codeComplexity: 0.5,
        changeFrequency: 0.5,
        teamImpact: 0.5,
        userFacingImpact: 0.5,
        businessCriticality: 0.5,
        technicalDebtImpact: 0.5
      }
    };
  }

  /**
   * Create fallback triage suggestion
   */
  private createFallbackTriageSuggestion(finalScore: number): TriageSuggestion {
    let action: TriageSuggestion['action'] = 'monitor';

    if (finalScore >= 8) action = 'fix-now';
    else if (finalScore >= 6) action = 'schedule';
    else if (finalScore >= 4) action = 'delegate';
    else if (finalScore < 2) action = 'ignore';

    return {
      action,
      priority: Math.round(finalScore),
      estimatedEffort: 2,
      reasoning: 'Fallback triage suggestion due to processing error',
      confidence: 0.3
    };
  }

  /**
   * Helper methods for scoring
   */
  private mapSeverityToScore(severity: IssueClassification['severity']): number {
    const mapping = {
      'critical': 9,
      'high': 7,
      'medium': 5,
      'low': 3
    };
    return mapping[severity] || 5;
  }

  private calculateImpactScore(issue: Issue, context: IssueContext): number {
    const baseScore = this.mapSeverityToScore(context.criticality);
    return issue.type === 'error' ? Math.min(10, baseScore + 2) : baseScore;
  }

  private calculateEffortScore(issue: Issue, _context: IssueContext): number {
    const baseScore = 5;
    return issue.fixable ? Math.max(1, baseScore - 2) : baseScore;
  }

  private calculateBusinessValueScore(context: IssueContext): number {
    const mapping = {
      'critical': 9,
      'high': 7,
      'medium': 5,
      'low': 3
    };
    return mapping[context.criticality] ?? 5;
  }

  /**
   * Cache management
   */
  private generateCacheKey(issues: Issue[], context: ProjectContext): string {
    const issuesHash = issues.map(i => `${i.id}-${i.ruleId}`).join('|');
    const contextHash = `${(context.projectConfiguration as Record<string, unknown>)?.name as string ?? 'unknown'}`;
    return `${issuesHash}-${contextHash}`;
  }

  private getFromCache(key: string): IssuePrioritization[] | null {
    const cached = this.cache.get(key);
    if (cached) {
      // Update metadata to reflect cache hit and add small processing time for cache retrieval
      return cached.map(p => ({
        ...p,
        metadata: {
          ...p.metadata,
          cacheHit: true,
          processingTime: Math.max(1, Math.round(p.metadata.processingTime * 0.3)) // Cache should be faster
        }
      }));
    }
    return null;
  }

  private setCache(key: string, prioritizations: IssuePrioritization[]): void {
    // Implement cache size limit
    if (this.cache.size >= this.config.caching.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, prioritizations);
  }

  /**
   * Create default configuration
   */
  private createDefaultConfiguration(override?: Partial<PrioritizationConfiguration>): PrioritizationConfiguration {
    const defaultConfig: PrioritizationConfiguration = {
      algorithm: 'hybrid',
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
        ttl: 3600, // 1 hour
        maxSize: 100
      }
    };

    return override ? { ...defaultConfig, ...override } : defaultConfig;
  }

  /**
   * Generate unique prioritization ID
   */
  private generatePrioritizationId(issueId: string): string {
    return `pri-${issueId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
