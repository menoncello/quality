/**
 * Navigation hooks for dashboard
 */

import React, { useCallback } from 'react';
import { useInput } from 'ink';
import { useDashboardStore } from './useDashboardStore';
import { createListNavigation, createMenuNavigation } from '../utils/keyboard-navigation';

export function useNavigation() {
  const {
    currentView,
    filteredIssues,
    selectedIssue,
    selectedIndex,
    setCurrentView,
    setSelectedIssue,
    setSelectedIndex,
    addToNavigationHistory,
    goBack,
  } = useDashboardStore();

  // Handle issue list navigation
  const issueListNavigation = createListNavigation(
    filteredIssues.length,
    index => {
      const issue = filteredIssues[index];
      if (issue) {
        setSelectedIssue(issue);
        setCurrentView('issue-details');
        addToNavigationHistory('issue-details', index);
      }
    },
    { wrapAround: true, skipDisabled: true, pageSize: 5 }
  );

  // Handle keyboard shortcuts
  const _handleKeyDown = useCallback(
    (key: string) => {
      switch (key) {
        case 'escape':
          if (currentView === 'issue-details') {
            goBack();
          }
          break;
        case 'q':
          process.exit(0);
          break;
        case 'f':
          // Toggle filter menu - will be implemented later
          break;
        case 'e':
          // Toggle export menu - will be implemented later
          break;
      }
    },
    [currentView, goBack]
  );

  useInput((_input, key) => {
    let handled = false;

    // Handle special keys
    if (key.escape) {
      _handleKeyDown('escape');
      handled = true;
    } else if (_input === 'q') {
      _handleKeyDown('q');
      handled = true;
    } else if (_input === 'f') {
      _handleKeyDown('f');
      handled = true;
    } else if (_input === 'e') {
      _handleKeyDown('e');
      handled = true;
    }

    // Handle navigation based on current view
    if (!handled) {
      if (currentView === 'dashboard' || currentView === 'issue-list') {
        let newIndex = selectedIndex;

        if (key.upArrow || _input === 'k') {
          newIndex = issueListNavigation.handleKeyDown('up', selectedIndex);
        } else if (key.downArrow || _input === 'j') {
          newIndex = issueListNavigation.handleKeyDown('down', selectedIndex);
        } else if (key.ctrl && _input === 'a') {
          newIndex = issueListNavigation.handleKeyDown('home', selectedIndex);
        } else if (key.ctrl && _input === 'e') {
          newIndex = issueListNavigation.handleKeyDown('end', selectedIndex);
        } else if (key.pageUp) {
          newIndex = issueListNavigation.handleKeyDown('pageup', selectedIndex);
        } else if (key.pageDown) {
          newIndex = issueListNavigation.handleKeyDown('pagedown', selectedIndex);
        } else if (key.return) {
          issueListNavigation.handleKeyDown('enter', selectedIndex);
          handled = true;
        } else if (_input >= '1' && _input <= '9') {
          const numericIndex = parseInt(_input) - 1;
          if (numericIndex < filteredIssues.length) {
            newIndex = numericIndex;
            issueListNavigation.handleKeyDown('enter', numericIndex);
            handled = true;
          }
        }

        if (newIndex !== selectedIndex) {
          setSelectedIndex(newIndex);
          if (filteredIssues[newIndex]) {
            setSelectedIssue(filteredIssues[newIndex] ?? null);
          }
        }
      }
    }
  });

  return {
    currentView,
    selectedIssue,
    selectedIndex,
    setCurrentView,
    setSelectedIssue,
    navigateToIssue: (index: number) => {
      if (index >= 0 && index < filteredIssues.length) {
        setSelectedIndex(index);
        setSelectedIssue(filteredIssues[index] ?? null);
        setCurrentView('issue-details');
        addToNavigationHistory('issue-details', index);
      }
    },
    goBack,
  };
}

export function useMenuNavigation(
  itemCount: number,
  onSelect: (index: number) => void,
  onCancel: () => void,
  isOpen: boolean
) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const menuNavigation = createMenuNavigation(itemCount, onSelect, onCancel);

  const _handleKeyDown = useCallback(
    (key: string, currentIndex: number) => {
      const result = menuNavigation.handleKeyDown(key, currentIndex);

      if (result.action === 'select') {
        onSelect(result.index);
        return result.index;
      } else if (result.action === 'cancel') {
        onCancel();
        return currentIndex;
      } else {
        return result.index;
      }
    },
    [menuNavigation, onSelect, onCancel]
  );

  useInput((_input, key) => {
    if (!isOpen) return;

    let newIndex = selectedIndex;

    if (key.upArrow || _input === 'k') {
      newIndex = Math.max(0, selectedIndex - 1);
    } else if (key.downArrow || _input === 'j') {
      newIndex = Math.min(itemCount - 1, selectedIndex + 1);
    } else if (key.ctrl && _input === 'a') {
      newIndex = 0;
    } else if (key.ctrl && _input === 'e') {
      newIndex = itemCount - 1;
    } else if (key.return || _input === ' ') {
      onSelect(selectedIndex);
      return;
    } else if (key.escape) {
      onCancel();
      return;
    } else if (_input >= '1' && _input <= '9') {
      const numericIndex = parseInt(_input) - 1;
      if (numericIndex < itemCount) {
        newIndex = numericIndex;
        onSelect(numericIndex);
        return;
      }
    }

    if (newIndex !== selectedIndex) {
      setSelectedIndex(newIndex);
    }
  });

  // Reset selection when menu opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  return {
    selectedIndex,
    setSelectedIndex,
  };
}
