/**
 * File summary component for grouping issues by file
 */

import React from 'react';
import { Box, Text } from 'ink';
// import { useDashboardStore } from '../../hooks/useDashboardStore'; // Unused import
import { SeverityBadge } from './severity-badge';
import { getSeverityColor } from '../../utils/color-coding';
import type { Issue } from '@dev-quality/core';
import type { IssueSeverity } from '../../types/dashboard';

interface FileSummaryProps {
  filePath: string;
  issues: Issue[];
  isExpanded: boolean;
  onToggle: () => void;
  onSelectIssue: (issue: Issue) => void;
  selectedIssueId?: string;
}

export function FileSummary({
  filePath,
  issues,
  isExpanded,
  onToggle: _onToggle,
  onSelectIssue: _onSelectIssue,
  selectedIssueId,
}: FileSummaryProps): React.ReactElement {
  const fileName = filePath.split('/').pop() ?? filePath;
  const directory = filePath.substring(0, filePath.lastIndexOf('/'));

  // Count issues by severity
  const errorCount = issues.filter(issue => issue.type === 'error').length;
  const warningCount = issues.filter(issue => issue.type === 'warning').length;
  const infoCount = issues.filter(issue => issue.type === 'info').length;
  const fixableCount = issues.filter(issue => issue.fixable).length;

  // Get highest severity for color coding
  const getHighestSeverity = (): string => {
    if (errorCount > 0) return 'error';
    if (warningCount > 0) return 'warning';
    return 'info';
  };

  const highestSeverity = getHighestSeverity();

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* File header */}
      <Box
        paddingX={1}
        paddingY={0}
        borderStyle="single"
        borderColor={getSeverityColor(highestSeverity as IssueSeverity)}
      >
        <Box marginRight={1}>
          <Text color={getSeverityColor(highestSeverity as IssueSeverity)}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </Box>

        <Box flexGrow={1} marginRight={1}>
          <Text bold color="white">
            {fileName}
          </Text>
          {directory && (
            <Box marginLeft={1}>
              <Text color="gray" dimColor>
                ({directory})
              </Text>
            </Box>
          )}
        </Box>

        {/* Issue counts */}
        <Box marginRight={1}>
          {errorCount > 0 && (
            <Box marginLeft={1}>
              <Text color="red">{errorCount}E</Text>
            </Box>
          )}
          {warningCount > 0 && (
            <Box marginLeft={1}>
              <Text color="yellow">{warningCount}W</Text>
            </Box>
          )}
          {infoCount > 0 && (
            <Box marginLeft={1}>
              <Text color="blue">{infoCount}I</Text>
            </Box>
          )}
        </Box>

        {/* Fixable indicator */}
        {fixableCount > 0 && (
          <Box marginRight={1}>
            <Text color="green">✓{fixableCount}</Text>
          </Box>
        )}

        {/* Issue count */}
        <Text color="gray" dimColor>
          {issues.length}
        </Text>
      </Box>

      {/* Expanded issues */}
      {isExpanded && (
        <Box flexDirection="column" marginLeft={2}>
          {issues.map((issue, _index) => (
            <Box key={issue.id} paddingX={1} paddingY={0}>
              <Box marginRight={1}>
                <Text color="gray" dimColor>
                  {issue.lineNumber}
                </Text>
              </Box>

              <Box marginRight={1}>
                <SeverityBadge severity={issue.type as IssueSeverity} compact />
              </Box>

              <Box flexGrow={1} marginRight={1}>
                <Text color={selectedIssueId === issue.id ? 'white' : 'reset'}>
                  {issue.message.length > 80
                    ? `${issue.message.substring(0, 77)}...`
                    : issue.message}
                </Text>
              </Box>

              <Box marginRight={1}>
                <Text color="gray" dimColor>
                  ({issue.toolName})
                </Text>
              </Box>

              <Box>
                {issue.fixable && <Text color="green">✓</Text>}
                <Box marginLeft={1}>
                  <Text color="yellow">{issue.score}</Text>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
