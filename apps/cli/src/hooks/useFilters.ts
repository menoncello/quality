/**
 * Filters hook for dashboard
 */

import { useCallback, useMemo } from 'react';
import { useDashboardStore } from './useDashboardStore';
import { DashboardService } from '../services/dashboard/dashboard-service';
import type { IssueSeverity } from '../types/dashboard';
import type { Issue } from '@dev-quality/core';

export function useFilters(_originalIssues: Issue[] = []) {
  const {
    filteredIssues,
    filters,
    updateFilters,
    clearFilters,
    ui: { sortBy, sortOrder },
  } = useDashboardStore();

  const dashboardService = useMemo(() => new DashboardService(), []);

  // Apply filters and sorting
  const processedIssues = useMemo(() => {
    if (_originalIssues.length === 0) {
      return dashboardService.sortIssues(filteredIssues, sortBy, sortOrder);
    }

    // Apply filters
    const filtered = dashboardService.applyFilters(_originalIssues, filters);

    // Apply sorting
    return dashboardService.sortIssues(filtered, sortBy, sortOrder);
  }, [_originalIssues, filteredIssues, filters, sortBy, sortOrder, dashboardService]);

  // Filter management functions
  const setSeverityFilter = useCallback(
    (severity: IssueSeverity[]) => {
      updateFilters({ severity });
    },
    [updateFilters]
  );

  const setToolFilter = useCallback(
    (tools: string[]) => {
      updateFilters({ tools });
    },
    [updateFilters]
  );

  const setFilePathFilter = useCallback(
    (filePaths: string[]) => {
      updateFilters({ filePaths });
    },
    [updateFilters]
  );

  const setFixableFilter = useCallback(
    (fixable: boolean | null) => {
      updateFilters({ fixable });
    },
    [updateFilters]
  );

  const setScoreRange = useCallback(
    (minScore: number | null, maxScore: number | null) => {
      updateFilters({ minScore, maxScore });
    },
    [updateFilters]
  );

  const setSearchQuery = useCallback(
    (searchQuery: string) => {
      updateFilters({ searchQuery });
    },
    [updateFilters]
  );

  const toggleSeverity = useCallback(
    (severity: IssueSeverity) => {
      const currentSeverities = filters.severity;
      const newSeverities = currentSeverities.includes(severity)
        ? currentSeverities.filter(s => s !== severity)
        : [...currentSeverities, severity];

      // Ensure at least one severity is selected
      if (newSeverities.length > 0) {
        setSeverityFilter(newSeverities);
      }
    },
    [filters.severity, setSeverityFilter]
  );

  const toggleTool = useCallback(
    (tool: string) => {
      const currentTools = filters.tools;
      const newTools = currentTools.includes(tool)
        ? currentTools.filter(t => t !== tool)
        : [...currentTools, tool];

      setToolFilter(newTools);
    },
    [filters.tools, setToolFilter]
  );

  const addFilePath = useCallback(
    (filePath: string) => {
      const currentPaths = filters.filePaths;
      if (!currentPaths.includes(filePath)) {
        setFilePathFilter([...currentPaths, filePath]);
      }
    },
    [filters.filePaths, setFilePathFilter]
  );

  const removeFilePath = useCallback(
    (filePath: string) => {
      const currentPaths = filters.filePaths;
      const newPaths = currentPaths.filter(path => path !== filePath);
      setFilePathFilter(newPaths);
    },
    [filters.filePaths, setFilePathFilter]
  );

  const toggleFixable = useCallback(() => {
    const currentFixable = filters.fixable;
    const newFixable = currentFixable === null ? true : currentFixable === true ? false : null;
    setFixableFilter(newFixable);
  }, [filters.fixable, setFixableFilter]);

  const clearAllFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  // Get available options for filters
  const getAvailableSeverities = useCallback((): IssueSeverity[] => {
    return ['error', 'warning', 'info'];
  }, []);

  const getAvailableTools = useCallback((): string[] => {
    const tools = new Set<string>();
    const issuesToCheck = _originalIssues.length > 0 ? _originalIssues : filteredIssues;

    issuesToCheck.forEach(issue => {
      tools.add(issue.toolName);
    });

    return Array.from(tools).sort();
  }, [_originalIssues, filteredIssues]);

  const getAvailableFilePaths = useCallback((): string[] => {
    const paths = new Set<string>();
    const issuesToCheck = _originalIssues.length > 0 ? _originalIssues : filteredIssues;

    issuesToCheck.forEach(issue => {
      paths.add(issue.filePath);
    });

    return Array.from(paths).sort();
  }, [_originalIssues, filteredIssues]);

  // Get filter statistics
  const filterStatistics = useMemo(() => {
    const baseIssues = _originalIssues.length > 0 ? _originalIssues : filteredIssues;
    return dashboardService.getFilterStatistics(baseIssues, processedIssues, filters);
  }, [_originalIssues, filteredIssues, processedIssues, filters, dashboardService]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.severity.length < 3 ||
      filters.tools.length > 0 ||
      filters.filePaths.length > 0 ||
      filters.fixable !== null ||
      filters.minScore !== null ||
      filters.maxScore !== null ||
      filters.searchQuery.trim() !== ''
    );
  }, [filters]);

  return {
    // State
    filters,
    processedIssues,
    hasActiveFilters,
    filterStatistics,

    // Severity filters
    availableSeverities: getAvailableSeverities(),
    setSeverityFilter,
    toggleSeverity,

    // Tool filters
    availableTools: getAvailableTools(),
    setToolFilter,
    toggleTool,

    // File path filters
    availableFilePaths: getAvailableFilePaths(),
    setFilePathFilter,
    addFilePath,
    removeFilePath,

    // Score filters
    setScoreRange,

    // Fixable filter
    toggleFixable,

    // Search filter
    setSearchQuery,

    // Filter management
    clearAllFilters,
  };
}
