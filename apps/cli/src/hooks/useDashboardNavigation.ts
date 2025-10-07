/**
 * Use Dashboard Navigation Hook
 * Manages dashboard navigation state and breadcrumb history
 */

import React, { useCallback, useEffect } from 'react';
import { useDashboardStore } from './useDashboardStore';
import type { DashboardView, NavigationBreadcrumb } from '../types/dashboard';
import type { Issue } from '../types/analysis';

interface NavigationContext {
  selectedIssue?: Issue;
  selectedFile?: string;
  selectedModule?: string;
  selectedTool?: string;
  selectedSeverity?: string;
  searchTerm?: string;
}

interface NavigationState {
  currentView: DashboardView;
  breadcrumbs: NavigationBreadcrumb[];
  context: NavigationContext;
  canGoBack: boolean;
  canGoForward: boolean;
}

export const useDashboardNavigation = () => {
  const { currentView, setCurrentView, setSelectedIssue } = useDashboardStore();

  const [navigationContext, setNavigationContext] = React.useState<NavigationContext>({});
  const [navigationStack, setNavigationStack] = React.useState<NavigationState[]>([]);

  /**
   * Navigate to a specific view with context
   */
  const navigate = useCallback(
    (view: DashboardView, context?: NavigationContext) => {
      // Create breadcrumb for current view
      const breadcrumb: NavigationBreadcrumb = {
        id: `${view}-${Date.now()}`,
        label: getViewLabel(view, context),
        view,
        data: context as Record<string, unknown>,
      };

      // Store current state in stack
      const lastState = navigationStack[navigationStack.length - 1];
      const currentState: NavigationState = {
        currentView,
        breadcrumbs: [...(lastState?.breadcrumbs ?? []), breadcrumb],
        context: { ...navigationContext, ...context },
        canGoBack: navigationStack.length > 0 || currentView !== 'dashboard',
        canGoForward: false,
      };

      setNavigationStack(prev => [...prev, currentState]);
      setNavigationContext(prev => ({ ...prev, ...context }));

      // Update store
      setCurrentView(view);
      setSelectedIssue(context?.selectedIssue ?? null);
    },
    [currentView, navigationContext, navigationStack, setCurrentView, setSelectedIssue]
  );

  /**
   * Navigate to issue details
   */
  const navigateToIssue = useCallback(
    (issue: Issue) => {
      const context: NavigationContext = {
        selectedIssue: issue,
        selectedFile: issue.filePath,
        selectedTool: issue.toolName,
      };

      navigate('issue-details', context);
    },
    [navigate]
  );

  /**
   * Navigate to file view
   */
  const navigateToFile = useCallback(
    (filePath: string, context?: Partial<NavigationContext>) => {
      const navContext: NavigationContext = {
        selectedFile: filePath,
        ...context,
      };

      navigate('issue-list', navContext);
    },
    [navigate]
  );

  /**
   * Navigate to module view
   */
  const navigateToModule = useCallback(
    (module: string, context?: Partial<NavigationContext>) => {
      const navContext: NavigationContext = {
        selectedModule: module,
        ...context,
      };

      navigate('issue-list', navContext);
    },
    [navigate]
  );

  /**
   * Navigate back
   */
  const navigateBack = useCallback(() => {
    if (navigationStack.length > 1) {
      // Remove current state and go to previous
      const newStack = navigationStack.slice(0, -1);
      const previousState = newStack[newStack.length - 1];

      if (previousState) {
        setNavigationStack(newStack);
        setNavigationContext(previousState.context);
        setCurrentView(previousState.currentView);
        setSelectedIssue(previousState.context.selectedIssue ?? null);
      }
    } else {
      // Go to dashboard if at root
      navigate('dashboard');
    }
  }, [navigationStack, navigate, setCurrentView, setSelectedIssue]);

  /**
   * Navigate forward (if available)
   */
  const navigateForward = useCallback(() => {
    // This would require storing forward history
    // For now, implement as placeholder
    // TODO: Implement forward navigation
  }, []);

  /**
   * Clear navigation history
   */
  const clearNavigationHistory = useCallback(() => {
    setNavigationStack([
      {
        currentView: 'dashboard',
        breadcrumbs: [],
        context: {},
        canGoBack: false,
        canGoForward: false,
      },
    ]);
    setNavigationContext({});
    setCurrentView('dashboard');
    setSelectedIssue(null);
  }, [setCurrentView, setSelectedIssue]);

  /**
   * Get current navigation state
   */
  const getNavigationState = useCallback((): NavigationState => {
    return (
      navigationStack[navigationStack.length - 1] ?? {
        currentView: 'dashboard',
        breadcrumbs: [],
        context: {},
        canGoBack: false,
        canGoForward: false,
      }
    );
  }, [navigationStack]);

  /**
   * Filter issues by current context
   */
  const getFilteredIssues = useCallback(
    (allIssues: Issue[]): Issue[] => {
      let filteredIssues = allIssues;

      // Filter by selected file
      if (navigationContext.selectedFile) {
        filteredIssues = filteredIssues.filter(
          issue => issue.filePath === navigationContext.selectedFile
        );
      }

      // Filter by selected module
      if (navigationContext.selectedModule) {
        const selectedModule = navigationContext.selectedModule;
        filteredIssues = filteredIssues.filter(issue => issue.filePath.includes(selectedModule));
      }

      // Filter by selected tool
      if (navigationContext.selectedTool) {
        filteredIssues = filteredIssues.filter(
          issue => issue.toolName === navigationContext.selectedTool
        );
      }

      // Filter by selected severity
      if (navigationContext.selectedSeverity) {
        filteredIssues = filteredIssues.filter(
          issue => issue.type === navigationContext.selectedSeverity
        );
      }

      // Filter by search term
      if (navigationContext.searchTerm) {
        const searchTerm = navigationContext.searchTerm.toLowerCase();
        filteredIssues = filteredIssues.filter(
          issue =>
            issue.message.toLowerCase().includes(searchTerm) ||
            issue.filePath.toLowerCase().includes(searchTerm) ||
            issue.toolName.toLowerCase().includes(searchTerm)
        );
      }

      return filteredIssues;
    },
    [navigationContext]
  );

  // Auto-navigate to dashboard if no state exists
  useEffect(() => {
    if (navigationStack.length === 0 && currentView === 'dashboard') {
      setNavigationStack([
        {
          currentView: 'dashboard',
          breadcrumbs: [],
          context: {},
          canGoBack: false,
          canGoForward: false,
        },
      ]);
    }
  }, [navigationStack.length, currentView]);

  return {
    // Current state
    currentView,
    navigationContext,
    navigationState: getNavigationState(),

    // Navigation methods
    navigate,
    navigateToIssue,
    navigateToFile,
    navigateToModule,
    navigateBack,
    navigateForward,
    clearNavigationHistory,

    // Context setters
    setNavigationContext,

    // Utility methods
    getFilteredIssues,
  };
};

/**
 * Get human-readable label for view
 */
function getViewLabel(view: DashboardView, context?: NavigationContext): string {
  const baseLabels: Record<DashboardView, string> = {
    dashboard: 'Dashboard',
    'issue-list': 'Issues',
    'issue-details': 'Issue Details',
    comparison: 'Compare Runs',
    trends: 'Trends',
    'layout-customization': 'Layout',
  };

  let label = baseLabels[view];

  // Add context-specific information
  if (context?.selectedIssue) {
    const issue = context.selectedIssue;
    const shortMessage =
      issue.message.length > 30 ? `${issue.message.slice(0, 27)}...` : issue.message;
    label = `Issue: ${shortMessage}`;
  }

  if (context?.selectedFile) {
    const fileName = context.selectedFile.split('/').pop() ?? 'Unknown File';
    label = `File: ${fileName}`;
  }

  if (context?.selectedModule) {
    label = `Module: ${context.selectedModule}`;
  }

  if (context?.selectedTool) {
    label = `${label} (${context.selectedTool})`;
  }

  return label;
}
