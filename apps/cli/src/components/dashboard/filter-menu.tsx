/**
 * Filter menu component
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useFilters } from '../../hooks/useFilters';
import { useMenuNavigation } from '../../hooks/useNavigation';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import { getSeverityColor, getSeveritySymbol } from '../../utils/color-coding';
import type { IssueSeverity as _IssueSeverity } from '../../types/dashboard';

interface FilterMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterMenu({ isOpen, onClose }: FilterMenuProps): React.ReactElement | null {
  if (!isOpen) return null;

  const {
    filters,
    availableSeverities,
    availableTools,
    toggleSeverity,
    toggleTool,
    toggleFixable,
    setSearchQuery,
    clearAllFilters,
  } = useFilters();

  const { toggleFilterMenu } = useDashboardStore();
  const [searchQuery, setSearchQueryState] = useState(filters.searchQuery);
  const [currentSection, setCurrentSection] = useState<'severity' | 'tools' | 'fixable' | 'search'>(
    'severity'
  );

  // Calculate total menu items
  const severityItems = availableSeverities.length;
  const toolItems = Math.min(availableTools.length, 10); // Limit to first 10 tools
  const fixableItems = 1;
  const searchItems = 1;
  const actionItems = 2; // Clear filters, Apply filters
  const totalItems = severityItems + toolItems + fixableItems + searchItems + actionItems;

  const { selectedIndex } = useMenuNavigation(
    totalItems,
    index => handleMenuAction(index),
    onClose,
    isOpen
  );

  const handleMenuAction = (index: number) => {
    let currentOffset = 0;

    // Check if it's a severity item
    if (index < severityItems) {
      const severity = availableSeverities[index];
      if (severity) {
        toggleSeverity(severity);
      }
      return;
    }
    currentOffset += severityItems;

    // Check if it's a tool item
    if (index < currentOffset + toolItems) {
      const toolIndex = index - currentOffset;
      if (toolIndex < availableTools.length) {
        const tool = availableTools[toolIndex];
        if (tool) {
          toggleTool(tool);
        }
      }
      return;
    }
    currentOffset += toolItems;

    // Check if it's the fixable item
    if (index < currentOffset + fixableItems) {
      toggleFixable();
      return;
    }
    currentOffset += fixableItems;

    // Check if it's the search item
    if (index < currentOffset + searchItems) {
      setCurrentSection('search');
      return;
    }
    currentOffset += searchItems;

    // Check if it's an action item
    if (index < currentOffset + actionItems) {
      const actionIndex = index - currentOffset;
      if (actionIndex === 0) {
        clearAllFilters();
        setSearchQueryState('');
      } else if (actionIndex === 1) {
        setSearchQuery(searchQuery);
        onClose();
        toggleFilterMenu();
      }
      return;
    }
  };

  // Handle search input
  useInput((input, key) => {
    if (currentSection === 'search' && isOpen) {
      if (key.return) {
        setSearchQuery(searchQuery);
        setCurrentSection('severity');
        return;
      } else if (key.escape) {
        setSearchQueryState(filters.searchQuery);
        setCurrentSection('severity');
        return;
      } else if (key.backspace || key.delete) {
        setSearchQueryState(prev => prev.slice(0, -1));
        return;
      } else if (input && !key.ctrl && !key.meta) {
        setSearchQueryState(prev => prev + input);
        return;
      }
    }
  });

  // Render severity section
  const renderSeveritySection = () => (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Severity Filter
        </Text>
      </Box>
      {availableSeverities.map((severity, index) => {
        const isSelected = filters.severity.includes(severity);
        const isHighlighted = currentSection === 'severity' && index === selectedIndex;

        return (
          <Box key={severity} marginLeft={1}>
            <Text color={isHighlighted ? 'white' : 'gray'}>[{isSelected ? '✓' : ' '}]</Text>
            <Text color={getSeverityColor(severity)}> {getSeveritySymbol(severity)}</Text>
            <Text color={isHighlighted ? 'white' : 'reset'}>
              {' '}
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </Text>
          </Box>
        );
      })}
    </Box>
  );

  // Render tools section
  const renderToolsSection = () => (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Tools Filter
        </Text>
        <Text color="gray" dimColor>
          {' '}
          (showing first {Math.min(availableTools.length, 10)} of {availableTools.length})
        </Text>
      </Box>
      {availableTools.slice(0, 10).map((tool, index) => {
        const isSelected = filters.tools.includes(tool);
        const _itemIndex = availableSeverities.length + index;
        const isHighlighted =
          currentSection === 'tools' && index === selectedIndex - availableSeverities.length;

        return (
          <Box key={tool} marginLeft={1}>
            <Text color={isHighlighted ? 'white' : 'gray'}>[{isSelected ? '✓' : ' '}]</Text>
            <Text color={isHighlighted ? 'white' : 'reset'}> {tool}</Text>
          </Box>
        );
      })}
    </Box>
  );

  // Render fixable section
  const renderFixableSection = () => {
    const fixableIndex = availableSeverities.length + Math.min(availableTools.length, 10);
    const isHighlighted = currentSection === 'fixable' && selectedIndex === fixableIndex;

    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Fixable Filter
          </Text>
        </Box>
        <Box marginLeft={1}>
          <Text color={isHighlighted ? 'white' : 'gray'}>
            [{filters.fixable === true ? '✓' : filters.fixable === false ? '✗' : ' '}]
          </Text>
          <Text color={isHighlighted ? 'white' : 'reset'}>
            {' '}
            {filters.fixable === true
              ? 'Fixable only'
              : filters.fixable === false
                ? 'Non-fixable only'
                : 'All issues'}
          </Text>
        </Box>
      </Box>
    );
  };

  // Render search section
  const renderSearchSection = () => {
    const searchIndex = availableSeverities.length + Math.min(availableTools.length, 10) + 1;
    const isHighlighted = currentSection === 'search' && selectedIndex === searchIndex;

    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Search Filter
          </Text>
        </Box>
        <Box marginLeft={1}>
          <Text color={(isHighlighted ?? currentSection === 'search') ? 'white' : 'gray'}>
            [{currentSection === 'search' ? '>' : ' '}]
          </Text>
          <Text color={currentSection === 'search' ? 'white' : 'reset'}>
            {' '}
            {searchQuery ?? '(type to search...)'}
          </Text>
          {currentSection === 'search' && (
            <Text color="gray" dimColor>
              {' '}
              [Enter to apply, Esc to cancel]
            </Text>
          )}
        </Box>
      </Box>
    );
  };

  // Render actions section
  const renderActionsSection = () => {
    const actionStartIndex = availableSeverities.length + Math.min(availableTools.length, 10) + 2;
    const clearIndex = actionStartIndex;
    const applyIndex = actionStartIndex + 1;

    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Actions
          </Text>
        </Box>
        <Box marginLeft={1}>
          <Text color={selectedIndex === clearIndex ? 'white' : 'gray'}>
            [{selectedIndex === clearIndex ? '>' : ' '}]
          </Text>
          <Text color={selectedIndex === clearIndex ? 'white' : 'reset'}> Clear all filters</Text>
        </Box>
        <Box marginLeft={1}>
          <Text color={selectedIndex === applyIndex ? 'white' : 'gray'}>
            [{selectedIndex === applyIndex ? '>' : ' '}]
          </Text>
          <Text color={selectedIndex === applyIndex ? 'white' : 'green'}> Apply filters</Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="blue" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          Filter Options
        </Text>
      </Box>

      {renderSeveritySection()}
      {renderToolsSection()}
      {renderFixableSection()}
      {renderSearchSection()}
      {renderActionsSection()}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          ↑↓ Navigate | Space: Toggle | Enter: Select | Esc: Close
        </Text>
      </Box>
    </Box>
  );
}
