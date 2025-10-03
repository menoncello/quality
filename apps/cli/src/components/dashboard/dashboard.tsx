/**
 * Main dashboard component
 */

import React, { useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import { MetricsSummary } from './metrics-summary';
import { IssueList } from './issue-list';
import { IssueDetails } from './issue-details';
import { FilterBar } from './filters';
import { FilterMenu } from './filter-menu';
import { ExportMenu } from './export-menu';
import { AnalysisProgress } from '../progress/analysis-progress';
import {
  createKeyboardHandler as _createKeyboardHandler,
  defaultKeyboardShortcuts as _defaultKeyboardShortcuts,
} from '../../utils/keyboard-navigation';
import type { DashboardView as _DashboardView } from '../../types/dashboard';

interface DashboardProps {
  analysisResult: import('../../types').AnalysisResult;
}

export function Dashboard({ analysisResult }: DashboardProps): React.ReactElement {
  const { exit } = useApp();
  const {
    currentView,
    filteredIssues,
    selectedIssue: _selectedIssue,
    isAnalyzing,
    analysisProgress,
    ui: { isFilterMenuOpen, isExportMenuOpen },
    setAnalysisResult,
    setCurrentView,
    setSelectedIssue,
    setAnalyzing: _setAnalyzing,
  } = useDashboardStore();

  // Initialize dashboard with analysis result
  useEffect(() => {
    setAnalysisResult(analysisResult);
  }, [analysisResult, setAnalysisResult]);

  // Handle keyboard input
  const handleNavigation = useCallback(
    (direction: string) => {
      const { selectedIndex: _selectedIndex } = useDashboardStore.getState().navigation;

      switch (direction) {
        case 'escape':
          if (currentView === 'issue-details') {
            setCurrentView('dashboard');
            setSelectedIssue(null);
          } else if (currentView === 'dashboard' || currentView === 'issue-list') {
            exit();
          }
          break;
        case 'q':
          exit();
          break;
        case 'f': {
          // Toggle filters
          const { toggleFilterMenu } = useDashboardStore.getState();
          toggleFilterMenu();
          break;
        }
        case 'e': {
          // Toggle export
          const { toggleExportMenu } = useDashboardStore.getState();
          toggleExportMenu();
          break;
        }
      }
    },
    [currentView, exit, setCurrentView, setSelectedIssue]
  );

  useInput((input, key) => {
    if (key.escape) {
      handleNavigation('escape');
    } else if (input === 'q') {
      handleNavigation('q');
    } else if (input === 'f' && !isFilterMenuOpen && !isExportMenuOpen) {
      handleNavigation('f');
    } else if (input === 'e' && !isFilterMenuOpen && !isExportMenuOpen) {
      handleNavigation('e');
    }
  });

  const renderCurrentView = () => {
    switch (currentView) {
      case 'issue-details':
        return <IssueDetails />;
      case 'issue-list':
        return <IssueList />;
      case 'dashboard':
      default:
        return (
          <>
            <MetricsSummary />
            <Box marginBottom={1}>
              <FilterBar />
            </Box>
            <IssueList />
          </>
        );
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Box justifyContent="space-between" width="100%">
          <Text bold color="blue">
            DevQuality Dashboard
          </Text>
          <Text color="gray">
            {analysisResult.projectId} - Score: {analysisResult.overallScore}
          </Text>
        </Box>
      </Box>

      {/* Analysis Progress */}
      {isAnalyzing && analysisProgress && (
        <Box marginBottom={1}>
          <AnalysisProgress progress={analysisProgress} />
        </Box>
      )}

      {/* Filter Menu Overlay */}
      {isFilterMenuOpen && (
        <Box marginBottom={1}>
          <FilterMenu
            isOpen={isFilterMenuOpen}
            onClose={() => {
              const { toggleFilterMenu } = useDashboardStore.getState();
              toggleFilterMenu();
            }}
          />
        </Box>
      )}

      {/* Export Menu Overlay */}
      {isExportMenuOpen && (
        <Box marginBottom={1}>
          <ExportMenu
            isOpen={isExportMenuOpen}
            onClose={() => {
              const { toggleExportMenu } = useDashboardStore.getState();
              toggleExportMenu();
            }}
          />
        </Box>
      )}

      {/* Main Content */}
      <Box flexGrow={1}>{renderCurrentView()}</Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Box justifyContent="space-between" width="100%">
          <Text color="gray" dimColor>
            Issues: {filteredIssues.length} | View: {currentView}
          </Text>
          <Text color="gray" dimColor>
            Press 'q' to quit, 'f' for filters, 'e' for export
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
