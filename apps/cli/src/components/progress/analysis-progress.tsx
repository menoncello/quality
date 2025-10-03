/**
 * Analysis progress component
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { AnalysisProgress as AnalysisProgressType } from '@dev-quality/core';

interface AnalysisProgressProps {
  progress: AnalysisProgressType;
}

export function AnalysisProgress({ progress }: AnalysisProgressProps): React.ReactElement {
  const {
    totalPlugins,
    completedPlugins,
    currentPlugin,
    percentage,
    estimatedTimeRemaining,
    startTime,
  } = progress;

  // Calculate elapsed time
  const elapsedMs = Date.now() - startTime.getTime();
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  // Format time
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Create progress bar
  const createProgressBar = (current: number, total: number, width: number = 20): string => {
    const filled = Math.floor((current / total) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  };

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="blue">
      <Box marginBottom={1}>
        <Text bold color="blue">
          Analysis Progress
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>{createProgressBar(completedPlugins, totalPlugins)} </Text>
        <Text color="cyan">
          {completedPlugins}/{totalPlugins}
        </Text>
        <Text dimColor> plugins</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Percentage: </Text>
        <Text color="green">{percentage.toFixed(1)}%</Text>
      </Box>

      {currentPlugin && (
        <Box marginBottom={1}>
          <Text>Current: </Text>
          <Text color="yellow">{currentPlugin}</Text>
        </Box>
      )}

      <Box justifyContent="space-between">
        <Box>
          <Text>Elapsed: </Text>
          <Text color="magenta">{formatTime(elapsedSeconds)}</Text>
        </Box>

        {estimatedTimeRemaining && (
          <Box>
            <Text>Remaining: </Text>
            <Text color="cyan">{formatTime(Math.floor(estimatedTimeRemaining / 1000))}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
