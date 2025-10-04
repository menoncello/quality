import {
  Issue,
  IssuePrioritization,
  PrioritizationRule,
  RuleCondition,
  RuleAction,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  IssueResolutionData
} from '../../../types/src/prioritization';

/**
 * Customizable prioritization rules engine
 * Handles rule definition, validation, execution, and optimization
 */
export class RuleEngine {
  private rules: PrioritizationRule[] = [];
  private conflictResolutionStrategy: 'first-match' | 'highest-weight' | 'combine' = 'highest-weight';

  constructor(conflictResolutionStrategy: 'first-match' | 'highest-weight' | 'combine' = 'highest-weight') {
    this.conflictResolutionStrategy = conflictResolutionStrategy;
  }

  /**
   * Apply custom rules to issue prioritization
   */
  async applyRules(
    issues: Issue[],
    rules: PrioritizationRule[],
    basePrioritizations: IssuePrioritization[]
  ): Promise<IssuePrioritization[]> {
    this.rules = rules.filter(rule => rule.enabled);

    const results: IssuePrioritization[] = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const basePrioritization = basePrioritizations[i];

      const matchingRules = await this.findMatchingRules(issue);
      const adjustedPrioritization = await this.applyRuleActions(
        issue,
        basePrioritization,
        matchingRules
      );

      results.push(adjustedPrioritization);
    }

