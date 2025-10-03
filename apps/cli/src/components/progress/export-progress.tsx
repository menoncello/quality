/**
 * Export progress component
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { ExportProgress as ExportProgressType } from '../../types/export';

interface ExportProgressProps {
  progress: ExportProgressType;
  error?: string;
  onComplete?: () => void;
}

export function ExportProgress({
  progress,
  error: _error,
  onComplete: _onComplete,
}: ExportProgressProps): React.ReactElement {
  const { currentStep, percentage, estimatedTimeRemaining, bytesWritten } = progress;

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Format time
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Create progress bar
  const createProgressBar = (current: number, width: number = 20): string => {
    const filled = Math.floor((current / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  };

  const isComplete = percentage === 100;

  React.useEffect(() => {
    if (isComplete && _onComplete) {
      const timer = setTimeout(_onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, _onComplete]);

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor={_error ? 'red' : 'green'}
    >
      <Box marginBottom={1}>
        <Text bold color={_error ? 'red' : isComplete ? 'green' : 'blue'}>
          {_error ? 'Export Failed' : isComplete ? 'Export Complete' : 'Exporting...'}
        </Text>
      </Box>

      {!_error && (
        <>
          <Box marginBottom={1}>
            <Text>{createProgressBar(percentage)} </Text>
            <Text color={isComplete ? 'green' : 'cyan'}>{percentage.toFixed(1)}%</Text>
            <Text dimColor> {currentStep}</Text>
          </Box>

          <Box justifyContent="space-between" marginBottom={1}>
            <Box>
              <Text>Step: </Text>
              <Text color="yellow">{currentStep}</Text>
            </Box>

            {estimatedTimeRemaining && !isComplete && (
              <Box>
                <Text>ETA: </Text>
                <Text color="magenta">{formatTime(estimatedTimeRemaining)}</Text>
              </Box>
            )}
          </Box>

          {bytesWritten !== undefined && (
            <Box justifyContent="space-between">
              <Box>
                <Text>Written: </Text>
                <Text color="cyan">{formatFileSize(bytesWritten)}</Text>
              </Box>

              {isComplete && (
                <Box>
                  <Text color="green">✓ Complete</Text>
                </Box>
              )}
            </Box>
          )}
        </>
      )}

      {_error && (
        <Box>
          <Text color="red">Error: {_error}</Text>
        </Box>
      )}
    </Box>
  );
}
