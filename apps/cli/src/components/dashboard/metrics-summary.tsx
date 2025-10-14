/**
 * Metrics summary component - simplified
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import { getScoreColor } from '../../utils/color-coding';

export function MetricsSummary(): React.ReactElement {
  const { currentResult, filteredIssues } = useDashboardStore();

  if (!currentResult) {
    return (
      <Box marginBottom={1}>
        <Text color="gray">No analysis results</Text>
      </Box>
    );
  }

  const { duration, overallScore } = currentResult;
  const errorCount = filteredIssues.filter(issue => issue.type === 'error').length;
  const warningCount = filteredIssues.filter(issue => issue.type === 'warning').length;
  const fixableCount = filteredIssues.filter(issue => issue.fixable).length;

  return (
    <Box marginBottom={2}>
      <Text>
        Score: <Text bold color={getScoreColor(overallScore)}>{overallScore}</Text> |
        Issues: <Text color="red">{errorCount}</Text>/<Text color="yellow">{warningCount}</Text> |
        Fixable: <Text color="green">{fixableCount}</Text> |
        Time: {(duration / 1000).toFixed(1)}s
      </Text>
    </Box>
  );
}