    return results;
  }

  /**
   * Validate a single rule
   */
  async validateRule(rule: PrioritizationRule): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate rule structure
    if (!rule.id || rule.id.trim() === '') {
      errors.push({
        code: 'MISSING_ID',
        message: 'Rule must have a valid ID',
        field: 'id',
        severity: 'error'
      });
    }

    if (!rule.name || rule.name.trim() === '') {
      errors.push({
        code: 'MISSING_NAME',
        message: 'Rule must have a valid name',
        field: 'name',
        severity: 'error'
      });
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push({
        code: 'MISSING_CONDITIONS',
        message: 'Rule must have at least one condition',
        field: 'conditions',
        severity: 'error'
      });
    }

    if (!rule.actions || rule.actions.length === 0) {
      errors.push({
        code: 'MISSING_ACTIONS',
        message: 'Rule must have at least one action',
        field: 'actions',
        severity: 'error'
      });
    }

    // Validate conditions
    if (rule.conditions) {
      for (let i = 0; i < rule.conditions.length; i++) {
        const condition = rule.conditions[i];
        const conditionErrors = this.validateCondition(condition, `conditions[${i}]`);
        errors.push(...conditionErrors);
      }
    }

    // Validate actions
    if (rule.actions) {
      for (let i = 0; i < rule.actions.length; i++) {
        const action = rule.actions[i];
        const actionErrors = this.validateAction(action, `actions[${i}]`);
        errors.push(...actionErrors);
      }
    }

    // Validate weight
    if (typeof rule.weight !== 'number' || rule.weight < 0 || rule.weight > 1) {
      errors.push({
        code: 'INVALID_WEIGHT',
        message: 'Rule weight must be a number between 0 and 1',
        field: 'weight',
        severity: 'error'
      });
    }

    // Warnings
    if (rule.weight < 0.1) {
      warnings.push({
        code: 'LOW_WEIGHT',
        message: 'Rule has very low weight and may have minimal impact',
        field: 'weight',
        suggestion: 'Consider increasing weight or removing the rule'
      });
    }

    if (rule.conditions && rule.conditions.length > 5) {
      warnings.push({
        code: 'COMPLEX_RULE',
        message: 'Rule has many conditions and may be difficult to maintain',
        field: 'conditions',
        suggestion: 'Consider breaking this into multiple simpler rules'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Optimize rules based on historical data
   */
  async optimizeRules(historicalData: IssueResolutionData[]): Promise<PrioritizationRule[]> {
    const optimizedRules: PrioritizationRule[] = [];

    for (const rule of this.rules) {
      const optimizedRule = await this.optimizeSingleRule(rule, historicalData);
      if (optimizedRule) {
        optimizedRules.push(optimizedRule);
      }
    }

    return optimizedRules;
  }

  /**
   * Check for rule conflicts
   */
  async detectRuleConflicts(rules: PrioritizationRule[]): Promise<RuleConflict[]> {
    const conflicts: RuleConflict[] = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const conflict = await this.compareRulesForConflict(rules[i], rules[j]);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }

  /**
   * Export rules to JSON format
   */
  exportRules(rules: PrioritizationRule[]): string {
    return JSON.stringify(rules, null, 2);
  }

  /**
   * Import rules from JSON format
   */
  importRules(rulesJson: string): PrioritizationRule[] {
    try {
      const rules = JSON.parse(rulesJson) as PrioritizationRule[];

      // Validate all imported rules
      const validRules: PrioritizationRule[] = [];
      for (let i = 0; i < rules.length; i++) {
        // For import, we'll do synchronous validation to avoid async complexity
        if (this.isValidRuleStructure(rules[i])) {
          validRules.push(rules[i]);
        }
      }

      return validRules;
    } catch (error) {
      throw new Error(`Failed to import rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Quick synchronous rule validation for import
   */
  private isValidRuleStructure(rule: PrioritizationRule): boolean {
    return (
      rule.id && rule.id.trim() !== '' &&
      rule.name && rule.name.trim() !== '' &&
      rule.conditions && rule.conditions.length > 0 &&
      rule.actions && rule.actions.length > 0 &&
      typeof rule.weight === 'number' && rule.weight >= 0 && rule.weight <= 1
    );
  }

  /**
   * Find rules that match a specific issue
   */
  private async findMatchingRules(issue: Issue): Promise<PrioritizationRule[]> {
    const matchingRules: PrioritizationRule[] = [];

    for (const rule of this.rules) {
      if (await this.ruleMatchesIssue(rule, issue)) {
        matchingRules.push(rule);
      }
    }

    // Sort by priority and weight based on conflict resolution strategy
    return this.sortMatchingRules(matchingRules);
  }

  /**
   * Check if a rule matches an issue
   */
  private async ruleMatchesIssue(rule: PrioritizationRule, issue: Issue): Promise<boolean> {
    for (const condition of rule.conditions) {
      if (!(await this.conditionMatchesIssue(condition, issue))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a condition matches an issue
   */
  private async conditionMatchesIssue(condition: RuleCondition, issue: Issue): Promise<boolean> {
    const fieldValue = this.getFieldValue(issue, condition.field);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return this.compareValues(fieldValue, conditionValue, '==', condition.caseSensitive);
      case 'contains':
        return this.compareValues(fieldValue, conditionValue, 'contains', condition.caseSensitive);
      case 'startsWith':
        return this.compareValues(fieldValue, conditionValue, 'startsWith', condition.caseSensitive);
      case 'endsWith':
        return this.compareValues(fieldValue, conditionValue, 'endsWith', condition.caseSensitive);
      case 'regex':
        return this.regexMatch(fieldValue, conditionValue as string, condition.caseSensitive);
      case 'gt':
        return this.compareValues(fieldValue, conditionValue, '>', condition.caseSensitive);
      case 'lt':
        return this.compareValues(fieldValue, conditionValue, '<', condition.caseSensitive);
      case 'gte':
        return this.compareValues(fieldValue, conditionValue, '>=', condition.caseSensitive);
      case 'lte':
        return this.compareValues(fieldValue, conditionValue, '<=', condition.caseSensitive);
      default:
        return false;
    }
  }

  /**
   * Get field value from issue
   */
  private getFieldValue(issue: Issue, field: string): unknown {
    const fieldPath = field.split('.');
    let value: unknown = issue;

    for (const path of fieldPath) {
      if (value && typeof value === 'object' && path in value) {
        value = (value as Record<string, unknown>)[path];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Compare values based on operator
   */
  private compareValues(
    fieldValue: unknown,
    conditionValue: unknown,
    operator: string,
    caseSensitive: boolean = true
  ): boolean {
    // Handle null/undefined values
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }

    // Convert to strings for string comparisons
    if (typeof fieldValue === 'string' || typeof conditionValue === 'string') {
      const fieldStr = String(fieldValue);
      const conditionStr = String(conditionValue);

      if (!caseSensitive) {
        return this.compareStringValues(
          fieldStr.toLowerCase(),
          conditionStr.toLowerCase(),
          operator
        );
      }

      return this.compareStringValues(fieldStr, conditionStr, operator);
    }

    // Numeric comparisons
    if (typeof fieldValue === 'number' && typeof conditionValue === 'number') {
      return this.compareNumericValues(fieldValue, conditionValue, operator);
    }

    // Boolean comparisons
    if (typeof fieldValue === 'boolean' && typeof conditionValue === 'boolean') {
      return this.compareBooleanValues(fieldValue, conditionValue, operator);
    }

    return false;
  }

  /**
   * Compare string values
   */
  private compareStringValues(fieldValue: string, conditionValue: string, operator: string): boolean {
    switch (operator) {
      case '==':
        return fieldValue === conditionValue;
      case 'contains':
        return fieldValue.includes(conditionValue);
      case 'startsWith':
        return fieldValue.startsWith(conditionValue);
      case 'endsWith':
        return fieldValue.endsWith(conditionValue);
      case '>':
      case '<':
      case '>=':
      case '<=':
        return fieldValue.localeCompare(conditionValue) * this.getOperatorMultiplier(operator) > 0;
      default:
        return false;
    }
  }

  /**
   * Compare numeric values
   */
  private compareNumericValues(fieldValue: number, conditionValue: number, operator: string): boolean {
    switch (operator) {
      case '==':
        return fieldValue === conditionValue;
      case '>':
        return fieldValue > conditionValue;
      case '<':
        return fieldValue < conditionValue;
      case '>=':
        return fieldValue >= conditionValue;
      case '<=':
        return fieldValue <= conditionValue;
      default:
        return false;
    }
  }

  /**
   * Compare boolean values
   */
  private compareBooleanValues(fieldValue: boolean, conditionValue: boolean, operator: string): boolean {
    if (operator === '==') {
      return fieldValue === conditionValue;
    }
    return false;
  }

  /**
   * Perform regex match
   */
  private regexMatch(fieldValue: unknown, pattern: string, caseSensitive: boolean = true): boolean {
    const fieldStr = String(fieldValue);
    const flags = caseSensitive ? 'g' : 'gi';

    try {
      const regex = new RegExp(pattern, flags);
      return regex.test(fieldStr);
    } catch {
      return false;
    }
  }

  /**
   * Get operator multiplier for string comparisons
   */
  private getOperatorMultiplier(operator: string): number {
    switch (operator) {
      case '>':
      case '>=':
        return 1;
      case '<':
      case '<=':
        return -1;
      default:
        return 0;
    }
  }

  /**
   * Sort matching rules based on conflict resolution strategy
   */
  private sortMatchingRules(rules: PrioritizationRule[]): PrioritizationRule[] {
    switch (this.conflictResolutionStrategy) {
      case 'first-match':
        return rules.sort((a, b) => a.priority - b.priority);
      case 'highest-weight':
        return rules.sort((a, b) => b.weight - a.weight);
      case 'combine':
        return rules.sort((a, b) => b.weight - a.weight);
      default:
        return rules;
    }
  }

  /**
   * Apply rule actions to prioritization
   */
  private async applyRuleActions(
    issue: Issue,
    basePrioritization: IssuePrioritization,
    matchingRules: PrioritizationRule[]
  ): Promise<IssuePrioritization> {
    let adjustedPrioritization = { ...basePrioritization };

    for (const rule of matchingRules) {
      for (const action of rule.actions) {
        adjustedPrioritization = await this.applyAction(
          adjustedPrioritization,
          action,
          rule.weight
        );
      }

      // Update rule metadata
      rule.metadata.lastApplied = new Date();
      rule.metadata.applicationCount++;
    }

    return adjustedPrioritization;
  }

  /**
   * Apply a single action to prioritization
   */
  private async applyAction(
    prioritization: IssuePrioritization,
    action: RuleAction,
    weight: number
  ): Promise<IssuePrioritization> {
    const result = { ...prioritization };

    switch (action.type) {
      case 'adjustScore':
        const adjustment = (action.parameters.adjustment as number) || 0;
        result.finalScore = Math.max(1, Math.min(10, result.finalScore + (adjustment * weight)));
        break;

      case 'setPriority':
        const newPriority = (action.parameters.priority as number) || 5;
        result.finalScore = Math.max(1, Math.min(10, newPriority));
        break;

      case 'skipTriage':
        result.triageSuggestion.action = 'ignore';
        result.triageSuggestion.reasoning = 'Skipped by rule';
        break;

      case 'customAction':
        // Handle custom actions based on parameters
        await this.applyCustomAction(result, action.parameters);
        break;
    }

    return result;
  }

  /**
   * Apply custom action
   */
  private async applyCustomAction(prioritization: IssuePrioritization, parameters: Record<string, unknown>): Promise<void> {
    // Custom action implementation based on parameters
    // This could include things like:
    // - Modifying triage suggestions
    // - Adding metadata
    // - Changing classification results

    if (parameters.triageAction) {
      prioritization.triageSuggestion.action = parameters.triageAction as any;
    }

    if (parameters.reasoning) {
      prioritization.triageSuggestion.reasoning = parameters.reasoning as string;
    }

    if (parameters.assignee) {
      prioritization.triageSuggestion.assignee = parameters.assignee as string;
    }
  }

  /**
   * Validate a rule condition
   */
  private validateCondition(condition: RuleCondition, fieldPath: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!condition.field || condition.field.trim() === '') {
      errors.push({
        code: 'MISSING_FIELD',
        message: 'Condition must specify a field',
        field: `${fieldPath}.field`,
        severity: 'error'
      });
    }

    if (!condition.operator || !this.isValidOperator(condition.operator)) {
      errors.push({
        code: 'INVALID_OPERATOR',
        message: `Invalid operator: ${condition.operator}`,
        field: `${fieldPath}.operator`,
        severity: 'error'
      });
    }

    if (condition.value === undefined || condition.value === null) {
      errors.push({
        code: 'MISSING_VALUE',
        message: 'Condition must specify a value',
        field: `${fieldPath}.value`,
        severity: 'error'
      });
    }

    return errors;
  }

  /**
   * Validate a rule action
   */
  private validateAction(action: RuleAction, fieldPath: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!action.type || !this.isValidActionType(action.type)) {
      errors.push({
        code: 'INVALID_ACTION_TYPE',
        message: `Invalid action type: ${action.type}`,
        field: `${fieldPath}.type`,
        severity: 'error'
      });
    }

    if (!action.parameters || typeof action.parameters !== 'object') {
      errors.push({
        code: 'MISSING_PARAMETERS',
        message: 'Action must specify parameters',
        field: `${fieldPath}.parameters`,
        severity: 'error'
      });
    }

    return errors;
  }

  /**
   * Check if operator is valid
   */
  private isValidOperator(operator: string): boolean {
    const validOperators = ['equals', 'contains', 'startsWith', 'endsWith', 'regex', 'gt', 'lt', 'gte', 'lte'];
    return validOperators.includes(operator);
  }

  /**
   * Check if action type is valid
   */
  private isValidActionType(type: string): boolean {
    const validTypes = ['adjustScore', 'setPriority', 'skipTriage', 'customAction'];
    return validTypes.includes(type);
  }

  /**
   * Optimize a single rule based on historical data
   */
  private async optimizeSingleRule(rule: PrioritizationRule, historicalData: IssueResolutionData[]): Promise<PrioritizationRule | null> {
    // Simple optimization: adjust weight based on rule effectiveness
    // In a real implementation, this would use more sophisticated optimization algorithms

    const effectiveness = this.calculateRuleEffectiveness(rule, historicalData);

    if (effectiveness < 0.3) {
      // Rule is not effective, suggest removal
      return null;
    }

    // Adjust weight based on effectiveness
    const optimizedWeight = Math.max(0.1, Math.min(1.0, effectiveness));

    return {
      ...rule,
      weight: optimizedWeight,
      metadata: {
        ...rule.metadata,
        updatedAt: new Date(),
        version: this.incrementVersion(rule.metadata.version)
      }
    };
  }

  /**
   * Calculate rule effectiveness from historical data
   */
  private calculateRuleEffectiveness(rule: PrioritizationRule, historicalData: IssueResolutionData[]): number {
    // Simplified effectiveness calculation
    // In a real implementation, this would analyze how well the rule predicted outcomes

    let successfulApplications = 0;
    let totalApplications = 0;

    for (const data of historicalData) {
      // Check if rule would have applied to this issue
      // This is a simplified check - in practice, you'd need the original issue data
      if (Math.random() > 0.7) { // Simulated rule application
        totalApplications++;
        if (data.resolutionTime < 10 && data.success) {
          successfulApplications++;
        }
      }
    }

    return totalApplications > 0 ? successfulApplications / totalApplications : 0.5;
  }

  /**
   * Compare two rules for conflicts
   */
  private async compareRulesForConflict(
    rule1: PrioritizationRule,
    rule2: PrioritizationRule
  ): Promise<RuleConflict | null> {
    // Check for conflicting conditions or actions
    const hasConflictingActions = this.hasConflictingActions(rule1.actions, rule2.actions);
    const hasSimilarConditions = this.hasSimilarConditions(rule1.conditions, rule2.conditions);

    if (hasConflictingActions && hasSimilarConditions) {
      return {
        rule1Id: rule1.id,
        rule2Id: rule2.id,
        conflictType: 'conflicting-actions',
        description: `Rules ${rule1.name} and ${rule2.name} have conflicting actions with similar conditions`,
        severity: 'high',
        suggestion: 'Review and resolve conflicts between these rules'
      };
    }

    return null;
  }

  /**
   * Check if actions conflict
   */
  private hasConflictingActions(actions1: RuleAction[], actions2: RuleAction[]): boolean {
    // Simple check for conflicting adjustments
    const adjustments1 = actions1.filter(a => a.type === 'adjustScore');
    const adjustments2 = actions2.filter(a => a.type === 'adjustScore');

    for (const action1 of adjustments1) {
      for (const action2 of adjustments2) {
        const adj1 = action1.parameters.adjustment as number || 0;
        const adj2 = action2.parameters.adjustment as number || 0;

        // If adjustments have opposite signs, they might conflict
        if ((adj1 > 0 && adj2 < 0) || (adj1 < 0 && adj2 > 0)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if conditions are similar
   */
  private hasSimilarConditions(conditions1: RuleCondition[], conditions2: RuleCondition[]): boolean {
    // Simple similarity check based on field overlap
    const fields1 = conditions1.map(c => c.field);
    const fields2 = conditions2.map(c => c.field);

    const overlap = fields1.filter(field => fields2.includes(field));
    return overlap.length > 0;
  }

  /**
   * Increment version string
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length >= 3) {
      const patch = parseInt(parts[2] || '0') + 1;
      return `${parts[0]}.${parts[1]}.${patch}`;
    }
    return version;
  }
}

/**
 * Rule conflict information
 */
interface RuleConflict {
  rule1Id: string;
  rule2Id: string;
  conflictType: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}