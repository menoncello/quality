/**
 * Prioritization Service Tests
 */

import { describe, it, expect, jest } from 'bun:test';
import { prioritizationService } from '../../../src/services/prioritization-service';
import type { AnalysisResult, Issue } from '../../../src/types/analysis';

// Tests will use the mock fallback engine in the service

describe('PrioritizationService', () => {
  const mockIssue: Issue = {
    id: 'issue-1',
    type: 'error',
    toolName: 'eslint',
    filePath: '/src/components/Button.tsx',
    lineNumber: 23,
    message: 'Missing semicolon',
    ruleId: 'semi',
    fixable: true,
    score: 5,
  };

  const mockAnalysisResult: AnalysisResult = {
    id: 'analysis-1',
    projectId: 'project-1',
    timestamp: new Date(),
    duration: 1500,
    overallScore: 85,
    toolResults: [
      {
        toolName: 'eslint',
        version: '8.0.0',
        duration: 500,
        issues: [mockIssue],
        summary: {
          totalIssues: 1,
          errorCount: 1,
          warningCount: 0,
          infoCount: 0,
          fixableCount: 1,
        },
      },
    ],
    summary: {
      totalIssues: 1,
      errorCount: 1,
      warningCount: 0,
      infoCount: 0,
      fixableCount: 1,
      overallScore: 85,
      duration: 1500,
      toolsAnalyzed: 1,
    },
    aiPrompts: [],
  };

  describe('processIssues', () => {
    it('should process issues and return prioritizations', async () => {
      const result = await prioritizationService.processIssues([mockIssue], mockAnalysisResult);

      expect(result).toHaveLength(1);
      expect(result[0].issueId).toBe('issue-1');
      expect(result[0].finalScore).toBeGreaterThan(0);
      expect(result[0].triageSuggestion).toBeDefined();
      expect(result[0].severity).toBeGreaterThan(0);
    });

    it('should handle empty issue list', async () => {
      const result = await prioritizationService.processIssues([], mockAnalysisResult);

      expect(result).toHaveLength(0);
    });
  });

  describe('enrichIssuesWithPriority', () => {
    it('should enrich issues with priority data', () => {
      const prioritizations = [
        {
          id: 'priority-1',
          issueId: 'issue-1',
          finalScore: 7.5,
          severity: 8,
          triageSuggestion: {
            action: 'schedule',
            priority: 7,
            estimatedEffort: 3,
            reasoning: 'Medium priority issue found',
            confidence: 0.8,
          },
        } as any,
      ];

      const enriched = prioritizationService.enrichIssuesWithPriority([mockIssue], prioritizations);

      expect(enriched[0]).toHaveProperty('priority');
      expect(enriched[0].priorityScore).toBe(7.5);
      expect(enriched[0].priorityLevel).toBe('high');
      expect(enriched[0]).toHaveProperty('triageSuggestion');
    });

    it('should return original issue when no matching prioritization', () => {
      const prioritizations = [
        {
          id: 'priority-2',
          issueId: 'issue-2',
          finalScore: 5.0,
        } as any,
      ];

      const enriched = prioritizationService.enrichIssuesWithPriority([mockIssue], prioritizations);

      expect(enriched[0]).toEqual(mockIssue);
      expect(enriched[0]).not.toHaveProperty('priority');
    });
  });

  describe('filterByPriority', () => {
    it('should filter issues by priority levels', () => {
      const enrichedIssues = [
        { ...mockIssue, priorityLevel: 'critical' as const },
        { ...mockIssue, id: 'issue-2', priorityLevel: 'high' as const },
        { ...mockIssue, id: 'issue-3', priorityLevel: 'low' as const },
      ] as any[];

      const filtered = prioritizationService.filterByPriority(enrichedIssues, ['critical', 'high']);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(i => i.id)).toEqual(['issue-1', 'issue-2']);
    });

    it('should return all issues when no priority levels specified', () => {
      const enrichedIssues = [
        { ...mockIssue, priorityLevel: 'critical' as const },
        { ...mockIssue, id: 'issue-2', priorityLevel: 'high' as const },
      ] as any[];

      const filtered = prioritizationService.filterByPriority(enrichedIssues, []);

      expect(filtered).toHaveLength(2);
    });
  });

  describe('sortByPriority', () => {
    it('should sort issues by priority in descending order by default', () => {
      const enrichedIssues = [
        { ...mockIssue, id: 'issue-1', priorityScore: 3.0 },
        { ...mockIssue, id: 'issue-2', priorityScore: 8.0 },
        { ...mockIssue, id: 'issue-3', priorityScore: 5.0 },
      ] as any[];

      const sorted = prioritizationService.sortByPriority(enrichedIssues);

      expect(sorted.map(i => i.id)).toEqual(['issue-2', 'issue-3', 'issue-1']);
    });

    it('should sort issues by priority in ascending order when specified', () => {
      const enrichedIssues = [
        { ...mockIssue, id: 'issue-1', priorityScore: 3.0 },
        { ...mockIssue, id: 'issue-2', priorityScore: 8.0 },
        { ...mockIssue, id: 'issue-3', priorityScore: 5.0 },
      ] as any[];

      const sorted = prioritizationService.sortByPriority(enrichedIssues, 'asc');

      expect(sorted.map(i => i.id)).toEqual(['issue-1', 'issue-3', 'issue-2']);
    });
  });

  describe('getPriorityStatistics', () => {
    it('should calculate priority statistics correctly', () => {
      const enrichedIssues = [
        { ...mockIssue, priorityLevel: 'critical' as const, priorityScore: 9.0 },
        { ...mockIssue, id: 'issue-2', priorityLevel: 'high' as const, priorityScore: 7.0 },
        { ...mockIssue, id: 'issue-3', priorityLevel: 'high' as const, priorityScore: 6.0 },
        { ...mockIssue, id: 'issue-4', priorityLevel: 'low' as const, priorityScore: 2.0 },
        { ...mockIssue, id: 'issue-5' }, // No priority data
      ] as any[];

      const stats = prioritizationService.getPriorityStatistics(enrichedIssues);

      expect(stats.critical).toBe(1);
      expect(stats.high).toBe(2);
      expect(stats.medium).toBe(0);
      expect(stats.low).toBe(1);
      expect(stats.total).toBe(5);
      expect(stats.averageScore).toBe(6.0); // (9 + 7 + 6 + 2) / 4
    });

    it('should handle empty issues list', () => {
      const stats = prioritizationService.getPriorityStatistics([]);

      expect(stats.critical).toBe(0);
      expect(stats.high).toBe(0);
      expect(stats.medium).toBe(0);
      expect(stats.low).toBe(0);
      expect(stats.total).toBe(0);
      expect(stats.averageScore).toBe(0);
    });
  });
});
