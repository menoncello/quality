/**
 * Historical Run Selector Component
 * Allows selecting historical runs for comparison
 */

import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useComparisonStore, type AnalysisRun } from '../../hooks/useComparisonStore';

interface HistoricalRunSelectorProps {
  onSelectRuns: (baselineId: string, comparisonId: string) => void;
  onCancel: () => void;
  allowSameRun?: boolean;
}

interface RunDisplayInfo extends AnalysisRun {
  displayDate: string;
  displayVersion: string;
  relativeTime: string;
  isSelected: boolean;
  isBaseline: boolean;
  isComparison: boolean;
}

export const HistoricalRunSelector: React.FC<HistoricalRunSelectorProps> = ({
  onSelectRuns,
  onCancel,
  allowSameRun = false,
}) => {
  const {
    runs,
    selectedBaselineRun,
    selectedComparisonRun,
    selectBaselineRun,
    selectComparisonRun,
    getRecentRuns,
  } = useComparisonStore();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterMode, setFilterMode] = useState<'all' | 'recent' | 'by-date'>('all');
  const [dateFilter, _setDateFilter] = useState<string>('');

  // Get runs for display
  const displayRuns = useMemo(() => {
    let filteredRuns = [...runs];

    // Apply filters
    switch (filterMode) {
      case 'recent':
        filteredRuns = getRecentRuns(20);
        break;
      case 'by-date':
        if (dateFilter) {
          const filterDate = new Date(dateFilter);
          filteredRuns = runs.filter(run => {
            const runDate = new Date(run.timestamp);
            return runDate.toDateString() === filterDate.toDateString();
          });
        }
        break;
    }

    // Add display information
    return filteredRuns.map(run => {
      const now = new Date();
      const runTime = new Date(run.timestamp);
      const diffMs = now.getTime() - runTime.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let relativeTime: string;
      if (diffHours < 1) {
        relativeTime = 'Just now';
      } else if (diffHours < 24) {
        relativeTime = `${diffHours}h ago`;
      } else if (diffDays < 7) {
        relativeTime = `${diffDays}d ago`;
      } else {
        relativeTime = runTime.toLocaleDateString();
      }

      return {
        ...run,
        displayDate: runTime.toLocaleDateString(),
        displayVersion: run.version ?? run.id.slice(0, 8),
        relativeTime,
        isSelected: selectedBaselineRun === run.id || selectedComparisonRun === run.id,
        isBaseline: selectedBaselineRun === run.id,
        isComparison: selectedComparisonRun === run.id,
      };
    });
  }, [runs, filterMode, dateFilter, selectedBaselineRun, selectedComparisonRun, getRecentRuns]);

  // Keyboard navigation
  useInput((input, key) => {
    switch (true) {
      case key.upArrow:
        setSelectedIndex(prev => Math.max(0, prev - 1));
        break;
      case key.downArrow:
        setSelectedIndex(prev => Math.min(displayRuns.length - 1, prev + 1));
        break;
      case input === '\u0001': // Ctrl+A (home)
        setSelectedIndex(0);
        break;
      case input === '\u0005': // Ctrl+E (end)
        setSelectedIndex(displayRuns.length - 1);
        break;
      case key.return:
        if (displayRuns.length > 0 && selectedIndex >= 0 && selectedIndex < displayRuns.length) {
          const selectedRun = displayRuns[selectedIndex];
          if (!selectedBaselineRun) {
            if (selectedRun?.id) selectBaselineRun(selectedRun.id);
          } else if (!selectedComparisonRun) {
            if (allowSameRun || selectedRun?.id !== selectedBaselineRun) {
              if (selectedRun?.id) selectComparisonRun(selectedRun.id);
            }
          } else {
            // Both selected, replace comparison
            if (allowSameRun || selectedRun?.id !== selectedBaselineRun) {
              if (selectedRun?.id) selectComparisonRun(selectedRun.id);
            }
          }
        }
        break;

      case input === 'b':
        if (displayRuns.length > 0 && selectedIndex >= 0 && selectedIndex < displayRuns.length) {
          const runId = displayRuns[selectedIndex]?.id;
          if (runId) selectBaselineRun(runId);
        }
        break;
      case input === 'c':
        if (displayRuns.length > 0 && selectedIndex >= 0 && selectedIndex < displayRuns.length) {
          const selectedRun = displayRuns[selectedIndex];
          if (
            selectedRun &&
            (allowSameRun || (selectedRun.id && selectedRun.id !== selectedBaselineRun))
          ) {
            selectComparisonRun(selectedRun.id);
          }
        }
        break;

      case input === 'r':
        setFilterMode('recent');
        break;
      case input === 'a':
        setFilterMode('all');
        break;
      case input === 'd':
        setFilterMode('by-date');
        break;

      case key.escape:
        onCancel();
        break;

      case input === 'x':
        // Execute comparison
        if (selectedBaselineRun && selectedComparisonRun) {
          onSelectRuns(selectedBaselineRun, selectedComparisonRun);
        }
        break;

      case input === '1':
        setSelectedIndex(0);
        break;
      case input === '2':
        setSelectedIndex(1);
        break;
      case input === '3':
        setSelectedIndex(2);
        break;
      case input === '4':
        setSelectedIndex(3);
        break;
      case input === '5':
        setSelectedIndex(4);
        break;
    }
  });

  const renderRun = (run: RunDisplayInfo, index: number) => {
    const isSelected = index === selectedIndex;
    const backgroundColor = isSelected ? 'blue' : undefined;
    const textColor = isSelected ? 'white' : 'black';

    const getRunTypeColor = () => {
      if (run.isBaseline) return 'green';
      if (run.isComparison) return 'yellow';
      return 'gray';
    };

    return (
      <Box
        key={run.id}
        flexDirection="column"
        padding={1}
        borderStyle="single"
        borderColor={isSelected ? 'blue' : 'gray'}
        backgroundColor={backgroundColor}
      >
        <Box flexDirection="row">
          <Box width={15}>
            <Text color={textColor} bold>
              {run.displayVersion}
            </Text>
          </Box>
          <Box width={12}>
            <Text color={textColor}>{run.displayDate}</Text>
          </Box>
          <Box width={10}>
            <Text color={textColor}>{run.relativeTime}</Text>
          </Box>
          <Box width={20}>
            <Text color={getRunTypeColor()}>
              {run.isBaseline && '[BASELINE]'}
              {run.isComparison && '[COMPARISON]'}
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Box width={50}>
            <Text color={textColor} dimColor>
              {run.commitHash ? `Commit: ${run.commitHash.slice(0, 7)}` : ''}
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row">
          <Box width={20}>
            <Text color={textColor} dimColor>
              Issues: {run.metadata.totalIssues}
            </Text>
          </Box>
          <Box width={15}>
            <Text color={textColor} dimColor>
              Critical: {run.metadata.criticalIssues}
            </Text>
          </Box>
          <Box width={15}>
            <Text color={textColor} dimColor>
              Score: {run.metadata.score}
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row">
          <Text color={textColor} dimColor>
            Tools: {run.metadata.tools.join(', ')}
          </Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" width={100}>
      {/* Header */}
      <Box flexDirection="row" marginBottom={1}>
        <Text bold color="blue">
          Select Runs for Comparison
        </Text>
        <Box flexGrow={1} />
        <Text color="gray">[Esc] Cancel</Text>
      </Box>

      {/* Selection Status */}
      <Box flexDirection="row" marginBottom={1}>
        <Box width={25}>
          <Text color={selectedBaselineRun ? 'green' : 'gray'}>
            Baseline: {selectedBaselineRun ? selectedBaselineRun.slice(0, 8) : 'Not selected'}
          </Text>
        </Box>
        <Box width={25}>
          <Text color={selectedComparisonRun ? 'yellow' : 'gray'}>
            Comparison: {selectedComparisonRun ? selectedComparisonRun.slice(0, 8) : 'Not selected'}
          </Text>
        </Box>
        <Box flexGrow={1} />
        {selectedBaselineRun && selectedComparisonRun && <Text color="green">[X] Compare</Text>}
      </Box>

      {/* Filter Controls */}
      <Box flexDirection="row" marginBottom={1}>
        <Text color="gray">Filter:</Text>
        <Box paddingLeft={1}>
          <Text color={filterMode === 'all' ? 'blue' : 'gray'}>[A] All</Text>
        </Box>
        <Box paddingLeft={1}>
          <Text color={filterMode === 'recent' ? 'blue' : 'gray'}>[R] Recent</Text>
        </Box>
        <Box paddingLeft={1}>
          <Text color={filterMode === 'by-date' ? 'blue' : 'gray'}>[D] By Date</Text>
        </Box>
      </Box>

      {/* Runs List */}
      <Box flexDirection="column" height={20} borderStyle="single" borderColor="gray">
        {displayRuns.length === 0 ? (
          <Box flexDirection="column" justifyContent="center" alignItems="center" height={20}>
            <Text color="gray">No runs found</Text>
            <Text color="gray" dimColor>
              Try adjusting filters or run an analysis first
            </Text>
          </Box>
        ) : (
          <Box flexDirection="column">
            {displayRuns.slice(0, 10).map((run, index) => renderRun(run, index))}
          </Box>
        )}
      </Box>

      {/* Instructions */}
      <Box flexDirection="row" marginTop={1}>
        <Text color="gray" dimColor>
          [↑↓] Navigate • [Enter] Select • [B] Baseline • [C] Comparison • [X] Compare
        </Text>
        <Box flexGrow={1} />
        <Text color="gray" dimColor>
          {selectedIndex + 1}/{displayRuns.length}
        </Text>
      </Box>

      {/* Legend */}
      <Box flexDirection="row" marginTop={1}>
        <Text color="green" dimColor>
          ● Baseline
        </Text>
        <Box paddingLeft={2}>
          <Text color="yellow" dimColor>
            ● Comparison
          </Text>
        </Box>
        <Box flexGrow={1} />
        <Text color="gray" dimColor>
          {!allowSameRun && 'Cannot select same run for comparison'}
        </Text>
      </Box>
    </Box>
  );
};

export default HistoricalRunSelector;
