/**
 * Metrics summary component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import { getScoreColor, getCoverageColor } from '../../utils/color-coding';

export function MetricsSummary(): React.ReactElement {
  const { currentResult, filteredIssues } = useDashboardStore();

  if (!currentResult) {
    return (
      <Box marginBottom={1}>
        <Text color="gray">No analysis results available</Text>
      </Box>
    );
  }

  const { summary: _summary, toolResults, duration, overallScore } = currentResult;

  // Calculate metrics
  const errorCount = filteredIssues.filter(issue => issue.type === 'error').length;
  const warningCount = filteredIssues.filter(issue => issue.type === 'warning').length;
  const infoCount = filteredIssues.filter(issue => issue.type === 'info').length;
  const fixableCount = filteredIssues.filter(issue => issue.fixable).length;

  // Get coverage from first tool that has it
  const coverage = toolResults.find(result => result.coverage)?.coverage;

  return (
    <Box marginBottom={1} flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Analysis Summary
        </Text>
      </Box>

      <Box justifyContent="space-between" marginBottom={1}>
        {/* Overall Score */}
        <Box marginRight={2}>
          <Text>Score: </Text>
          <Text bold color={getScoreColor(overallScore)}>
            {overallScore}/100
          </Text>
        </Box>

        {/* Issues Summary */}
        <Box marginRight={2}>
          <Text>Issues: </Text>
          <Text color="red">{errorCount}</Text>
          <Text> / </Text>
          <Text color="yellow">{warningCount}</Text>
          <Text> / </Text>
          <Text color="blue">{infoCount}</Text>
          <Text dimColor> (E/W/I)</Text>
        </Box>

        {/* Fixable Issues */}
        <Box marginRight={2}>
          <Text>Fixable: </Text>
          <Text color="green">{fixableCount}</Text>
        </Box>

        {/* Duration */}
        <Box>
          <Text>Time: </Text>
          <Text color="magenta">{(duration / 1000).toFixed(1)}s</Text>
        </Box>
      </Box>

      {/* Coverage Information */}
      {coverage && (
        <Box justifyContent="space-between" marginBottom={1}>
          <Box marginRight={2}>
            <Text>Coverage: </Text>
            <Text color={getCoverageColor(coverage.lines.percentage)}>
              L:{coverage.lines.percentage.toFixed(1)}%
            </Text>
            <Text> / </Text>
            <Text color={getCoverageColor(coverage.functions.percentage)}>
              F:{coverage.functions.percentage.toFixed(1)}%
            </Text>
            <Text> / </Text>
            <Text color={getCoverageColor(coverage.branches.percentage)}>
              B:{coverage.branches.percentage.toFixed(1)}%
            </Text>
          </Box>
        </Box>
      )}

      {/* Tools Summary */}
      <Box justifyContent="space-between">
        <Text color="gray" dimColor>
          Tools analyzed: {toolResults.length} | Total issues: {filteredIssues.length}
        </Text>
      </Box>
    </Box>
  );
}
