/**
 * Issue list component with navigation
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import { createListNavigation } from '../../utils/keyboard-navigation';
// import { getSeverityColor, getSeveritySymbol } from '../../utils/color-coding'; // Unused imports
import { IssueItem } from '../issues/issue-item';
import { SortControls } from './sort-controls';
import { Pagination } from './pagination';

export function IssueList(): React.ReactElement {
  const {
    filteredIssues,
    selectedIssue: _selectedIssue,
    currentView,
    currentPage,
    itemsPerPage,
    sortBy,
    sortOrder,
    setSelectedIssue,
    setCurrentView,
    setSelectedIndex,
    addToNavigationHistory,
  } = useDashboardStore();

  const [selectedIndex, setSelectedIndexState] = useState(0);

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredIssues.length);
  const currentIssues = filteredIssues.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);

  // Sort issues
  const sortedIssues = [...currentIssues].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'score':
        comparison = a.score - b.score;
        break;
      case 'severity': {
        const severityOrder = { error: 3, warning: 2, info: 1 };
        comparison = severityOrder[a.type] - severityOrder[b.type];
        break;
      }
      case 'filePath':
        comparison = a.filePath.localeCompare(b.filePath);
        break;
      case 'toolName':
        comparison = a.toolName.localeCompare(b.toolName);
        break;
      case 'lineNumber':
        comparison = a.lineNumber - b.lineNumber;
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

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
        if (numericIndex < sortedIssues.length) {
          newIndex = numericIndex;
          navigationHandler.handleKeyDown('enter', numericIndex);
        }
      }

      if (newIndex !== selectedIndex) {
        setSelectedIndexState(newIndex);
        setSelectedIndex(newIndex);

        // Auto-select the issue
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
  }, [selectedIndex, sortedIssues, setSelectedIssue]);

  // Render header
  const renderHeader = () => (
    <Box marginBottom={1}>
      <Box justifyContent="space-between" width="100%">
        <Text bold color="cyan">
          Issues ({startIndex + 1}-{endIndex} of {filteredIssues.length})
        </Text>
        <Text color="gray" dimColor>
          Page {currentPage} of {totalPages}
        </Text>
      </Box>
    </Box>
  );

  // Render empty state
  if (sortedIssues.length === 0) {
    return (
      <Box flexDirection="column">
        {renderHeader()}
        <Box justifyContent="center" padding={2}>
          <Text color="gray">No issues found</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {renderHeader()}

      {/* Sort Controls */}
      <Box marginBottom={1}>
        <SortControls />
      </Box>

      {/* Issue List */}
      <Box flexDirection="column" marginBottom={1}>
        {sortedIssues.length > 0 ? (
          sortedIssues.map((issue, index) => (
            <IssueItem
              key={issue.id}
              issue={issue}
              isSelected={index === selectedIndex}
              index={index}
            />
          ))
        ) : (
          <Box justifyContent="center" padding={2}>
            <Text color="gray">No issues found</Text>
          </Box>
        )}
      </Box>

      {/* Pagination */}
      <Pagination />

      {/* Footer with navigation hints */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          ↑↓ Navigate | Enter: Details | 1-9: Quick jump | Home/End: First/Last | Page Up/Down:
          Navigate pages
        </Text>
      </Box>
    </Box>
  );
}
