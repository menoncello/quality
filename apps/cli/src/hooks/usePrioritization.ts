/**
 * Use Prioritization Hook
 * Integrates Issue Prioritization Engine with dashboard
 */

import { useCallback, useEffect } from 'react';
import { useDashboardStore } from './useDashboardStore';
import { prioritizationService } from '../services/prioritization-service';
import type { Issue } from '../types/analysis';
import type { IssueWithPriority } from '../types/dashboard';
import type { IssuePrioritization } from '@dev-quality/types';

export const usePrioritization = () => {
  const {
    currentResult,
    filteredIssues,
    prioritizedIssues,
    isProcessingPrioritization,
    prioritizationProgress,
    prioritizationError,
    setPrioritizationData,
    setProcessingPrioritization,
    setPrioritizationProgress,
    setPrioritizationError,
    updateFilteredIssues,
  } = useDashboardStore();

  /**
   * Process all issues through prioritization engine
   */
  const processPrioritization = useCallback(async () => {
    if (!currentResult || isProcessingPrioritization) return;

    try {
      setProcessingPrioritization(true);
      setPrioritizationProgress(0);
      setPrioritizationError(null);

      const allIssues = currentResult.toolResults.flatMap(toolResult => toolResult.issues);
      const totalIssues = allIssues.length;

      if (totalIssues === 0) {
        setPrioritizationProgress(100);
        setProcessingPrioritization(false);
        return;
      }

      // Process issues in batches for better progress tracking
      const batchSize = 10;
      const allPrioritizations: IssuePrioritization[] = [];

      for (let i = 0; i < allIssues.length; i += batchSize) {
        const batch = allIssues.slice(i, i + batchSize);
        const batchPrioritizations = await prioritizationService.processIssues(
          batch,
          currentResult
        );
        allPrioritizations.push(...batchPrioritizations);

        // Update progress
        const progress = Math.min(100, ((i + batch.length) / totalIssues) * 100);
        setPrioritizationProgress(progress);
      }

      // Store prioritization data
      setPrioritizationData(allPrioritizations);

      // Enrich current issues with priority data
      const enrichedIssues = prioritizationService.enrichIssuesWithPriority(
        filteredIssues,
        allPrioritizations
      );
      updateFilteredIssues(enrichedIssues as Issue[]);

      setPrioritizationProgress(100);
    } catch (error) {
      setPrioritizationError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setProcessingPrioritization(false);
    }
  }, [
    currentResult,
    filteredIssues,
    isProcessingPrioritization,
    setPrioritizationData,
    setProcessingPrioritization,
    setPrioritizationProgress,
    setPrioritizationError,
    updateFilteredIssues,
  ]);

  /**
   * Filter issues by priority levels
   */
  const filterByPriorityLevels = useCallback(
    (priorityLevels: string[]) => {
      if (!prioritizedIssues.length) return;

      const enrichedIssues = prioritizationService.enrichIssuesWithPriority(
        filteredIssues,
        prioritizedIssues
      );
      const filteredByPriority = prioritizationService.filterByPriority(
        enrichedIssues,
        priorityLevels
      );
      updateFilteredIssues(filteredByPriority as Issue[]);
    },
    [filteredIssues, prioritizedIssues, updateFilteredIssues]
  );

  /**
   * Sort issues by priority
   */
  const sortIssuesByPriority = useCallback(
    (order: 'asc' | 'desc' = 'desc') => {
      if (!prioritizedIssues.length) return;

      const enrichedIssues = prioritizationService.enrichIssuesWithPriority(
        filteredIssues,
        prioritizedIssues
      );
      const sortedByPriority = prioritizationService.sortByPriority(enrichedIssues, order);
      updateFilteredIssues(sortedByPriority as Issue[]);
    },
    [filteredIssues, prioritizedIssues, updateFilteredIssues]
  );

  /**
   * Get priority statistics for current issues
   */
  const getPriorityStatistics = useCallback(() => {
    if (!prioritizedIssues.length) {
      return {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
        averageScore: 0,
      };
    }

    const enrichedIssues = prioritizationService.enrichIssuesWithPriority(
      filteredIssues,
      prioritizedIssues
    );
    return prioritizationService.getPriorityStatistics(enrichedIssues);
  }, [filteredIssues, prioritizedIssues]);

  /**
   * Check if issues have priority data
   */
  const hasPriorityData = useCallback(
    (issue: Issue | IssueWithPriority): issue is IssueWithPriority => {
      return 'priority' in issue || 'priorityScore' in issue;
    },
    []
  );

  /**
   * Get issues enriched with priority data
   */
  const getEnrichedIssues = useCallback((): IssueWithPriority[] => {
    if (!prioritizedIssues.length) return filteredIssues as IssueWithPriority[];

    return prioritizationService.enrichIssuesWithPriority(filteredIssues, prioritizedIssues);
  }, [filteredIssues, prioritizedIssues]);

  /**
   * Auto-trigger prioritization when new analysis results are available
   */
  useEffect(() => {
    if (currentResult && !isProcessingPrioritization && prioritizedIssues.length === 0) {
      processPrioritization();
    }
  }, [currentResult, isProcessingPrioritization, prioritizedIssues.length, processPrioritization]);

  return {
    // Data
    prioritizedIssues,
    enrichedIssues: getEnrichedIssues(),

    // State
    isProcessingPrioritization,
    prioritizationProgress,
    prioritizationError,

    // Actions
    processPrioritization,
    filterByPriorityLevels,
    sortIssuesByPriority,

    // Utilities
    getPriorityStatistics,
    hasPriorityData,
  };
};
