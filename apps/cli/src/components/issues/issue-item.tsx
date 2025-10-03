/**
 * Individual issue item component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { getSeverityColor, getSeveritySymbol } from '../../utils/color-coding';
import type { Issue } from '@dev-quality/core';
import type { IssueSeverity } from '../../types/dashboard';

interface IssueItemProps {
  issue: Issue;
  isSelected: boolean;
  index: number;
}

export function IssueItem({
  issue,
  isSelected,
  index: _index,
}: IssueItemProps): React.ReactElement {
  const {
    id: _id,
    type,
    toolName,
    filePath,
    lineNumber,
    message,
    ruleId,
    fixable,
    suggestion,
    score,
  } = issue;

  // Truncate message if too long
  const maxMessageLength = 80;
  const truncatedMessage =
    message.length > maxMessageLength
      ? `${message.substring(0, maxMessageLength - 3)}...`
      : message;

  // Truncate file path if too long
  const maxPathLength = 30;
  const displayPath =
    filePath.length > maxPathLength
      ? `.../${filePath.substring(filePath.length - maxPathLength + 4)}`
      : filePath;

  return (
    <Box
      flexDirection="column"
      paddingX={1}
      borderStyle={isSelected ? 'single' : undefined}
      borderColor={isSelected ? 'cyan' : undefined}
    >
      <Box justifyContent="space-between" marginBottom={0}>
        {/* Left side: severity symbol and index */}
        <Box marginRight={1}>
          <Text color={getSeverityColor(type as IssueSeverity)}>
            {getSeveritySymbol(type as IssueSeverity)}
          </Text>
          <Text color="gray" dimColor>
            {String(_index + 1).padStart(2, ' ')}.
          </Text>
        </Box>

        {/* Middle: issue message */}
        <Box flexGrow={1} marginRight={1}>
          <Text color={isSelected ? 'white' : 'reset'}>{truncatedMessage}</Text>
        </Box>

        {/* Right side: score and fixable indicator */}
        <Box>
          <Text color={isSelected ? 'white' : 'yellow'}>{score}</Text>
          {fixable && (
            <Box marginLeft={1}>
              <Text color="green">✓</Text>
            </Box>
          )}
        </Box>
      </Box>

      <Box justifyContent="space-between">
        {/* File information */}
        <Box>
          <Text color="gray" dimColor>
            {displayPath}:{lineNumber}
          </Text>
          <Box marginLeft={1}>
            <Text color="gray" dimColor>
              ({toolName})
            </Text>
          </Box>
          {ruleId && (
            <Box marginLeft={1}>
              <Text color="cyan" dimColor>
                [{ruleId}]
              </Text>
            </Box>
          )}
        </Box>

        {/* Severity indicator */}
        <Box>
          <Text
            color={getSeverityColor(type as IssueSeverity)}
            backgroundColor={isSelected ? 'black' : undefined}
          >
            {type.toUpperCase()}
          </Text>
        </Box>
      </Box>

      {/* Show suggestion if available and selected */}
      {isSelected && suggestion && (
        <Box marginTop={1} paddingX={1}>
          <Text color="cyan" dimColor>
            💡 {suggestion}
          </Text>
        </Box>
      )}
    </Box>
  );
}
