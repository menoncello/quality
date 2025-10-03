/**
 * Filter bar component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import { getSeveritySymbol } from '../../utils/color-coding';
import type { IssueSeverity as _IssueSeverity } from '../../types/dashboard';

export function FilterBar(): React.ReactElement {
  const { filters, filteredIssues } = useDashboardStore();
  const { severity, tools, fixable, searchQuery } = filters;

  // Count active filters
  const activeFilterCount = [
    severity.length < 3 ? 1 : 0,
    tools.length > 0 ? 1 : 0,
    fixable !== null ? 1 : 0,
    searchQuery.trim() !== '' ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  // Get severity filter display
  const getSeverityDisplay = () => {
    if (severity.length === 3) return 'All';
    return severity
      .map(s => {
        const symbol = getSeveritySymbol(s);
        return `${symbol}${s.charAt(0).toUpperCase()}`;
      })
      .join(' ');
  };

  // Get other filters display
  const getOtherFiltersDisplay = () => {
    const parts: string[] = [];

    if (tools.length > 0) {
      parts.push(`Tools: ${tools.length}`);
    }

    if (fixable !== null) {
      parts.push(`Fixable: ${fixable ? 'Yes' : 'No'}`);
    }

    if (searchQuery.trim() !== '') {
      parts.push(`Search: "${searchQuery}"`);
    }

    return parts.join(' | ');
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box justifyContent="space-between">
        <Box>
          <Text color="gray" dimColor>
            Filters:
          </Text>
          <Text color="cyan"> {getSeverityDisplay()}</Text>
          {activeFilterCount > 0 && <Text color="yellow"> ({activeFilterCount} active)</Text>}
        </Box>

        <Box>
          <Text color="gray" dimColor>
            Press 'f' to modify filters
          </Text>
        </Box>
      </Box>

      {/* Additional filter details */}
      {(tools.length > 0 || fixable !== null || searchQuery.trim() !== '') && (
        <Box>
          <Text color="gray" dimColor>
            {' '}
            {getOtherFiltersDisplay()}
          </Text>
        </Box>
      )}

      {/* Results count */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Showing {filteredIssues.length} issues
        </Text>
      </Box>
    </Box>
  );
}
