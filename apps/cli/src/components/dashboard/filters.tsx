/**
 * Filter bar component - simplified
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';

export function FilterBar(): React.ReactElement {
  const { filters, filteredIssues } = useDashboardStore();
  const { severity } = filters;

  const getSeverityDisplay = () => {
    if (severity.length === 3) return 'All';
    return severity.map(s => s.charAt(0).toUpperCase()).join('');
  };

  return (
    <Box marginBottom={2}>
      <Text>
        Filters: <Text color="cyan">{getSeverityDisplay()}</Text> |
        Showing <Text color="yellow">{filteredIssues.length}</Text> issues |
        Press 'f' to modify
      </Text>
    </Box>
  );
}