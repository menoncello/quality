import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { CoverageSummary } from './coverage-summary.js';
import { FileCoverageList } from './file-coverage-list.js';
import { CriticalPaths } from './critical-paths.js';
import { CoverageRecommendations } from './coverage-recommendations.js';
import type { CoverageReport } from '@dev-quality/core';

interface CoverageDashboardProps {
  coverageReport: CoverageReport;
}

type ViewType = 'summary' | 'files' | 'critical-paths' | 'recommendations';

export const CoverageDashboard: React.FC<CoverageDashboardProps> = ({ coverageReport }) => {
  const [currentView, setCurrentView] = useState<ViewType>('summary');
  const [sortBy, setSortBy] = useState<'coverage' | 'risk' | 'path'>('coverage');

  useInput((input, key) => {
    if (key.escape) {
      setCurrentView('summary');
    } else if (input === '1') {
      setCurrentView('summary');
    } else if (input === '2') {
      setCurrentView('files');
    } else if (input === '3') {
      setCurrentView('critical-paths');
    } else if (input === '4') {
      setCurrentView('recommendations');
    } else if (currentView === 'files' && input === 's') {
      setSortBy(sortBy === 'coverage' ? 'risk' : sortBy === 'risk' ? 'path' : 'coverage');
    }
  });

  const renderCurrentView = () => {
    switch (currentView) {
      case 'summary':
        return <CoverageSummary summary={coverageReport.summary} />;
      case 'files':
        return <FileCoverageList files={coverageReport.coverage.files ?? []} sortBy={sortBy} />;
      case 'critical-paths':
        return <CriticalPaths criticalPaths={coverageReport.coverage.criticalPaths ?? []} />;
      case 'recommendations':
        return (
          <CoverageRecommendations
            recommendations={coverageReport.coverage.recommendations ?? []}
          />
        );
      default:
        return <CoverageSummary summary={coverageReport.summary} />;
    }
  };

  const getHelpText = () => {
    switch (currentView) {
      case 'files':
        return 'Press [s] to change sort order (coverage/risk/path)';
      default:
        return 'Press [1-4] to navigate views | [ESC] for summary';
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="blue" backgroundColor="black">
          📊 Coverage Analysis Dashboard
        </Text>
      </Box>

      {/* Navigation */}
      <Box marginBottom={1} justifyContent="space-between" width={80}>
        <Box>
          <Text color={currentView === 'summary' ? 'green' : 'gray'}>[1] Summary</Text>
          <Text color="gray"> | </Text>
          <Text color={currentView === 'files' ? 'green' : 'gray'}>[2] Files</Text>
          <Text color="gray"> | </Text>
          <Text color={currentView === 'critical-paths' ? 'green' : 'gray'}>
            [3] Critical Paths
          </Text>
          <Text color="gray"> | </Text>
          <Text color={currentView === 'recommendations' ? 'green' : 'gray'}>
            [4] Recommendations
          </Text>
        </Box>
        <Text bold color="cyan">
          {currentView.replace('-', ' ').toUpperCase()}
        </Text>
      </Box>

      {/* Content */}
      <Box marginBottom={1}>{renderCurrentView()}</Box>

      {/* Footer */}
      <Box>
        <Text color="gray" dimColor>
          {getHelpText()}
        </Text>
      </Box>
    </Box>
  );
};
