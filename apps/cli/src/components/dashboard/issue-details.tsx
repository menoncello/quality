/**
 * Issue details component
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import { getSeverityColor, getSeveritySymbol, getScoreColor } from '../../utils/color-coding';
import type { Issue as _Issue } from '@dev-quality/core';
import type { IssueSeverity } from '../../types/dashboard';

export function IssueDetails(): React.ReactElement {
  const { selectedIssue, setCurrentView } = useDashboardStore();

  // Handle keyboard input
  useInput((input, key) => {
    if (key.escape) {
      setCurrentView('dashboard');
    }
  });

  if (!selectedIssue) {
    return (
      <Box flexDirection="column" padding={2}>
        <Box marginBottom={1}>
          <Text color="gray">No issue selected</Text>
        </Box>
        <Box>
          <Text color="gray" dimColor>
            Press Escape to go back
          </Text>
        </Box>
      </Box>
    );
  }

  const { id, type, toolName, filePath, lineNumber, message, ruleId, fixable, suggestion, score } =
    selectedIssue;

  // Format file path with line numbers
  const _fileLocation = `${filePath}:${lineNumber}`;
  const fileName = filePath.split('/').pop() ?? filePath;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box
        marginBottom={1}
        borderStyle="single"
        borderColor={getSeverityColor(type as IssueSeverity)}
        paddingX={1}
      >
        <Box justifyContent="space-between">
          <Box>
            <Text color={getSeverityColor(type as IssueSeverity)}>
              {getSeveritySymbol(type as IssueSeverity)}
            </Text>
            <Text bold color={getSeverityColor(type as IssueSeverity)}>
              {' '}
              {type.toUpperCase()}
            </Text>
            <Text bold color="white">
              {' '}
              Issue Details
            </Text>
          </Box>
          <Box>
            <Text color={getScoreColor(score)}>Score: {score}</Text>
          </Box>
        </Box>
      </Box>

      {/* Issue Information */}
      <Box flexDirection="column" marginBottom={1}>
        {/* Message */}
        <Box marginBottom={1}>
          <Text bold color="white">
            Message:
          </Text>
          <Box marginLeft={2}>
            <Text>{message}</Text>
          </Box>
        </Box>

        {/* File Location */}
        <Box marginBottom={1}>
          <Text bold color="white">
            Location:
          </Text>
          <Box marginLeft={2}>
            <Text color="cyan">{fileName}</Text>
            <Text color="gray" dimColor>
              :{lineNumber}
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="gray" dimColor>
              {filePath}
            </Text>
          </Box>
        </Box>

        {/* Tool Information */}
        <Box marginBottom={1}>
          <Text bold color="white">
            Tool:
          </Text>
          <Box marginLeft={2}>
            <Text color="yellow">{toolName}</Text>
            {ruleId && (
              <>
                <Text color="gray" dimColor>
                  {' '}
                  - Rule:{' '}
                </Text>
                <Text color="cyan">{ruleId}</Text>
              </>
            )}
          </Box>
        </Box>

        {/* Issue ID */}
        <Box marginBottom={1}>
          <Text bold color="white">
            ID:
          </Text>
          <Box marginLeft={2}>
            <Text color="gray" dimColor>
              {id}
            </Text>
          </Box>
        </Box>

        {/* Fixable Status */}
        <Box marginBottom={1}>
          <Text bold color="white">
            Fixable:
          </Text>
          <Box marginLeft={2}>
            {fixable ? <Text color="green">✓ Yes</Text> : <Text color="red">✗ No</Text>}
          </Box>
        </Box>

        {/* Suggestion */}
        {suggestion && (
          <Box marginBottom={1}>
            <Text bold color="white">
              Suggestion:
            </Text>
            <Box marginLeft={2}>
              <Text color="cyan">💡 {suggestion}</Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray" dimColor>
          Press Escape to go back to the issue list
        </Text>
      </Box>
    </Box>
  );
}
