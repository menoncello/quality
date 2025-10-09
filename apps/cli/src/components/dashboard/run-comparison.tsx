/**
 * Run Comparison Component
 * Side-by-side analysis of two analysis runs
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useComparisonStore, type ComparisonResult } from '../../hooks/useComparisonStore';
import { MetricCard as _MetricCard } from './metric-card';
import { IssueDiffList } from './issue-diff-list';
import { TrendChart } from './trend-chart';
import { ComparisonSummary } from './comparison-summary';

interface RunComparisonProps {
  comparison?: ComparisonResult;
  onExport?: (format: 'json' | 'csv' | 'markdown') => void;
  onNewComparison?: () => void;
}

export const RunComparison: React.FC<RunComparisonProps> = ({
  comparison,
  onExport,
  onNewComparison,
}) => {
  const {
    currentComparison,
    comparisonConfig,
    setFilters,
    setVisualization,
    exportComparison: _exportComparison,
  } = useComparisonStore();

  const [activeTab, setActiveTab] = useState<'summary' | 'issues' | 'trends' | 'details'>(
    'summary'
  );
  const [selectedIssueType, setSelectedIssueType] = useState<'new' | 'resolved' | 'unchanged'>(
    'new'
  );

  const comparisonData = comparison ?? currentComparison;

  // Keyboard navigation
  useInput((input, key) => {
    switch (true) {
      case input === '1':
        setActiveTab('summary');
        break;
      case input === '2':
        setActiveTab('issues');
        break;
      case input === '3':
        setActiveTab('trends');
        break;
      case input === '4':
        setActiveTab('details');
        break;

      case key.ctrl && input === 'e':
        if (onExport) {
          onExport('json');
        }
        break;

      case key.ctrl && input === 'c':
        if (onExport) {
          onExport('csv');
        }
        break;

      case key.ctrl && input === 'm':
        if (onExport) {
          onExport('markdown');
        }
        break;

      case key.ctrl && input === 'n':
        if (onNewComparison) {
          onNewComparison();
        }
        break;

      case input === 'n':
        setSelectedIssueType('new');
        break;
      case input === 'r':
        setSelectedIssueType('resolved');
        break;
      case input === 'u':
        setSelectedIssueType('unchanged');
        break;

      case input === 'f':
        setFilters({ showNewIssues: !comparisonConfig.filters.showNewIssues });
        break;
      case input === 'g':
        setFilters({ showResolvedIssues: !comparisonConfig.filters.showResolvedIssues });
        break;
      case input === 'h':
        setFilters({ showUnchangedIssues: !comparisonConfig.filters.showUnchangedIssues });
        break;

      case input === 'c':
        setVisualization({ showCharts: !comparisonConfig.visualization.showCharts });
        break;
      case input === 'd':
        setVisualization({ showDiffs: !comparisonConfig.visualization.showDiffs });
        break;
      case input === 't':
        setVisualization({ showTrends: !comparisonConfig.visualization.showTrends });
        break;
    }
  });

  if (!comparisonData) {
    return (
      <Box flexDirection="column" padding={2}>
        <Text color="yellow" bold>
          No comparison data available
        </Text>
        <Text color="gray">Select two runs to compare using the run selector</Text>
        {onNewComparison && (
          <Box marginTop={1}>
            <Text color="blue">[Ctrl+N] New Comparison</Text>
          </Box>
        )}
      </Box>
    );
  }

  const tabs = [
    { key: 'summary', label: 'Summary', shortcut: '1' },
    { key: 'issues', label: 'Issues', shortcut: '2' },
    { key: 'trends', label: 'Trends', shortcut: '3' },
    { key: 'details', label: 'Details', shortcut: '4' },
  ];

  const issueTypeTabs = [
    { key: 'new', label: `New (${comparisonData.summary.newIssuesCount})`, shortcut: 'n' },
    {
      key: 'resolved',
      label: `Resolved (${comparisonData.summary.resolvedIssuesCount})`,
      shortcut: 'r',
    },
    {
      key: 'unchanged',
      label: `Unchanged (${comparisonData.summary.unchangedIssuesCount})`,
      shortcut: 'u',
    },
  ];

  return (
    <Box flexDirection="column" width={120}>
      {/* Header */}
      <Box flexDirection="row" marginBottom={1}>
        <Text bold color="blue">
          Run Comparison
        </Text>
        <Box flexGrow={1} />
        <Text color="gray">
          Baseline: {comparisonData.baseline.version ?? comparisonData.baseline.id.slice(0, 8)}
        </Text>
        <Box paddingLeft={1}>
          <Text color="gray">vs</Text>
        </Box>
        <Box paddingLeft={1}>
          <Text color="gray">
            {comparisonData.comparison.version ?? comparisonData.comparison.id.slice(0, 8)}
          </Text>
        </Box>
      </Box>

      {/* Tab Navigation */}
      <Box flexDirection="row" marginBottom={1}>
        {tabs.map(tab => (
          <Box
            key={tab.key}
            marginRight={1}
            paddingX={1}
            backgroundColor={activeTab === tab.key ? 'blue' : 'gray'}
          >
            <Text color={activeTab === tab.key ? 'white' : 'black'}>
              {tab.label} [{tab.shortcut}]
            </Text>
          </Box>
        ))}
        <Box flexGrow={1} />
        <Text color="gray">[Ctrl+E] JSON [Ctrl+C] CSV [Ctrl+M] MD</Text>
      </Box>

      {/* Tab Content */}
      {activeTab === 'summary' && <ComparisonSummary comparison={comparisonData} />}

      {activeTab === 'issues' && (
        <Box flexDirection="column">
          {/* Issue Type Tabs */}
          <Box flexDirection="row" marginBottom={1}>
            {issueTypeTabs.map(tab => (
              <Box
                key={tab.key}
                marginRight={1}
                paddingX={1}
                backgroundColor={selectedIssueType === tab.key ? 'green' : 'gray'}
              >
                <Text color={selectedIssueType === tab.key ? 'white' : 'black'}>
                  {tab.label} [{tab.shortcut}]
                </Text>
              </Box>
            ))}
            <Box flexGrow={1} />
            <Text color="gray">Filters: [F] New [G] Resolved [H] Unchanged</Text>
          </Box>

          {/* Issues List */}
          <IssueDiffList
            comparison={comparisonData}
            issueType={selectedIssueType}
            filters={comparisonConfig.filters}
            visualization={comparisonConfig.visualization}
          />
        </Box>
      )}

      {activeTab === 'trends' && (
        <TrendChart
          trends={comparisonData.trends}
          showCharts={comparisonConfig.visualization.showCharts}
          showDiffs={comparisonConfig.visualization.showDiffs}
        />
      )}

      {activeTab === 'details' && (
        <Box flexDirection="column">
          <Text bold color="cyan">
            Detailed Comparison
          </Text>
          <Box marginTop={1}>
            <Text>Baseline Run Details:</Text>
            <Text color="gray"> ID: {comparisonData.baseline.id}</Text>
            <Text color="gray"> Timestamp: {comparisonData.baseline.timestamp.toISOString()}</Text>
            <Text color="gray"> Version: {comparisonData.baseline.version ?? 'N/A'}</Text>
            <Text color="gray"> Commit: {comparisonData.baseline.commitHash ?? 'N/A'}</Text>
            <Text color="gray"> Branch: {comparisonData.baseline.branch ?? 'N/A'}</Text>
            <Text color="gray"> Tools: {comparisonData.baseline.metadata.tools.join(', ')}</Text>
            <Text color="gray">
              {' '}
              Execution Time: {comparisonData.baseline.metadata.executionTime}ms
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text>Comparison Run Details:</Text>
            <Text color="gray"> ID: {comparisonData.comparison.id}</Text>
            <Text color="gray">
              {' '}
              Timestamp: {comparisonData.comparison.timestamp.toISOString()}
            </Text>
            <Text color="gray"> Version: {comparisonData.comparison.version ?? 'N/A'}</Text>
            <Text color="gray"> Commit: {comparisonData.comparison.commitHash ?? 'N/A'}</Text>
            <Text color="gray"> Branch: {comparisonData.comparison.branch ?? 'N/A'}</Text>
            <Text color="gray"> Tools: {comparisonData.comparison.metadata.tools.join(', ')}</Text>
            <Text color="gray">
              {' '}
              Execution Time: {comparisonData.comparison.metadata.executionTime}ms
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text>Configuration:</Text>
            <Text color="gray">
              {' '}
              Show Charts: {comparisonConfig.visualization.showCharts ? 'Yes' : 'No'}
            </Text>
            <Text color="gray">
              {' '}
              Show Diffs: {comparisonConfig.visualization.showDiffs ? 'Yes' : 'No'}
            </Text>
            <Text color="gray">
              {' '}
              Show Trends: {comparisonConfig.visualization.showTrends ? 'Yes' : 'No'}
            </Text>
            <Text color="gray">
              {' '}
              Show New Issues: {comparisonConfig.filters.showNewIssues ? 'Yes' : 'No'}
            </Text>
            <Text color="gray">
              {' '}
              Show Resolved Issues: {comparisonConfig.filters.showResolvedIssues ? 'Yes' : 'No'}
            </Text>
            <Text color="gray">
              {' '}
              Show Unchanged Issues: {comparisonConfig.filters.showUnchangedIssues ? 'Yes' : 'No'}
            </Text>
          </Box>
        </Box>
      )}

      {/* Footer */}
      <Box flexDirection="row" marginTop={2} borderTop={true} paddingY={1}>
        <Text color="gray" dimColor>
          Visualization: [C] Charts [D] Diffs [T] Trends
        </Text>
        <Box flexGrow={1} />
        <Text color="gray" dimColor>
          [Ctrl+N] New Comparison
        </Text>
      </Box>

      {/* Performance Summary */}
      <Box flexDirection="row" marginBottom={1}>
        <Text color={comparisonData.summary.improvementRate > 0 ? 'green' : 'red'}>
          {comparisonData.summary.improvementRate > 0 ? '🟢' : '🔴'} Improvement Rate:{' '}
          {comparisonData.summary.improvementRate.toFixed(2)}%
        </Text>
        <Box flexGrow={1} />
        <Text color="gray" dimColor>
          Generated: {comparisonData.generatedAt.toLocaleString()}
        </Text>
      </Box>
    </Box>
  );
};

export default RunComparison;
