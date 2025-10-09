/**
 * Filter Indicators Component
 * Shows active filters as removable badges
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useFilterStore } from '../../hooks/useFilterStore';

interface FilterIndicatorsProps {
  onClearFilter: (filterType: string, value?: string) => void;
  onClearAll: () => void;
}

export const FilterIndicators: React.FC<FilterIndicatorsProps> = ({
  onClearFilter: _onClearFilter,
  onClearAll: _onClearAll,
}) => {
  const { filters, search } = useFilterStore();

  const getActiveFilters = () => {
    const activeFilters: Array<{
      type: string;
      value: string;
      display: string;
      color?: string;
    }> = [];

    // Severity filters
    if (filters.severity?.length) {
      filters.severity.forEach(severity => {
        activeFilters.push({
          type: 'severity',
          value: severity,
          display: `Severity: ${severity}`,
          color: getSeverityColor(severity),
        });
      });
    }

    // Tool filters
    if (filters.tools?.length) {
      filters.tools.forEach(tool => {
        activeFilters.push({
          type: 'tool',
          value: tool,
          display: `Tool: ${tool}`,
          color: 'blue',
        });
      });
    }

    // Priority filters
    if (filters.priority?.length) {
      filters.priority.forEach(priority => {
        activeFilters.push({
          type: 'priority',
          value: priority,
          display: `Priority: ${priority}`,
          color: getPriorityColor(priority),
        });
      });
    }

    // File filters
    if (filters.files?.length) {
      filters.files.forEach(file => {
        activeFilters.push({
          type: 'file',
          value: file,
          display: `File: ${file}`,
          color: 'cyan',
        });
      });
    }

    // Module filters
    if (filters.modules?.length) {
      filters.modules.forEach(module => {
        activeFilters.push({
          type: 'module',
          value: module,
          display: `Module: ${module}`,
          color: 'magenta',
        });
      });
    }

    // Score range filter
    if (filters.scoreRange && (filters.scoreRange[0] > 1 || filters.scoreRange[1] < 10)) {
      activeFilters.push({
        type: 'scoreRange',
        value: `${filters.scoreRange[0]}-${filters.scoreRange[1]}`,
        display: `Score: ${filters.scoreRange[0]}-${filters.scoreRange[1]}`,
        color: 'yellow',
      });
    }

    // Fixable filter
    if (filters.hasFix !== undefined) {
      activeFilters.push({
        type: 'hasFix',
        value: filters.hasFix.toString(),
        display: filters.hasFix ? 'Fixable only' : 'Not fixable',
        color: filters.hasFix ? 'green' : 'red',
      });
    }

    // Search query
    if (search.query.trim()) {
      activeFilters.push({
        type: 'search',
        value: search.query,
        display: `Search: "${search.query}"`,
        color: 'green',
      });
    }

    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) {
    return (
      <Box flexDirection="row" alignItems="center">
        <Text color="gray">No active filters</Text>
        <Box paddingLeft={1}>
          <Text color="gray">Press [Ctrl+F] to add filters</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Filter count */}
      <Box flexDirection="row" alignItems="center" marginBottom={1}>
        <Text color="blue" bold>
          Active Filters ({activeFilters.length}):
        </Text>
        <Box paddingLeft={2}>
          <Text color="red" backgroundColor="gray">
            [Clear All]
          </Text>
        </Box>
        <Box paddingLeft={1}>
          <Text color="gray">Press [Ctrl+F] to modify</Text>
        </Box>
      </Box>

      {/* Filter badges */}
      <Box flexDirection="row" flexWrap="wrap">
        {activeFilters.map((filter, index) => (
          <Box
            key={`${filter.type}-${filter.value}-${index}`}
            flexDirection="row"
            alignItems="center"
            marginRight={1}
            marginBottom={1}
            paddingX={1}
            backgroundColor={filter.color ?? 'gray'}
          >
            <Text color="white" dimColor>
              {filter.display}
            </Text>
            <Box paddingLeft={1}>
              <Text color="white" bold>
                ×
              </Text>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Filter summary */}
      <Box flexDirection="row" marginTop={1}>
        <Text color="gray" dimColor>
          {activeFilters.length === 1
            ? '1 filter applied'
            : `${activeFilters.length} filters applied`}
        </Text>
      </Box>
    </Box>
  );
};

/**
 * Helper functions for colors
 */
function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    case 'info':
      return 'blue';
    default:
      return 'gray';
  }
}

function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'critical':
      return 'red';
    case 'high':
      return 'orange';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'green';
    default:
      return 'gray';
  }
}

export default FilterIndicators;
