/**
 * Issue list component - simplified
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import { createListNavigation } from '../../utils/keyboard-navigation';
import { IssueItem } from '../issues/issue-item';

export function IssueList(): React.ReactElement {
  const {
    filteredIssues,
    selectedIssue: _selectedIssue,
    currentView,
    setSelectedIssue,
    setCurrentView,
    setSelectedIndex,
    addToNavigationHistory,
  } = useDashboardStore();

  const [selectedIndex, setSelectedIndexState] = useState(0);

  // Sort issues by score (descending)
  const sortedIssues = [...filteredIssues].sort((a, b) => b.score - a.score);

  // Create navigation handler
  const navigationHandler = createListNavigation(
    sortedIssues.length,
    index => {
      const issue = sortedIssues[index];
      if (issue) {
        setSelectedIssue(issue);
        setCurrentView('issue-details');
        addToNavigationHistory('issue-details', index);
      }
    },
    { wrapAround: true, skipDisabled: true, pageSize: 5 }
  );

  // Handle keyboard input
  useInput((_input, key) => {
    if (currentView === 'dashboard' || currentView === 'issue-list') {
      let newIndex = selectedIndex;

      if (key.upArrow || _input === 'k') {
        newIndex = navigationHandler.handleKeyDown('up', selectedIndex);
      } else if (key.downArrow || _input === 'j') {
        newIndex = navigationHandler.handleKeyDown('down', selectedIndex);
      } else if (key.return) {
        navigationHandler.handleKeyDown('enter', selectedIndex);
        return;
      } else if (_input >= '1' && _input <= '9') {
        const numericIndex = parseInt(_input) - 1;
        if (numericIndex < sortedIssues.length) {
          newIndex = numericIndex;
          navigationHandler.handleKeyDown('enter', numericIndex);
        }
      }

      if (newIndex !== selectedIndex) {
        setSelectedIndexState(newIndex);
        setSelectedIndex(newIndex);

        if (sortedIssues[newIndex]) {
          setSelectedIssue(sortedIssues[newIndex] ?? null);
        }
      }
    }
  });

  // Update selected issue when selectedIndex changes
  useEffect(() => {
    if (sortedIssues[selectedIndex]) {
      setSelectedIssue(sortedIssues[selectedIndex]);
    }
  }, [selectedIndex, sortedIssues.length]);

  if (sortedIssues.length === 0) {
    return (
      <Box justifyContent="center" padding={2}>
        <Text color="gray">No issues found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Issues ({sortedIssues.length})
        </Text>
      </Box>

      {/* Sort Controls */}
      <Box marginBottom={1}>
        <Text color="gray" dimColor>
          Sorted by score (highest first)
        </Text>
      </Box>

      {/* Issue List */}
      <Box flexDirection="column" marginBottom={1}>
        {sortedIssues.map((issue, index) => (
          <IssueItem
            key={issue.id}
            issue={issue}
            isSelected={index === selectedIndex}
            index={index}
          />
        ))}
      </Box>

      {/* Footer with navigation hints */}
      <Box>
        <Text color="gray" dimColor>
          ↑↓ Navigate | Enter: Details | 1-9: Quick jump | 'q' to quit
        </Text>
      </Box>
    </Box>
  );
}