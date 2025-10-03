/**
 * Virtualized issue list for handling large datasets efficiently
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import { createListNavigation } from '../../utils/keyboard-navigation';
import { IssueItem } from '../issues/issue-item';
import { transformCoreIssueToCLI } from '../../utils/type-transformers';
import type { Issue } from '@dev-quality/core';
import type { VirtualizationConfig } from '../../types/dashboard';

interface VirtualizedIssueListProps {
  issues: Issue[];
  itemsPerPage?: number;
  bufferItems?: number;
}

export function VirtualizedIssueList({
  issues,
  itemsPerPage = 10,
  bufferItems = 5,
}: VirtualizedIssueListProps): React.ReactElement {
  const {
    selectedIssue: _selectedIssue,
    setSelectedIssue,
    setCurrentView,
    addToNavigationHistory,
  } = useDashboardStore();

  const [selectedIndex, setSelectedIndexState] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate virtualization
  const _virtualization: VirtualizationConfig = useMemo(
    () => ({
      windowSize: itemsPerPage,
      bufferItems,
      totalItems: issues.length,
      scrollTop,
    }),
    [itemsPerPage, bufferItems, issues.length, scrollTop]
  );

  // Calculate visible range with buffer
  const visibleRange = useMemo(() => {
    const bufferedStart = Math.max(0, scrollTop - bufferItems);
    const bufferedEnd = Math.min(issues.length, scrollTop + itemsPerPage + bufferItems);
    return { start: bufferedStart, end: bufferedEnd };
  }, [scrollTop, itemsPerPage, bufferItems, issues.length]);

  // Get visible issues
  const visibleIssues = useMemo(() => {
    return issues.slice(visibleRange.start, visibleRange.end);
  }, [issues, visibleRange]);

  // Create navigation handler
  const navigationHandler = useMemo(() => {
    return createListNavigation(
      issues.length,
      index => {
        const issue = issues[index];
        if (issue) {
          setSelectedIssue(transformCoreIssueToCLI(issue));
          setCurrentView('issue-details');
          addToNavigationHistory('issue-details', index);
        }
      },
      { wrapAround: true, skipDisabled: true, pageSize: Math.floor(itemsPerPage / 2) }
    );
  }, [issues, itemsPerPage, setSelectedIssue, setCurrentView, addToNavigationHistory]);

  // Handle keyboard input
  useInput((_input, key) => {
    let newIndex = selectedIndex;

    if (key.upArrow || _input === 'k') {
      newIndex = navigationHandler.handleKeyDown('up', selectedIndex);
    } else if (key.downArrow || _input === 'j') {
      newIndex = navigationHandler.handleKeyDown('down', selectedIndex);
    } else if (key.ctrl && _input === 'a') {
      // Ctrl+A for home
      newIndex = navigationHandler.handleKeyDown('home', selectedIndex);
    } else if (key.ctrl && _input === 'e') {
      // Ctrl+E for end
      newIndex = navigationHandler.handleKeyDown('end', selectedIndex);
    } else if (key.pageUp) {
      newIndex = navigationHandler.handleKeyDown('pageup', selectedIndex);
    } else if (key.pageDown) {
      newIndex = navigationHandler.handleKeyDown('pagedown', selectedIndex);
    } else if (key.return) {
      navigationHandler.handleKeyDown('enter', selectedIndex);
      return;
    } else if (_input >= '1' && _input <= '9') {
      const numericIndex = parseInt(_input) - 1;
      if (numericIndex < issues.length) {
        newIndex = numericIndex;
        navigationHandler.handleKeyDown('enter', numericIndex);
      }
    }

    if (newIndex !== selectedIndex) {
      setSelectedIndexState(newIndex);

      // Update scroll position if needed
      if (newIndex < scrollTop + bufferItems) {
        setScrollTop(Math.max(0, newIndex - bufferItems));
      } else if (newIndex >= scrollTop + itemsPerPage - bufferItems) {
        setScrollTop(Math.min(issues.length - itemsPerPage, newIndex - itemsPerPage + bufferItems));
      }

      // Auto-select the issue
      const issue = issues[newIndex];
      if (issue) {
        setSelectedIssue(transformCoreIssueToCLI(issue));
      }
    }
  });

  // Update selected issue when selectedIndex changes
  useEffect(() => {
    if (issues[selectedIndex]) {
      setSelectedIssue(transformCoreIssueToCLI(issues[selectedIndex]));
    }
  }, [selectedIndex, issues, setSelectedIssue]);

  // Reset scroll when issues change
  useEffect(() => {
    setScrollTop(0);
    setSelectedIndexState(0);
  }, [issues.length]);

  // Calculate display offset for visible items
  const getDisplayOffset = (index: number): number => {
    return index - visibleRange.start;
  };

  if (issues.length === 0) {
    return (
      <Box justifyContent="center" padding={2}>
        <Text color="gray">No issues found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Header with virtualization info */}
      <Box marginBottom={1}>
        <Text color="gray" dimColor>
          Showing {visibleRange.start + 1}-{Math.min(visibleRange.end, issues.length)} of{' '}
          {issues.length} issues
        </Text>
        {issues.length > itemsPerPage && (
          <Box marginLeft={2}>
            <Text color="gray" dimColor>
              (Virtualized: {itemsPerPage} items, {bufferItems} buffer)
            </Text>
          </Box>
        )}
      </Box>

      {/* Virtualized list */}
      <Box flexDirection="column" height={itemsPerPage}>
        {visibleIssues.map((issue, visibleIndex) => {
          const actualIndex = visibleRange.start + visibleIndex;
          const isSelected = actualIndex === selectedIndex;
          const displayOffset = getDisplayOffset(actualIndex);

          // Only render if within visible window
          if (displayOffset < 0 || displayOffset >= itemsPerPage + bufferItems * 2) {
            return null;
          }

          return (
            <Box key={issue.id}>
              <IssueItem issue={issue} isSelected={isSelected} index={actualIndex} />
            </Box>
          );
        })}
      </Box>

      {/* Footer with navigation hints */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          ↑↓ Navigate | Enter: Details | 1-9: Quick jump | Home/End: First/Last | Page Up/Down:
          Navigate
        </Text>
      </Box>
    </Box>
  );
}
