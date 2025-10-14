/**
 * Individual issue item component - ultra simplified
 */

import React from 'react';
import { Box, Text } from 'ink';
import { getSeverityColor, getSeveritySymbol } from '../../utils/color-coding';
import type { Issue } from '@dev-quality/core';

export function IssueItem({
  issue,
  isSelected,
  index: _index,
}: {
  issue: Issue;
  isSelected: boolean;
  index: number;
}): React.ReactElement {
  const { type, toolName, filePath, lineNumber, message, fixable, score } = issue;

  // Get just filename from path
  const fileName = filePath.split('/').pop() ?? filePath;

  // Truncate message aggressively
  const maxMessageLength = 40;
  const truncatedMessage = message.length > maxMessageLength
    ? `${message.substring(0, maxMessageLength - 3)}...`
    : message;

  return (
    <Box
      borderStyle={isSelected ? 'single' : undefined}
      borderColor={isSelected ? 'cyan' : undefined}
      paddingX={1}
      marginBottom={1}
    >
      <Text color={isSelected ? 'white' : 'reset'}>
        <Text color={getSeverityColor(type)}>{getSeveritySymbol(type)}</Text>
        <Text color="gray"> {String(_index + 1).padStart(2, ' ')}.</Text>
        <Text> {truncatedMessage}</Text>
        <Text color="gray"> ({fileName}:{lineNumber})</Text>
        <Text color="yellow"> {score}</Text>
        {fixable && <Text color="green"> ✓</Text>}
      </Text>
    </Box>
  );
}