/**
 * Hook for managing analysis results in the dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore } from './useDashboardStore';
import { DashboardEngineIntegration } from '../services/dashboard/dashboard-engine-integration';
import { MockAnalysisEngine } from '../services/analysis/mock-analysis-engine';
import type { AnalysisResult } from '../types';
import type { AnalysisProgress, ToolResult, AnalysisEngine } from '@dev-quality/core';
import type { ProjectConfiguration } from '@dev-quality/types';
import type { DashboardData } from '../types/dashboard';

export function useAnalysisResults() {
  const { setAnalysisResult, setAnalysisProgress, setAnalyzing, updateFilteredIssues } =
    useDashboardStore();

  const [integration] = useState(() => new DashboardEngineIntegration());
  const [analysisError, setAnalysisError] = useState<Error | null>(null);
  const [lastAnalysisData, setLastAnalysisData] = useState<DashboardData | null>(null);

  // Initialize analysis engine if available
  useEffect(() => {
    // Initialize with mock engine for development
    const initializeEngine = async () => {
      try {
        const mockEngine = new MockAnalysisEngine();
        await mockEngine.initialize();
        integration.setAnalysisEngine(mockEngine as unknown as AnalysisEngine);
      } catch (error) {
        setAnalysisError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    initializeEngine();
  }, [integration]);

  // Execute analysis with real-time updates
  const executeAnalysis = useCallback(
    async (
      projectId: string,
      config: ProjectConfiguration,
      options: {
        plugins?: string[];
        incremental?: boolean;
        timeout?: number;
      } = {}
    ): Promise<{
      success: boolean;
      result?: AnalysisResult;
      error?: Error;
    }> => {
      setAnalysisError(null);
      setAnalyzing(true);
      setAnalysisProgress(null);

      try {
        // Set up progress tracking
        const onProgress = (progress: AnalysisProgress) => {
          setAnalysisProgress(progress);
        };

        // Execute analysis with dashboard integration
        const result = await integration.executeAnalysisWithDashboard(projectId, config, {
          ...options,
          onProgress,
          onPluginComplete: (_toolName: string, _toolResult: ToolResult) => {
            // Plugin ${_toolName} completed
          },
          onPluginError: (_toolName: string, _error: Error) => {
            // Plugin ${_toolName} failed: ${_error.message}
          },
        });

        if (result.success && result.result) {
          // Update dashboard with results
          const dashboardData = integration.transformAnalysisResult(result.result);
          setAnalysisResult(result.result);
          updateFilteredIssues(dashboardData.filteredIssues);
          setLastAnalysisData(dashboardData);
        } else {
          setAnalysisError(result.error ?? new Error('Analysis failed'));
        }

        return result;
      } catch (error) {
        const analysisError = error instanceof Error ? error : new Error(String(error));
        setAnalysisError(analysisError);
        return {
          success: false,
          error: analysisError,
        };
      } finally {
        setAnalyzing(false);
        setAnalysisProgress(null);
      }
    },
    [integration, setAnalysisResult, setAnalysisProgress, setAnalyzing, updateFilteredIssues]
  );

  // Cancel ongoing analysis
  const cancelAnalysis = useCallback(
    async (projectId: string): Promise<boolean> => {
      try {
        const cancelled = await integration.cancelAnalysis(projectId);
        if (cancelled) {
          setAnalyzing(false);
          setAnalysisProgress(null);
        }
        return cancelled;
      } catch (_error) {
        return false;
      }
    },
    [integration, setAnalyzing, setAnalysisProgress]
  );

  // Load existing analysis results
  const loadResults = useCallback(
    (result: AnalysisResult) => {
      const dashboardData = integration.transformAnalysisResult(result);
      setAnalysisResult(result);
      updateFilteredIssues(dashboardData.filteredIssues);
      setLastAnalysisData(dashboardData);
      setAnalysisError(null);
    },
    [integration, setAnalysisResult, updateFilteredIssues]
  );

  // Clear results
  const clearResults = useCallback(() => {
    setAnalysisResult(null);
    updateFilteredIssues([]);
    setLastAnalysisData(null);
    setAnalysisError(null);
    setAnalysisProgress(null);
    setAnalyzing(false);
  }, [setAnalysisResult, updateFilteredIssues]);

  // Subscribe to real-time updates
  useEffect(() => {
    const handleProgress = (progress: AnalysisProgress) => {
      setAnalysisProgress(progress);
    };

    const handleComplete = (dashboardData: DashboardData) => {
      setLastAnalysisData(dashboardData);
      setAnalyzing(false);
    };

    const handleError = (error: Error) => {
      setAnalysisError(error);
      setAnalyzing(false);
    };

    integration.on('progress', handleProgress);
    integration.on('analysis-complete', handleComplete);
    integration.on('analysis-error', handleError);

    return () => {
      integration.off('progress', handleProgress);
      integration.off('analysis-complete', handleComplete);
      integration.off('analysis-error', handleError);
    };
  }, [integration, setAnalysisProgress, setAnalyzing]);

  return {
    // State
    analysisError,
    lastAnalysisData,
    isAnalyzing: useDashboardStore(state => state.isAnalyzing),

    // Actions
    executeAnalysis,
    cancelAnalysis,
    loadResults,
    clearResults,

    // Integration access
    integration,
  };
}
