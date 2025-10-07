/**
 * Dashboard Navigator Component
 * Handles drill-down navigation between different dashboard views
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { DashboardView, NavigationBreadcrumb } from '../../types/dashboard';
import type { Issue } from '../../types/analysis';

interface NavigatorState {
  view: DashboardView;
  context: {
    selectedIssue?: Issue;
    selectedFile?: string;
    selectedModule?: string;
  };
  depth: number;
}

interface DashboardNavigatorProps {
  currentView: DashboardView;
  onNavigate: (view: DashboardView, context?: Record<string, unknown>) => void;
  onGoBack?: () => void;
  _availableViews?: DashboardView[];
}

const VIEW_DESCRIPTIONS: Record<DashboardView, string> = {
  dashboard: 'Dashboard Overview',
  'issue-list': 'All Issues',
  'issue-details': 'Issue Details',
  comparison: 'Run Comparison',
  trends: 'Trend Analysis',
  'layout-customization': 'Layout Settings',
};

const createBreadcrumb = (
  view: DashboardView,
  label: string,
  data?: Record<string, unknown>
): NavigationBreadcrumb => ({
  id: `${view}-${Date.now()}`,
  label,
  view,
  data,
});

export const DashboardNavigator: React.FC<DashboardNavigatorProps> = ({
  currentView,
  onNavigate,
  onGoBack,
  _availableViews = [
    'dashboard',
    'issue-list',
    'issue-details',
    'comparison',
    'trends',
    'layout-customization',
  ],
}) => {
  const [navigationHistory, setNavigationHistory] = React.useState<NavigatorState[]>([]);
  const [navigationIndex, setNavigationIndex] = React.useState(0);

  // Create breadcrumbs from navigation history
  const breadcrumbs: NavigationBreadcrumb[] = React.useMemo(() => {
    const crumbs: NavigationBreadcrumb[] = [];

    // Add current view
    crumbs.push(createBreadcrumb(currentView, VIEW_DESCRIPTIONS[currentView]));

    // Add context-specific breadcrumbs
    if (navigationHistory.length > 0) {
      const currentState = navigationHistory[navigationIndex];
      if (currentState) {
        if (currentState.context.selectedFile) {
          const fileName = currentState.context.selectedFile.split('/').pop() ?? 'Unknown File';
          crumbs.push(
            createBreadcrumb('issue-list', `File: ${fileName}`, {
              filePath: currentState.context.selectedFile,
            })
          );
        }

        if (currentState.context.selectedIssue) {
          crumbs.push(
            createBreadcrumb(
              'issue-details',
              `Issue: ${currentState.context.selectedIssue.message.slice(0, 30)}...`,
              {
                issueId: currentState.context.selectedIssue.id,
              }
            )
          );
        }

        if (currentState.context.selectedModule) {
          crumbs.push(
            createBreadcrumb('issue-list', `Module: ${currentState.context.selectedModule}`, {
              module: currentState.context.selectedModule,
            })
          );
        }
      }
    }

    return crumbs;
  }, [currentView, navigationHistory, navigationIndex]);

  const handleNavigate = (view: DashboardView, context?: Record<string, unknown>) => {
    const newState: NavigatorState = {
      view,
      context: context ?? {},
      depth: navigationHistory.length + 1,
    };

    // Update navigation history
    const newHistory = navigationHistory.slice(0, navigationIndex + 1);
    newHistory.push(newState);
    setNavigationHistory(newHistory);
    setNavigationIndex(newHistory.length - 1);

    onNavigate(view, context);
  };

  const handleGoBack = () => {
    if (navigationIndex > 0) {
      const previousIndex = navigationIndex - 1;
      const previousState = navigationHistory[previousIndex];
      if (previousState) {
        setNavigationIndex(previousIndex);
        onNavigate(previousState.view, previousState.context);
      }
    } else {
      onGoBack?.();
    }
  };

  // Keyboard navigation
  useInput((input, key) => {
    // Back navigation
    if (key.escape) {
      handleGoBack();
    }

    // Quick navigation shortcuts
    if (input) {
      switch (input) {
        case '\u0004': // Ctrl+D
          handleNavigate('dashboard');
          break;
        case '\u0009': // Ctrl+I
          handleNavigate('issue-list');
          break;
        case '\u0003': // Ctrl+C
          handleNavigate('comparison');
          break;
        case '\u0014': // Ctrl+T
          handleNavigate('trends');
          break;
      }
    }
  });

  const canGoBack = navigationIndex > 0 || (currentView !== 'dashboard' && onGoBack);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="row" alignItems="center" marginBottom={1}>
        <Text bold color="blue">
          Navigator
        </Text>
        <Text color="gray"> | </Text>
        <Text>Current: </Text>
        <Text color="cyan" bold>
          {VIEW_DESCRIPTIONS[currentView]}
        </Text>
        {canGoBack && (
          <>
            <Text color="gray"> | </Text>
            <Text color="yellow">[Esc] Back</Text>
          </>
        )}
      </Box>

      {/* Quick navigation shortcuts */}
      <Box flexDirection="row" marginBottom={1}>
        <Text color="gray">Quick Nav: </Text>
        <Text color="blue">[Ctrl+D]</Text>
        <Text color="gray"> Dashboard</Text>
        <Text color="gray"> | </Text>
        <Text color="blue">[Ctrl+I]</Text>
        <Text color="gray"> Issues</Text>
        <Text color="gray"> | </Text>
        <Text color="blue">[Ctrl+C]</Text>
        <Text color="gray"> Compare</Text>
        <Text color="gray"> | </Text>
        <Text color="blue">[Ctrl+T]</Text>
        <Text color="gray"> Trends</Text>
      </Box>

      {/* Breadcrumb navigation */}
      <Box flexDirection="row" alignItems="center">
        <Text color="gray">Path:</Text>
        <Box marginLeft={1}>
          {breadcrumbs.length > 1 ? (
            <Text>
              {breadcrumbs.map((crumb, index) => (
                <Text key={crumb.id}>
                  {index > 0 && <Text color="gray"> › </Text>}
                  <Text color={index === breadcrumbs.length - 1 ? 'cyan' : 'blue'}>
                    {crumb.label}
                  </Text>
                </Text>
              ))}
            </Text>
          ) : (
            <Text color="gray">Root</Text>
          )}
        </Box>
      </Box>

      {/* Navigation info */}
      {navigationHistory.length > 0 && (
        <Box flexDirection="row" marginTop={1}>
          <Text color="gray">
            Navigation depth: {navigationHistory.length} | Position: {navigationIndex + 1}/
            {navigationHistory.length}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default DashboardNavigator;
