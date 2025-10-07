/**
 * Issue Diff List Component
 * Displays list of issues with diff visualization
 */

import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Issue } from '../../types/analysis';
import type { ComparisonResult } from '../../hooks/useComparisonStore';
import { PriorityBadge } from './priority-badge';

interface IssueDiffListProps {
  comparison: ComparisonResult;
  issueType: 'new' | 'resolved' | 'unchanged';
  filters: {
    showNewIssues: boolean;
    showResolvedIssues: boolean;
    showUnchangedIssues: boolean;
    severityFilter: string[];
    toolFilter: string[];
  };
  visualization: {
    showCharts: boolean;
    showDiffs: boolean;
    showTrends: boolean;
  };
}

interface IssueWithDiff extends Issue {
  diffType: 'new' | 'resolved' | 'unchanged';
  oldSeverity?: string;
  newSeverity?: string;
  oldScore?: number;
  newScore?: number;
  scoreDiff?: number;
}

export const IssueDiffList: React.FC<IssueDiffListProps> = ({
  comparison,
  issueType,
  filters,
  visualization,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sortBy, setSortBy] = useState<'severity' | 'score' | 'tool' | 'file'>('severity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get issues based on type
  const rawIssues = useMemo(() => {
    let issues: IssueWithDiff[] = [];

    switch (issueType) {
      case 'new':
        issues = comparison.differences.newIssues.map(issue => ({
          ...issue,
          diffType: 'new',
        }));
        break;
      case 'resolved':
        issues = comparison.differences.resolvedIssues.map(issue => ({
          ...issue,
          diffType: 'resolved',
        }));
        break;
      case 'unchanged':
        issues = comparison.differences.unchangedIssues.map(issue => ({
          ...issue,
          diffType: 'unchanged',
        }));
        break;
    }

    // Add severity changes and score changes for unchanged issues
    if (issueType === 'unchanged') {
      comparison.differences.severityChanges.forEach(change => {
        const existingIndex = issues.findIndex(i => i.id === change.issue.id);
        if (existingIndex >= 0 && change.issue.id) {
          const existingIssue = issues[existingIndex];
          if (existingIssue) {
            issues[existingIndex] = {
              ...existingIssue,
              oldSeverity: change.oldSeverity,
              newSeverity: change.newSeverity,
              diffType: 'unchanged',
              type: change.issue.type || 'error',
              id: change.issue.id,
              toolName: change.issue.toolName || existingIssue.toolName,
              filePath: change.issue.filePath || existingIssue.filePath,
              lineNumber: change.issue.lineNumber ?? existingIssue.lineNumber,
            };
          }
        }
      });

      comparison.differences.scoreChanges.forEach(change => {
        const existingIndex = issues.findIndex(i => i.id === change.issue.id);
        if (existingIndex >= 0 && change.issue.id) {
          const existingIssue = issues[existingIndex];
          if (existingIssue) {
            issues[existingIndex] = {
              ...existingIssue,
              oldScore: change.oldScore,
              newScore: change.newScore,
              scoreDiff: change.diff,
              diffType: 'unchanged',
              type: change.issue.type || 'error',
              id: change.issue.id,
              toolName: change.issue.toolName || existingIssue.toolName,
              filePath: change.issue.filePath || existingIssue.filePath,
              lineNumber: change.issue.lineNumber ?? existingIssue.lineNumber,
            };
          }
        }
      });
    }

    return issues;
  }, [comparison, issueType]);

  // Apply filters and sorting
  const filteredAndSortedIssues = useMemo(() => {
    let filtered = rawIssues;

    // Apply severity filter
    if (filters.severityFilter.length > 0) {
      filtered = filtered.filter(issue => filters.severityFilter.includes(issue.type));
    }

    // Apply tool filter
    if (filters.toolFilter.length > 0) {
      filtered = filtered.filter(issue => filters.toolFilter.includes(issue.toolName));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparisonValue = 0;

      switch (sortBy) {
        case 'severity': {
          const severityOrder = { error: 3, warning: 2, info: 1 };
          comparisonValue = severityOrder[a.type] - severityOrder[b.type];
          break;
        }
        case 'score':
          comparisonValue = (a.score || 0) - (b.score || 0);
          break;
        case 'tool':
          comparisonValue = a.toolName.localeCompare(b.toolName);
          break;
        case 'file':
          comparisonValue = a.filePath.localeCompare(b.filePath);
          break;
      }

      return sortOrder === 'asc' ? comparisonValue : -comparisonValue;
    });

    return filtered;
  }, [rawIssues, filters, sortBy, sortOrder]);

  // Keyboard navigation
  useInput((input, key) => {
    switch (true) {
      case key.upArrow:
        setSelectedIndex(prev => Math.max(0, prev - 1));
        break;
      case key.downArrow:
        setSelectedIndex(prev => Math.min(filteredAndSortedIssues.length - 1, prev + 1));
        break;
      case input === '\u0001': // Ctrl+A (home)
        setSelectedIndex(0);
        break;
      case input === '\u0005': // Ctrl+E (end)
        setSelectedIndex(filteredAndSortedIssues.length - 1);
        break;

      case input === 's':
        setSortBy('severity');
        break;
      case input === 'c':
        setSortBy('score');
        break;
      case input === 't':
        setSortBy('tool');
        break;
      case input === 'f':
        setSortBy('file');
        break;

      case input === 'o':
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        break;

      case input === '1':
        setSortBy('severity');
        break;
      case input === '2':
        setSortBy('score');
        break;
      case input === '3':
        setSortBy('tool');
        break;
      case input === '4':
        setSortBy('file');
        break;
    }
  });

  const renderIssue = (issue: IssueWithDiff, index: number) => {
    const isSelected = index === selectedIndex;
    const backgroundColor = isSelected ? 'blue' : undefined;
    const textColor = isSelected ? 'white' : 'black';

    // Get colors based on diff type
    const getDiffTypeColor = () => {
      switch (issue.diffType) {
        case 'new':
          return 'red';
        case 'resolved':
          return 'green';
        default:
          return 'gray';
      }
    };

    const diffTypeColor = getDiffTypeColor();

    return (
      <Box
        key={issue.id}
        flexDirection="column"
        padding={1}
        borderStyle="single"
        borderColor={isSelected ? 'blue' : 'gray'}
        backgroundColor={backgroundColor}
      >
        <Box flexDirection="row">
          <Text color={textColor} bold>
            {issue.diffType === 'new' ? '+' : issue.diffType === 'resolved' ? '-' : ' '}
          </Text>
          <Box paddingLeft={1}>
            <Text color={textColor}>
              {issue.message.length > 60 ? `${issue.message.slice(0, 57)}...` : issue.message}
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Box width={20}>
            <Text color={textColor} dimColor>
              {issue.filePath.split('/').pop()}
            </Text>
          </Box>
          <Box width={15}>
            <Text color={textColor} dimColor>
              {issue.toolName}
            </Text>
          </Box>
          <Box width={15}>
            <Text color={textColor} dimColor>
              {issue.type}
            </Text>
          </Box>
          <Box width={10}>
            <PriorityBadge score={issue.score} showScore={false} />
          </Box>
          <Box width={15}>
            <Text color={diffTypeColor} bold>
              {issue.diffType.toUpperCase()}
            </Text>
          </Box>
        </Box>

        {/* Show changes for unchanged issues */}
        {issue.diffType === 'unchanged' && visualization.showDiffs && (
          <Box flexDirection="column" marginTop={1}>
            {issue.oldSeverity && issue.newSeverity && (
              <Text color={textColor} dimColor>
                Severity: {issue.oldSeverity} → {issue.newSeverity}
              </Text>
            )}
            {issue.oldScore !== undefined && issue.newScore !== undefined && (
              <Text color={textColor} dimColor>
                Score: {issue.oldScore} → {issue.newScore} ({(issue.scoreDiff ?? 0) > 0 ? '+' : ''}
                {issue.scoreDiff ?? 0})
              </Text>
            )}
          </Box>
        )}

        <Box flexDirection="row" marginTop={1}>
          <Text color={textColor} dimColor>
            Line {issue.lineNumber} • {issue.ruleId}
          </Text>
          {issue.fixable && (
            <Box paddingLeft={2}>
              <Text color={textColor} bold>
                [FIXABLE]
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  if (filteredAndSortedIssues.length === 0) {
    return (
      <Box flexDirection="column" padding={2}>
        <Text color="gray">No {issueType} issues found</Text>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Try adjusting filters or check other issue types
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Header with sorting controls */}
      <Box flexDirection="row" marginBottom={1} padding={1}>
        <Text color="blue" bold>
          {issueType.charAt(0).toUpperCase() + issueType.slice(1)} Issues (
          {filteredAndSortedIssues.length})
        </Text>
        <Box flexGrow={1} />
        <Text color="gray" dimColor>
          Sort: [
          {sortBy === 'severity' ? '1' : sortBy === 'score' ? '2' : sortBy === 'tool' ? '3' : '4'}]{' '}
          {sortBy} [{sortOrder === 'asc' ? '↑' : '↓'}]
        </Text>
      </Box>

      {/* Sort shortcuts */}
      <Box flexDirection="row" marginBottom={1} paddingX={1}>
        <Text color="gray" dimColor>
          [1] Severity [2] Score [3] Tool [4] File [O] Order
        </Text>
        <Box flexGrow={1} />
        <Text color="gray" dimColor>
          {selectedIndex + 1}/{filteredAndSortedIssues.length}
        </Text>
      </Box>

      {/* Issues list */}
      <Box flexDirection="column" height={20}>
        <Box flexDirection="column">
          {filteredAndSortedIssues.slice(0, 10).map((issue, index) => renderIssue(issue, index))}
        </Box>
      </Box>

      {/* Legend */}
      <Box flexDirection="row" marginTop={1} paddingX={1}>
        <Text color="red" dimColor>
          + New
        </Text>
        <Box paddingLeft={2}>
          <Text color="gray" dimColor>
            - Resolved
          </Text>
        </Box>
        <Box paddingLeft={2}>
          <Text color="gray" dimColor>
            ± Unchanged
          </Text>
        </Box>
        <Box flexGrow={1} />
        <Text color="gray" dimColor>
          [↑↓] Navigate • [Home/End] First/Last
        </Text>
      </Box>
    </Box>
  );
};
